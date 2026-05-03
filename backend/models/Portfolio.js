const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema({
    symbol: String,
    quantity: Number,
    buyPrice: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Portfolio", portfolioSchema);