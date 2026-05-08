# Expert Session Booking System

A real-time expert session booking platform built with React, Node.js, Express, MongoDB, and Socket.io.

## What’s included

- Expert listing with search, category filter, pagination, loading states, and error states
- Expert detail page with date-grouped availability
- Real-time slot locking via Socket.io when another user books the same expert slot
- Booking form with client and server validation
- My Bookings view by email with live status updates
- Double-booking protection using a MongoDB unique compound index on `expert + date + timeSlot`
- Extra functionality:
  - Auto-seeded demo experts on first backend start
  - Ops view to update booking statuses from the UI
  - Booking overview cards for quick session insights

## Tech stack

- Frontend: React + Vite + React Router + Socket.io Client
- Backend: Node.js + Express + Mongoose + Socket.io
- Database: MongoDB

## Project structure

```text
backend/
  src/
    config/
    controllers/
    data/
    middlewares/
    models/
    routes/
    seed/
    services/
    socket/
    utils/
frontend/
  src/
    api/
    components/
    lib/
    pages/
```

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Start MongoDB

Option A: Docker

```bash
docker compose up -d
```

Option B: Local MongoDB

Use a local MongoDB service and keep the default URI:

```text
mongodb://127.0.0.1:27017/expert-session-booking
```

### 3. Configure environment variables

Create these files from the examples:

```bash
backend/.env
frontend/.env
```

`backend/.env`

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/expert-session-booking
AUTO_SEED=true
```

`frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000
```

### 4. Run the app

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

### 5. Stop MongoDB when you're done

```bash
docker compose down
```

## Required APIs

- `GET /experts?page=&limit=&search=&category=`
- `GET /experts/:id`
- `POST /bookings`
- `PATCH /bookings/:id/status`
- `GET /bookings?email=`

Additional helper endpoints:

- `GET /bookings/manage/all`
- `GET /bookings/overview/stats`
- `GET /health`

## Race condition protection

Double booking is blocked by a unique MongoDB index:

```text
{ expert: 1, date: 1, timeSlot: 1 }
```

Even if two users submit the same slot at nearly the same time, only one insert succeeds.

## Render deployment

This repo includes [render.yaml](./render.yaml) for a single Render web service that:

- installs dependencies
- builds the React frontend
- serves the built frontend from the Express backend

### Render environment variables

Set these in Render:

- `MONGODB_URI`
- `CLIENT_URL`

Recommended values:

- `MONGODB_URI`: your MongoDB Atlas URI or another reachable MongoDB connection string
- `CLIENT_URL`: your deployed Render app URL, such as `https://your-app-name.onrender.com`

### Important note about MongoDB on Render

Render does not provide a managed MongoDB product. For the easiest deployment, use MongoDB Atlas and set its URI as `MONGODB_URI`.

For local development, Docker Compose in this repo starts MongoDB for you on `localhost:27017`.

## Suggested demo flow for your submission video

1. Open the expert list and show search, category filtering, and pagination.
2. Open one expert detail page and show available slots.
3. Open the same expert in another tab.
4. Book a slot in one tab and show the slot becoming unavailable in the other tab in real time.
5. Open My Bookings and search by email.
6. Open Ops View and update a booking from `Pending` to `Confirmed` or `Completed`.
7. Return to My Bookings and show the live status update.

## Verification completed locally

- Backend module import check passed
- Frontend production build passed
- Backend health endpoint passed against a live MongoDB container
- Frontend dev server responded on `http://localhost:5173`
- Booking creation passed
- Duplicate booking attempt correctly returned `409 Conflict`
- My Bookings lookup returned the created booking

## Notes

- Experts are automatically seeded into MongoDB if the database starts empty.
- Deployment is optional; this repo is ready for local demo and can be deployed with a standard Node + static frontend setup.
