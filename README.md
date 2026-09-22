BookMyScreen

A full-stack movie ticket booking application built with React, Node.js, Express.js and MongoDB.

Overview

BookMyScreen is a web application that allows users to browse movies, view available shows, select seats and manage their bookings.

The application has a React-based frontend and a Node.js/Express backend with MongoDB for data storage. Real-time seat locking is handled using Socket.io to reduce the possibility of two users selecting the same seat at the same time.

Features

* User registration and login
* JWT-based authentication
* Role-based access for users and admins
* Browse movies and theatres
* View available shows
* Interactive seat selection
* Real-time seat locking with Socket.io
* Movie and show management for admins
* Booking history
* REST API-based backend
* MongoDB database using Mongoose
* Razorpay payment integration
* Docker and Docker Compose configuration

Tech Stack

Frontend

* React
* Vite
* React Router
* Axios
* Socket.io Client

Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcrypt
* Socket.io
* Razorpay

Tools

* Git
* GitHub
* Docker
* VS Code

Project Structure

BookMyScreen/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── docker-compose.yml
└── README.md

Getting Started

Prerequisites

Make sure you have the following installed:

* Node.js 18 or later
* MongoDB or a MongoDB Atlas account
* Git

1. Clone the repository

git clone https://github.com/suryanshsingh15/BookMyScreen.git
cd BookMyScreen

2. Setup the backend

cd backend
npm install

Create a .env file using .env.example and add your environment variables:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

Run the database seed script:

npm run seed

Start the backend:

npm run dev

The backend will run on:

http://localhost:5000

3. Setup the frontend

Open another terminal:

cd frontend
npm install
npm run dev

The frontend will be available at:

http://localhost:5173

Application Flow

User
  │
  ▼
React Frontend
  │
  ├── Authentication
  ├── Movie & Theatre Browsing
  ├── Show Selection
  ├── Seat Selection
  └── Booking
  │
  ▼
Express REST API
  │
  ├── Authentication & Authorization
  ├── Movie / Theatre / Show APIs
  ├── Booking APIs
  └── Payment APIs
  │
  ▼
MongoDB

Socket.io is used alongside the REST API for real-time seat-locking functionality.

Database

The application uses MongoDB with Mongoose.

The main data models include:

* User
* Movie
* Theatre
* Show
* Booking

Authentication

Authentication is handled using JSON Web Tokens (JWT).

Passwords are hashed using bcrypt before being stored in the database. Role-based authorization is used to restrict admin functionality.

Real-Time Seat Selection

Socket.io is used for real-time communication between clients and the server.

When a user selects a seat, the seat can be temporarily locked so that another user cannot select the same seat simultaneously.

Payments

Razorpay is integrated for handling the payment flow.

For local development, Razorpay test credentials can be configured through the backend .env file.

Docker

The project includes Docker configuration for running the application using Docker Compose.

docker compose up --build

Future Improvements

* Add movie search and filtering
* Improve theatre and screen management
* Add booking cancellation and refund support
* Add email/SMS booking notifications
* Improve seat-map customization
* Add additional payment options
* Improve mobile responsiveness

License

This project is intended for learning and demonstration purposes.


