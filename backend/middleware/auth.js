const jwt = require("jsonwebtoken");
const User = require("../models/User");

// LEVEL: INTERMEDIATE → "JWT Authentication" + "role-based authentication"

// 1. protect: verifies the JWT sent in the Authorization header and attaches
//    the logged-in user to req.user so downstream controllers know who's calling.
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "User not found, token invalid" });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};

// 2. admin: gate that only lets role === "admin" through.
//    Used on routes like "create movie", "create show" — an ordinary user shouldn't
//    be able to hit those endpoints even if they craft the request manually.
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Not authorized as admin" });
};

module.exports = { protect, admin };
