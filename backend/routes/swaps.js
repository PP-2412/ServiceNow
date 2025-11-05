const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const SwapRequest = require('../models/SwapRequest');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/swaps/swappable-slots
// @desc    Get all swappable slots from other users
// @access  Private
router.get('/swappable-slots', auth, async (req, res) => {
  try {
    const swappableSlots = await Event.find({
      status: 'SWAPPABLE',
      userId: { $ne: req.userId }
    })
      .populate('userId', 'name email')
      .sort({ startTime: 1 });

    res.json(swappableSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/swaps/swap-request
// @desc    Create a swap request
// @access  Private
router.post(
  '/swap-request',
  [
    auth,
    body('mySlotId').isMongoId().withMessage('Invalid slot ID'),
    body('theirSlotId').isMongoId().withMessage('Invalid slot ID')
  ],
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await session.abortTransaction();
        return res.status(400).json({ errors: errors.array() });
      }

      const { mySlotId, theirSlotId } = req.body;

      // Validate that user is not trying to swap with themselves
      if (mySlotId === theirSlotId) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Cannot swap a slot with itself' });
      }

      // Get both slots with session
      const mySlot = await Event.findOne({ _id: mySlotId, userId: req.userId }).session(session);
      const theirSlot = await Event.findById(theirSlotId).session(session);

      // Validate both slots exist
      if (!mySlot) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Your slot not found' });
      }

      if (!theirSlot) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Requested slot not found' });
      }

      // Validate user owns their slot
      if (mySlot.userId.toString() !== req.userId) {
        await session.abortTransaction();
        return res.status(403).json({ message: 'You do not own this slot' });
      }

      // Validate user is not requesting their own slot
      if (theirSlot.userId.toString() === req.userId) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Cannot request swap with your own slot' });
      }

      // Validate both slots are SWAPPABLE
      if (mySlot.status !== 'SWAPPABLE') {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Your slot must be SWAPPABLE' });
      }

      if (theirSlot.status !== 'SWAPPABLE') {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Requested slot is no longer available' });
      }

      // Check for existing pending request between these slots
      const existingRequest = await SwapRequest.findOne({
        $or: [
          { requesterSlot: mySlotId, requesteeSlot: theirSlotId },
          { requesterSlot: theirSlotId, requesteeSlot: mySlotId }
        ],
        status: 'PENDING'
      }).session(session);

      if (existingRequest) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'A pending swap request already exists for these slots' });
      }

      // Update both slots to SWAP_PENDING
      mySlot.status = 'SWAP_PENDING';
      theirSlot.status = 'SWAP_PENDING';

      await mySlot.save({ session });
      await theirSlot.save({ session });

      // Create swap request
      const swapRequest = new SwapRequest({
        requester: req.userId,
        requestee: theirSlot.userId,
        requesterSlot: mySlotId,
        requesteeSlot: theirSlotId
      });

      await swapRequest.save({ session });

      await session.commitTransaction();

      // Populate the swap request for response
      await swapRequest.populate([
        { path: 'requester', select: 'name email' },
        { path: 'requestee', select: 'name email' },
        { path: 'requesterSlot' },
        { path: 'requesteeSlot' }
      ]);

      res.status(201).json(swapRequest);
    } catch (error) {
      await session.abortTransaction();
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    } finally {
      session.endSession();
    }
  }
);

// @route   POST /api/swaps/swap-response/:requestId
// @desc    Accept or reject a swap request
// @access  Private
router.post(
  '/swap-response/:requestId',
  [
    auth,
    body('accept').isBoolean().withMessage('Accept must be true or false')
  ],
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await session.abortTransaction();
        return res.status(400).json({ errors: errors.array() });
      }

      const { accept } = req.body;
      const swapRequest = await SwapRequest.findById(req.params.requestId).session(session);

      if (!swapRequest) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Swap request not found' });
      }

      // Verify the user is the requestee (receiver of the swap request)
      if (swapRequest.requestee.toString() !== req.userId) {
        await session.abortTransaction();
        return res.status(403).json({ message: 'You are not authorized to respond to this request' });
      }

      // Check if request is still pending
      if (swapRequest.status !== 'PENDING') {
        await session.abortTransaction();
        return res.status(400).json({ message: 'This swap request has already been responded to' });
      }

      // Get both slots
      const requesterSlot = await Event.findById(swapRequest.requesterSlot).session(session);
      const requesteeSlot = await Event.findById(swapRequest.requesteeSlot).session(session);

      if (!requesterSlot || !requesteeSlot) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'One or both slots not found' });
      }

      if (accept) {
        // ACCEPT: Swap the ownership of the slots
        const tempUserId = requesterSlot.userId;
        requesterSlot.userId = requesteeSlot.userId;
        requesteeSlot.userId = tempUserId;

        // Set both slots back to BUSY after successful swap
        requesterSlot.status = 'BUSY';
        requesteeSlot.status = 'BUSY';

        await requesterSlot.save({ session });
        await requesteeSlot.save({ session });

        swapRequest.status = 'ACCEPTED';
        swapRequest.respondedAt = new Date();
        await swapRequest.save({ session });

        await session.commitTransaction();

        await swapRequest.populate([
          { path: 'requester', select: 'name email' },
          { path: 'requestee', select: 'name email' },
          { path: 'requesterSlot' },
          { path: 'requesteeSlot' }
        ]);

        res.json({
          message: 'Swap accepted successfully',
          swapRequest
        });
      } else {
        // REJECT: Set both slots back to SWAPPABLE
        requesterSlot.status = 'SWAPPABLE';
        requesteeSlot.status = 'SWAPPABLE';

        await requesterSlot.save({ session });
        await requesteeSlot.save({ session });

        swapRequest.status = 'REJECTED';
        swapRequest.respondedAt = new Date();
        await swapRequest.save({ session });

        await session.commitTransaction();

        await swapRequest.populate([
          { path: 'requester', select: 'name email' },
          { path: 'requestee', select: 'name email' },
          { path: 'requesterSlot' },
          { path: 'requesteeSlot' }
        ]);

        res.json({
          message: 'Swap rejected successfully',
          swapRequest
        });
      }
    } catch (error) {
      await session.abortTransaction();
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    } finally {
      session.endSession();
    }
  }
);

// @route   GET /api/swaps/my-requests
// @desc    Get all swap requests (incoming and outgoing)
// @access  Private
router.get('/my-requests', auth, async (req, res) => {
  try {
    // Incoming requests (where user is the requestee)
    const incomingRequests = await SwapRequest.find({
      requestee: req.userId,
      status: 'PENDING'
    })
      .populate('requester', 'name email')
      .populate('requestee', 'name email')
      .populate('requesterSlot')
      .populate('requesteeSlot')
      .sort({ createdAt: -1 });

    // Outgoing requests (where user is the requester)
    const outgoingRequests = await SwapRequest.find({
      requester: req.userId,
      status: 'PENDING'
    })
      .populate('requester', 'name email')
      .populate('requestee', 'name email')
      .populate('requesterSlot')
      .populate('requesteeSlot')
      .sort({ createdAt: -1 });

    res.json({
      incoming: incomingRequests,
      outgoing: outgoingRequests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
