const express = require("express");
const router = express.Router();
const Auction = require("../models/auction.js");
const redis = require("../config/redis");
const authenticateToken = require("../middleware/authM.js");

//Create an auction item
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      itemName,
      description,
      startingPrice,
      bidIncrement,
      goLiveAt,
      durationMinutes
    } = req.body;
    if (
      !itemName ||
      !startingPrice ||
      !bidIncrement ||
      !goLiveAt ||
      !durationMinutes
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      return res
        .status(400)
        .json({ error: "durationMinutes must be a positive number" });
    }
    const goLive = new Date(goLiveAt);
    if (isNaN(goLive.getTime())) {
      return res.status(400).json({ error: "Invalid goLiveAt datetime" });
    }
    const endTime = new Date(goLive.getTime() + duration * 60 * 1000);
    const sellerUsername = req.user.username || "anonymous";
    const auction = await Auction.create({
      itemName,
      description,
      startingPrice,
      bidIncrement,
      goLiveAt,
      durationMinutes: duration,
      endTime,
      sellerUsername,
    });
    res.status(201).json({
      id: auction.id,
      itemName: auction.itemName,
      description: auction.description,
      startingPrice: auction.startingPrice,
      bidIncrement: auction.bidIncrement,
      goLiveAt: auction.goLiveAt,
      durationMinutes: auction.durationMinutes,
      endTime: auction.endTime,
      sellerUsername: auction.sellerUsername,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Something went wrong while creating auction" });
  }
});

// GET all auction items
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { count, rows: auctions } = await Auction.findAndCountAll({
      order: [["goLiveAt", "ASC"]],
      limit,
      offset,
    });
    res.json({
      page,
      totalPages: Math.ceil(count / limit),
      totalAuctions: count,
      auctions,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch auction items", details: err });
  }
});

//Get auctions created by user
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const myAuctions = await Auction.findAll({ where: { sellerUsername: username } });
    res.json(myAuctions);
  } catch (error) {
    console.error("Fetch my auctions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//auction item page
router.get("/:id", async (req, res) => {
  try {
    const auction = await Auction.findByPk(req.params.id);
    if (!auction) return res.status(404).json({ error: "Auction not found" });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch auction", details: err });
  }
});

// Update an auction
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      itemName,
      description,
      startingPrice,
      bidIncrement,
      goLiveAt,
      durationMinutes,
    } = req.body;
    const auction = await Auction.findByPk(id);
    if (!auction) return res.status(404).json({ error: "Auction not found" });
    if (auction.sellerUsername !== req.user.username && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ error: "You are not authorized to update this auction" });
    }
    if (new Date() >= auction.goLiveAt) {
      return res
        .status(400)
        .json({ error: "Cannot update an auction that has already started" });
    }
    const duration = durationMinutes
      ? Number(durationMinutes)
      : auction.durationMinutes;
    const goLive = goLiveAt ? new Date(goLiveAt) : auction.goLiveAt;
    const endTime = new Date(goLive.getTime() + duration * 60 * 1000);
    await auction.update({
      itemName: itemName || auction.itemName,
      description: description || auction.description,
      startingPrice: startingPrice || auction.startingPrice,
      bidIncrement: bidIncrement || auction.bidIncrement,
      goLiveAt: goLive,
      durationMinutes: duration,
      endTime,
    });
    res.json({ message: "Auction updated successfully", auction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update auction" });
  }
});

// Delete an auction
router.delete("/:id", authenticateToken, async (req, res) => {
   try {
    const { id } = req.params;
    const sellerUsername = req.user.username;
    const auction = await Auction.findByPk(Number(id));
    if (!auction) return res.status(404).json({ error: "Auction not found" });
    if (auction.sellerUsername !== sellerUsername && !req.user.isAdmin) {
      return res.status(403).json({ error: "You are not authorized to delete this auction" });
    }
    if (new Date() >= auction.goLiveAt) {
      return res.status(400).json({ error: "Cannot delete an auction that has already started" });
    }
    await auction.destroy();
    await redis.del(`auction:${id}:bids`);
    res.json({ message: "Auction deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete auction" });
  }
});

module.exports = router;
