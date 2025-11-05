# SlotSwapper 🔄

A peer-to-peer time-slot scheduling application that allows users to swap their busy calendar slots with other users. Built as part of the ServiceHive Full Stack Intern technical challenge.

## 🌐 Live Demo

- **Frontend**: [https://service-now-tan.vercel.app](https://service-now-tan.vercel.app)
- **Backend API**: [https://servicenow-production.up.railway.app](https://servicenow-production.up.railway.app)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [API Documentation](#api-documentation)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Challenges & Solutions](#challenges--solutions)
- [Future Enhancements](#future-enhancements)

## 🎯 Overview

SlotSwapper enables users to:
1. Create and manage calendar events with busy time slots
2. Mark slots as "swappable" to offer them to other users
3. Browse a marketplace of available swappable slots from other users
4. Request to swap their slots with others
5. Accept or reject incoming swap requests
6. Automatically exchange slot ownership upon acceptance

**Example Flow**:
- User A has a "Team Meeting" on Tuesday 10:00-11:00 AM (marked as swappable)
- User B has a "Focus Block" on Wednesday 2:00-3:00 PM (marked as swappable)
- User A requests to swap their Tuesday slot for User B's Wednesday slot
- User B accepts → calendars are automatically updated for both users

## ✨ Features

### Core Features
- ✅ **JWT Authentication**: Secure user signup and login
- ✅ **Calendar Management**: Full CRUD operations for events
- ✅ **Event Status Management**: Toggle between BUSY, SWAPPABLE, and SWAP_PENDING states
- ✅ **Marketplace**: Browse and search available swappable slots from other users
- ✅ **Swap Requests**: Create and manage swap proposals
- ✅ **Notifications**: View incoming and outgoing swap requests
- ✅ **Atomic Transactions**: MongoDB sessions ensure data consistency during swaps
- ✅ **Responsive Design**: Mobile-friendly UI with gradient design

### Technical Highlights
- **Transaction Safety**: Uses MongoDB sessions to ensure both slots are updated atomically
- **State Management**: React Context API for global authentication state
- **Protected Routes**: Frontend route guards for authenticated-only pages
- **Input Validation**: Server-side validation with express-validator
- **Error Handling**: Comprehensive error messages and user feedback
- **CORS Configuration**: Secure cross-origin resource sharing setup

## 🛠 Technology Stack

### Frontend
- **React 18.2.0**: UI framework
- **React Router v6**: Client-side routing
- **Axios**: HTTP client for API calls
- **CSS3**: Custom styling with gradients and animations

### Backend
- **Node.js**: Runtime environment
- **Express 4.18**: Web framework
- **MongoDB**: NoSQL database (MongoDB Atlas)
- **Mongoose 7.5**: ODM for MongoDB
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **express-validator**: Request validation

### DevOps & Deployment
- **Vercel**: Frontend hosting
- **Railway**: Backend hosting
- **MongoDB Atlas**: Cloud database hosting
- **Git**: Version control

## 🏗 Architecture & Design Decisions

### Database Schema

#### User Model
```javascript
{
  name: String,
  email: String (unique, lowercase),
  password: String (hashed),
  createdAt: Date
}
```

#### Event Model
```javascript
{
  title: String,
  startTime: Date,
  endTime: Date,
  status: Enum ['BUSY', 'SWAPPABLE', 'SWAP_PENDING'],
  userId: ObjectId (ref: User),
  createdAt: Date
}
```

#### SwapRequest Model
```javascript
{
  requester: ObjectId (ref: User),
  requestee: ObjectId (ref: User),
  requesterSlot: ObjectId (ref: Event),
  requesteeSlot: ObjectId (ref: Event),
  status: Enum ['PENDING', 'ACCEPTED', 'REJECTED'],
  createdAt: Date,
  respondedAt: Date
}
```

### Key Design Decisions

1. **Status-Based State Machine**: Events use three states to prevent race conditions
   - `BUSY`: Normal event, not available for swapping
   - `SWAPPABLE`: Available in marketplace
   - `SWAP_PENDING`: Currently involved in a pending swap request

2. **MongoDB Transactions**: Swap operations use sessions to ensure:
   - Both slots are updated atomically
   - No partial updates if an error occurs
   - Prevents concurrent swap conflicts

3. **Owner Exchange Pattern**: On swap acceptance, we exchange the `userId` field between events rather than modifying all event data, preserving the original time slots and titles

4. **JWT Token Storage**: Tokens stored in localStorage with 7-day expiration
   - Interceptor automatically adds Bearer token to all authenticated requests

5. **RESTful API Design**: Clear, predictable endpoint structure
   - `/api/auth/*` - Authentication
   - `/api/events/*` - Event management
   - `/api/swaps/*` - Swap operations

## 📚 API Documentation

### Base URL
- **Production**: `https://servicenow-production.up.railway.app/api`
- **Development**: `http://localhost:5000/api`

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | Login user | No |

#### POST `/auth/signup`
**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (201):
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/auth/login`
**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Event Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/events` | Get all user's events | Yes |
| POST | `/events` | Create new event | Yes |
| PUT | `/events/:id` | Update event | Yes |
| PATCH | `/events/:id/status` | Update event status | Yes |
| DELETE | `/events/:id` | Delete event | Yes |

#### GET `/events`
**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "_id": "event_id",
    "title": "Team Meeting",
    "startTime": "2024-11-10T10:00:00.000Z",
    "endTime": "2024-11-10T11:00:00.000Z",
    "status": "SWAPPABLE",
    "userId": "user_id",
    "createdAt": "2024-11-05T12:00:00.000Z"
  }
]
```

#### POST `/events`
**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "Team Meeting",
  "startTime": "2024-11-10T10:00:00.000Z",
  "endTime": "2024-11-10T11:00:00.000Z"
}
```

**Response** (201):
```json
{
  "_id": "event_id",
  "title": "Team Meeting",
  "startTime": "2024-11-10T10:00:00.000Z",
  "endTime": "2024-11-10T11:00:00.000Z",
  "status": "BUSY",
  "userId": "user_id",
  "createdAt": "2024-11-05T12:00:00.000Z"
}
```

#### PATCH `/events/:id/status`
**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "status": "SWAPPABLE"
}
```

**Response** (200):
```json
{
  "_id": "event_id",
  "title": "Team Meeting",
  "status": "SWAPPABLE",
  ...
}
```

### Swap Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/swaps/swappable-slots` | Get all swappable slots from other users | Yes |
| POST | `/swaps/swap-request` | Create a swap request | Yes |
| POST | `/swaps/swap-response/:requestId` | Accept/reject swap request | Yes |
| GET | `/swaps/my-requests` | Get user's incoming/outgoing requests | Yes |

#### GET `/swaps/swappable-slots`
**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "_id": "event_id",
    "title": "Focus Block",
    "startTime": "2024-11-12T14:00:00.000Z",
    "endTime": "2024-11-12T15:00:00.000Z",
    "status": "SWAPPABLE",
    "userId": {
      "_id": "other_user_id",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  }
]
```

#### POST `/swaps/swap-request`
**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "mySlotId": "my_event_id",
  "theirSlotId": "their_event_id"
}
```

**Response** (201):
```json
{
  "_id": "swap_request_id",
  "requester": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "requestee": {
    "_id": "other_user_id",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "requesterSlot": { /* event object */ },
  "requesteeSlot": { /* event object */ },
  "status": "PENDING",
  "createdAt": "2024-11-05T12:00:00.000Z"
}
```

#### POST `/swaps/swap-response/:requestId`
**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "accept": true
}
```

**Response** (200):
```json
{
  "message": "Swap accepted successfully",
  "swapRequest": { /* swap request object */ }
}
```

#### GET `/swaps/my-requests`
**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "incoming": [
    {
      "_id": "request_id",
      "requester": { /* user object */ },
      "requestee": { /* user object */ },
      "requesterSlot": { /* event object */ },
      "requesteeSlot": { /* event object */ },
      "status": "PENDING",
      "createdAt": "2024-11-05T12:00:00.000Z"
    }
  ],
  "outgoing": [
    /* similar structure */
  ]
}
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or Atlas account)
- npm or yarn package manager

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd slotswapper
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/slotswapper
# JWT_SECRET=your_secret_key_here
# NODE_ENV=development

# Start the backend server
npm run dev
```

Backend will run on `http://localhost:5000`

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration:
# REACT_APP_API_URL=http://localhost:5000/api

# Start the frontend development server
npm start
```

Frontend will run on `http://localhost:3000`

#### 4. Test the Application
1. Open `http://localhost:3000` in your browser
2. Sign up for a new account
3. Create some events and mark them as swappable
4. Open a second browser (incognito mode) and create another user
5. Test the swap functionality between users

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/slotswapper
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=production
FRONTEND_URL=https://service-now-tan.vercel.app
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://servicenow-production.up.railway.app/api
```

## 🌍 Deployment

### Backend (Railway)
1. Push code to GitHub
2. Connect Railway to your GitHub repository
3. Add environment variables in Railway dashboard
4. Deploy automatically on push to main branch

**Live Backend**: https://servicenow-production.up.railway.app

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

**Live Frontend**: https://service-now-tan.vercel.app

### Database (MongoDB Atlas)
- Database hosted on MongoDB Atlas free tier
- Connection string: `mongodb+srv://parthpatel_db_user:Parthp2005@slotswapper-cluster.jpd9mrv.mongodb.net/slotswapper`

## 🎓 Challenges & Solutions

### Challenge 1: Atomic Swap Transactions
**Problem**: Ensuring both event ownership changes happen together or not at all

**Solution**: Implemented MongoDB transactions using sessions
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Update both events
  await event1.save({ session });
  await event2.save({ session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

### Challenge 2: Preventing Concurrent Swaps
**Problem**: Multiple users requesting the same slot simultaneously

**Solution**: Introduced `SWAP_PENDING` status that locks slots during active swap requests. Status validation prevents multiple concurrent swaps.

### Challenge 3: CORS Issues in Production
**Problem**: Frontend on Vercel couldn't communicate with backend on Railway

**Solution**: Implemented dynamic CORS configuration with environment-based allowed origins:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);
```

### Challenge 4: State Management Across Components
**Problem**: Keeping authentication state synchronized across the app

**Solution**: Created AuthContext with React Context API to provide global authentication state and methods to all components.

### Challenge 5: Real-time UI Updates
**Problem**: UI not reflecting changes after swap acceptance

**Solution**: Implemented proper state refetching after mutations and used callback functions to trigger parent component updates.

### Technical Debt
- Add request rate limiting to prevent abuse
- Implement refresh tokens for better security
- Add database indexes for improved query performance
- Implement proper logging system (Winston/Morgan)
- Add API documentation with Swagger/OpenAPI

## 📝 Assumptions Made

1. **Single Database**: All users share the same database (no multi-tenancy)
2. **No Time Zone Handling**: All times stored in UTC, displayed in user's local time
3. **No Event Conflicts**: System doesn't check for overlapping events
4. **Simple Authentication**: No email verification or password reset
5. **No Pagination**: All lists load complete data (would need pagination for production)
6. **No File Uploads**: No support for attachments or images
7. **Manual Refresh**: No automatic polling for new swap requests
8. **No Admin Panel**: All users have equal permissions

**Note**: This application was built as part of the ServiceHive Full Stack Intern technical challenge. The focus was on demonstrating full-stack development skills, particularly complex backend logic with transaction handling, RESTful API design, and modern React patterns.
