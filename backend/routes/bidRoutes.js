const express = require("express");
const router = express.Router();
const redis = require("../config/redis");
const Auction = require("../models/auction");
const authenticateToken = require("../middleware/authM");
const { Op } = require("sequelize");

// Place a bid
router.post("/:auctionId", authenticateToken, async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Valid amount is required" });
    }
    const bidAmount = Number(amount);
    const username = req.user.username;
    const auction = await Auction.findByPk(auctionId);
    if (!auction) return res.status(404).json({ error: "Auction not found" });
    const now = new Date();
    if (now < new Date(auction.goLiveAt)) return res.status(400).json({ error: "Auction not started yet" });
    if (now > new Date(auction.endTime)) return res.status(400).json({ error: "Auction has ended" });
    const redisKey = `auction:${auctionId}:bids`;
    let topBid = await redis.zrevrange(redisKey, 0, 0, "WITHSCORES");
    let previousTopUser = null;
    let previousTopAmount = auction.startingPrice;
    if (topBid && topBid.length === 2) {
      previousTopUser = topBid[0];
      previousTopAmount = parseFloat(topBid[1]);
    }
    if (bidAmount < previousTopAmount + auction.bidIncrement) {
      return res.status(400).json({
        error: `Bid must be at least ${auction.bidIncrement} higher than current top bid of ${previousTopAmount}`,
      });
    }
    await redis.zadd(redisKey, bidAmount, username);
    const userBidsKey = `user:${username}:bids`;
    await redis.zadd(userBidsKey, Date.now(), JSON.stringify({ auctionId, amount: bidAmount }));
    topBid = await redis.zrevrange(redisKey, 0, 0, "WITHSCORES");
    const topUsername = topBid.length === 2 ? topBid[0] : username;
    const topAmount = topBid.length === 2 ? parseFloat(topBid[1]) : bidAmount;
    return res.json({ message: "Bid placed successfully", topBid: { username: topUsername, amount: topAmount } });
  } catch (err) {
    console.error("Place bid error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all bids of a user
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const userBidsKey = `user:${username}:bids`;
    const bids = await redis.zrevrange(userBidsKey, 0, -1); // latest bids first
    if (!bids.length) return res.json([]);
    const parsedBids = bids.map((bid) => JSON.parse(bid));
    const auctionIds = parsedBids.map((b) => Number(b.auctionId));
    const auctions = await Auction.findAll({
      where: { id: { [Op.in]: auctionIds } },
    });
    const auctionMap = {};
    auctions.forEach((a) => {
      auctionMap[Number(a.id)] = a;
    });
    const enrichedDetails = parsedBids.map((b) => ({
      ...b,
      auction: auctionMap[Number(b.auctionId)] || null,
    }));
    res.json(enrichedDetails);
  } catch (error) {
    console.error("Fetch user bids error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch bids for an auction
router.get("/:auctionId", authenticateToken, async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const auction = await Auction.findByPk(auctionId);
    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }
    if (req.user.username !== auction.sellerUsername && !req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized to view bids" });
    }
    const redisKey = `auction:${auctionId}:bids`;
    const start = (Number(page) - 1) * limit;
    const end = start + Number(limit) - 1;
    const bids = await redis.zrevrange(redisKey, start, end, "WITHSCORES");
    const formattedBids = [];
    const totalBids = await redis.zcard(redisKey); //total no of bids in sorted set
    for (let i = 0; i < bids.length; i += 2) {
      formattedBids.push({
        username: bids[i],
        amount: parseFloat(bids[i + 1]),
      });
    }
    res.json({
      page: Number(page),
      limit: Number(limit),
      bids: formattedBids,
      totalBids,
    });
  } catch (error) {
    console.error("Fetch bids error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



module.exports = router;
