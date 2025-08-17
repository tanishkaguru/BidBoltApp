const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const authenticateToken = require("../middleware/authM.js");

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "username", "name", "email", "createdAt"],
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Fetch profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
