import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import env from "../config/env.js";
import logger from "../lib/logger.js";

export const protect = async (req, res, next) => {
  try {
    let token;
    // SaaS Standard: Check HttpOnly Cookies first
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } 
    // Fallback for direct API/Mobile calls
    else if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Access denied. Authentication required." });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ error: "Authenticated user no longer found." });
    }

    next();
  } catch (err) {
    logger.warn(`Auth failed: ${err.message}`);
    res.status(401).json({ error: "Token is invalid or expired." });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
