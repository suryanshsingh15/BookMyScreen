# BookMyScreen — Full-Stack Movie Ticket Booking Platform

A movie ticket booking platform built with React, Node.js, Express, MongoDB, Socket.io, and Razorpay — matching the project as described on the resume. This README doubles as a **study guide**: it's organized basic → advanced so you can learn (and defend in an interview) each layer in order.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), React Router, Axios, Socket.io-client |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.io |
| Payments | Razorpay |
| Auth | JWT + bcrypt, role-based (`user` / `admin`) |
| Containerization | Docker, Docker Compose |

---

## 2. Project Structure

```
bookmyscreen/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── models/                   # User, Movie, Theatre, Show, Booking
│   ├── middleware/                # auth (JWT), validate, errorHandler, asyncHandler
│   ├── controllers/               # business logic per resource
│   ├── routes/                    # REST endpoints
│   ├── sockets/seatSocket.js      # real-time seat locking
│   ├── utils/seed.js              # demo data
│   ├── server.js                  # app entry point
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Home, MovieDetails, SeatSelection, Login, etc.
│   │   ├── components/            # Navbar, MovieCard, SeatMap, ProtectedRoute
│   │   ├── context/AuthContext.jsx
│   │   ├── services/               # api.js (Axios), socket.js (Socket.io client)
│   │   └── App.jsx
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

---

## 3. Running Locally (without Docker) — recommended while learning

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a free MongoDB Atlas cluster)
- A free Razorpay test account (dashboard.razorpay.com) for test API keys — the app runs fine without real payments if you just want to browse/select seats

### Backend
```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, RAZORPAY_KEY_ID/SECRET
npm install
npm run seed      # creates admin/user accounts + sample movies, theatre, show
npm run dev        # starts on http://localhost:5000
```

### Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev         # starts on http://localhost:5173
```

Open **http://localhost:5173**. Demo logins (created by the seed script):
- Admin: `admin@bookmyscreen.com` / `admin123`
- User: `user@bookmyscreen.com` / `user123`

---

## 4. Running with Docker

```bash
# from the project root
cp backend/.env.example backend/.env   # fill in RAZORPAY keys if testing payments
docker compose up --build
```

This starts three containers: `mongo`, `backend` (port 5000), `frontend` (port 8080, served by Nginx). Open **http://localhost:8080**. Run the seed script once against the running backend container:
```bash
docker exec -it bookmyscreen-backend npm run seed
```

---

## 5. Feature Walkthrough: Basic → Advanced
*(This mirrors the order you should actually explain the project in an interview.)*

### Level 1 — Basic
- **Express server + MongoDB connection** (`server.js`, `config/db.js`)
- **Data models**: Movie, Theatre, User (`models/`)
- **Movie & theatre discovery**: plain REST GET endpoints with query filters (`movieController.js`, `theatreController.js`)
- **CRUD** for movies/theatres, gated to admins

### Level 2 — Intermediate
- **JWT authentication**: register/login issue a signed token; `middleware/auth.js`'s `protect` verifies it on every private route
- **Role-based access control**: `admin` middleware blocks non-admins from management routes
- **Input validation**: `express-validator` checks request bodies before they ever reach a controller (`middleware/validate.js`)
- **Centralized error handling**: controllers just `throw new Error(...)`; one middleware (`errorHandler.js`) formats every error response consistently — no repeated try/catch blocks

### Level 3 — Advanced
- **Showtime management & seat-map generation**: `showController.js` reads a theatre's screen layout (rows, seat categories, price multipliers) and generates a full seat list per show
- **Real-time seat locking (Socket.io)**: `sockets/seatSocket.js` — when a user selects a seat, the server flips its status to `locked` in MongoDB and broadcasts that to everyone else viewing the same show (a Socket.io "room" keyed by showId), so two people can never lock the same seat. Locks auto-expire via `setTimeout` + a lazy check on fetch, so abandoned selections free up automatically.
- **Razorpay payment integration**: two-step flow — `createBookingOrder` creates a Razorpay order server-side (never trusting a client-supplied amount), then `verifyPayment` re-computes the HMAC-SHA256 signature server-side to confirm the payment is genuine before marking seats `booked`.
- **Docker containerization**: separate Dockerfiles for backend (Node) and frontend (multi-stage build → Nginx), orchestrated with `docker-compose.yml` alongside a MongoDB container.

---

## 6. Interview Talking Points (things you'll likely be asked)

- **"Why Socket.io instead of just polling the API?"** — Polling either wastes requests or has latency where two users could both see a seat as free and both try to book it. Socket.io pushes state changes instantly to everyone watching that show.
- **"How do you stop double-booking?"** — The lock check-and-set happens against MongoDB inside the socket handler, and a booking's `create-order` step re-verifies the seat is still locked by that exact user before creating a Razorpay order — so even a client trying to skip the lock step gets rejected.
- **"How do you verify a payment is real and not spoofed by the client?"** — Razorpay signs `order_id|payment_id` with your secret key. The backend recomputes that HMAC and compares it — this can't be forged without the secret key, which never reaches the browser.
- **"What happens if a user locks a seat and abandons the page?"** — A `setTimeout` on the server releases it after `SEAT_LOCK_TTL_SECONDS`, and any subsequent fetch of the show also lazily clears expired locks — so there are two independent mechanisms, not one single point of failure.

---

## 7. What's Deliberately Simplified (be upfront about this if asked)

- Seat categories/pricing are set at theatre-creation time via the admin form; a production app might let admins edit an existing theatre's layout too.
- No email/SMS confirmation after booking — could add via a service like SendGrid.
- No refund/cancellation flow — `Booking.status` supports `cancelled` in the schema, but there's no endpoint yet; a natural "what would you add next" answer.
