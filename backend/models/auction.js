const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./user");

const Auction = sequelize.define("Auction", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  itemName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  startingPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  bidIncrement: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  goLiveAt: {
    type: DataTypes.DATE,
    allowNull: false,
    get() {
      const val = this.getDataValue("goLiveAt");
      return val ? val.toISOString() : null;
    },
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("scheduled", "live", "ended"),
    defaultValue: "scheduled",
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
    get() {
      const val = this.getDataValue("endTime");
      return val ? val.toISOString() : null;
    },
  },
  winnerUsername: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  winningBid: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  sellerUsername: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Auction;
