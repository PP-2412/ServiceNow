const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events for logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.userId }).sort({ startTime: 1 });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post(
  '/',
  [
    auth,
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, startTime, endTime } = req.body;

      // Validate end time is after start time
      if (new Date(endTime) <= new Date(startTime)) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }

      const event = new Event({
        title,
        startTime,
        endTime,
        userId: req.userId
      });

      await event.save();
      res.status(201).json(event);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private
router.put(
  '/:id',
  [
    auth,
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('startTime').optional().isISO8601().withMessage('Valid start time is required'),
    body('endTime').optional().isISO8601().withMessage('Valid end time is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const event = await Event.findOne({ _id: req.params.id, userId: req.userId });

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Prevent updating events that are in SWAP_PENDING
      if (event.status === 'SWAP_PENDING') {
        return res.status(400).json({ message: 'Cannot update event with pending swap' });
      }

      const { title, startTime, endTime } = req.body;

      if (title) event.title = title;
      if (startTime) event.startTime = startTime;
      if (endTime) event.endTime = endTime;

      // Validate end time is after start time
      if (new Date(event.endTime) <= new Date(event.startTime)) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }

      await event.save();
      res.json(event);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PATCH /api/events/:id/status
// @desc    Update event status
// @access  Private
router.patch(
  '/:id/status',
  [
    auth,
    body('status').isIn(['BUSY', 'SWAPPABLE', 'SWAP_PENDING']).withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const event = await Event.findOne({ _id: req.params.id, userId: req.userId });

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Only allow changing from BUSY to SWAPPABLE or SWAPPABLE to BUSY
      // SWAP_PENDING should only be set by the system
      if (req.body.status === 'SWAP_PENDING') {
        return res.status(400).json({ message: 'Cannot manually set SWAP_PENDING status' });
      }

      if (event.status === 'SWAP_PENDING') {
        return res.status(400).json({ message: 'Cannot change status of event with pending swap' });
      }

      event.status = req.body.status;
      await event.save();
      res.json(event);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, userId: req.userId });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Prevent deleting events that are in SWAP_PENDING
    if (event.status === 'SWAP_PENDING') {
      return res.status(400).json({ message: 'Cannot delete event with pending swap' });
    }

    await Event.deleteOne({ _id: req.params.id });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
