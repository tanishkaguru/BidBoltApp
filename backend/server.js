require("dotenv").config();
const express = require("express");
const app = express();

app.set('trust proxy', 1);
const cors = require("cors");
const path = require("path");
const sequelize = require("./config/db");
const Auction = require("./models/auction");
const User = require("./models/user");
const cookieParser = require("cookie-parser");
const auctionRoutes = require("./routes/auctionRoutes");
const bidRoutes = require("./routes/bidRoutes");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const checkAuctions = require("./jobs/checkAuctions");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/users", userRoutes);

const frontendBuildPath = path.join(__dirname, "build");
app.use(express.static(frontendBuildPath));



async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connected!");
    await sequelize.sync({ alter: true });
    console.log("Models synced with database");

    const port = process.env.PORT || 5000;
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });

    checkAuctions();
  } catch (err) {
    console.error("DB connection error:", err);
  }
}

app.get("/*any", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send(err);
    }
  });
});

startServer();
