const mongoose = require("mongoose");

// LEVEL: BASIC
// Connects to MongoDB using the connection string in .env
// This is the very first thing that must work before anything else in the app makes sense.
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // If the DB doesn't connect, there's no point running the server — fail fast.
    process.exit(1);
  }
};

module.exports = connectDB;
