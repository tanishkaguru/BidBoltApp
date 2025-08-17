const cron = require("node-cron");
const Auction = require("../models/auction");
const redis = require("../config/redis");
const { Op } = require("sequelize");

function checkAuctions() {
  cron.schedule("*/10 * * * * *", async () => { //every 10 seconds
    const now = new Date();
    try {
      //live auctions check:
      const toGoLive = await Auction.findAll({
        where: {
          goLiveAt: { [Op.lte]: now },
          status: "scheduled",
        },
      });
      for (let auction of toGoLive) {
        auction.status = "live";
        await auction.save();
        console.log(`Auction ${auction.id} is live.`);
        
      }
      //ended auctions check:
      const endedAuctions = await Auction.findAll({
        where: {
          endTime: { [Op.lte]: now },
          status: "live",
        },
      });
      for (let auction of endedAuctions) {
        const redisKey = `auction:${auction.id}:bids`;
        try {
          const topBid = await redis.zrevrange(redisKey, 0, 0, "WITHSCORES");
          if (topBid.length > 0) {
            const winnerUsername = topBid[0];
            const winningAmount = parseFloat(topBid[1]);
            auction.winnerUsername = winnerUsername; 
            auction.winningBid = winningAmount;
            auction.status = "ended";
            await auction.save();
            console.log(
              `Auction ${auction.id} ended. Winner: ${winnerUsername} with ${winningAmount}`
            );
          } else {
            auction.status = "ended";
            await auction.save();
            console.log(`Auction ${auction.id} ended with no bids.`);
          }
        } catch (redisErr) {
          console.error(`Redis error for auction ${auction.id}:`, redisErr);
        }
      }
    } catch (err) {
      console.error("Error checking auctions:", err);
    }
  });
}
module.exports = checkAuctions;
