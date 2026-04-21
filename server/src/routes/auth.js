import { Router } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import env from "../config/env.js";
import logger from "../lib/logger.js";
import { protect } from "../middleware/auth.js";

const router = Router();

const generateAccessToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = async (user) => {
  const token = jwt.sign({ id: user._id }, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  const refreshToken = new RefreshToken({
    userId: user._id,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  await refreshToken.save();
  return token;
};

const sendTokenResponse = async (user, statusCode, res) => {
  try {
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user);

    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.status(statusCode).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    logger.error("Token response generation failed:", err);
    res.status(500).json({ error: "Failed to establish secure session" });
  }
};

// POST /api/auth/register
router.post("/register", async (req, res) => {
  let session = null;
  try {
    // Check if we are on a replica set (required for transactions)
    let isReplicaSet = false;
    try {
      isReplicaSet =
        mongoose.connection.host.includes("replicaSet") ||
        (await mongoose.connection.db
          .admin()
          .serverStatus()
          .then((s) => !!s.repl));
    } catch (err) {
      logger.warn("Could not detect replica set status, defaulting to standalone mode.");
      isReplicaSet = false;
    }

    if (isReplicaSet) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const { name, email, password, adminKey } = req.body;

    const userExists = await User.findOne({ email }).session(session);
    if (userExists) {
      throw new Error("User already exists");
    }

    const role = adminKey === env.ADMIN_REGISTRATION_KEY ? "admin" : "user";
    const user = await User.create([{ name, email, password, role }], {
      session,
    });

    if (session) await session.commitTransaction();
    await sendTokenResponse(user[0], 201, res);
  } catch (err) {
    if (session) await session.abortTransaction();
    logger.error("Registration failed:", err);
    res.status(400).json({ error: err.message });
  } finally {
    if (session) session.endSession();
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.comparePassword(password))) {
      await sendTokenResponse(user, 200, res);
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: "Refresh token missing" });

    const refreshToken = await RefreshToken.findOne({ token });
    if (!refreshToken || !refreshToken.isActive) {
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }

    // Token Rotation: Revoke old one, generate new ones
    refreshToken.revokedAt = Date.now();
    await refreshToken.save();

    const user = await User.findById(refreshToken.userId);
    await sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(401).json({ error: "Refresh failed" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  res.cookie("accessToken", "none", { expires: new Date(0), httpOnly: true });
  res.cookie("refreshToken", "none", { expires: new Date(0), httpOnly: true });
  res.status(200).json({ success: true });
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

export default router;
