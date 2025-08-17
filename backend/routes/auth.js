const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const authenticateToken = require("../middleware/authM");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
// Register
router.post("/register", async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, name, email, password: hashed });
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 3600 * 1000,
        path: "/",
      })
      .status(201)
      .json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          isAdmin: user.isAdmin,
        },
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "All fields are required" });
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 3600 * 1000,
        path: "/",
      })
      .json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          isAdmin: user.isAdmin,
        },
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token").json({ message: "Logged out successfully" });
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "username", "name", "isAdmin"],
    });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
