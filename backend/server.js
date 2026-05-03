const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
const port = 3001;

app.use(express.json());


console.log("Server file executed");


// ================== DB CONNECTION ==================
const connectDB = require("./db");
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});

// ================== MODELS ==================
const userSchema = new mongoose.Schema({
    email: String,
    otp: String,
    otpExpiry: Date
});

const User = mongoose.model("User", userSchema);


const portfolioSchema = new mongoose.Schema({
    symbol: String,
    quantity: Number,
    buyPrice: Number,
    userEmail: String, // 🔥 Associate with user
    lastPrice: Number
});

const Portfolio = mongoose.model("Portfolio", portfolioSchema);


// ================== EMAIL SETUP (ONE TIME) ==================



// ================== SEND OTP ==================
app.post("/api/send-otp", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        console.log("Generated OTP:", otp);

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({ email });
        }

        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        await user.save();
        console.log("Saved OTP in DB:", user.otp);
        console.log("OTP for", email, "is:", otp);
        res.json({ message: "OTP sent successfully" });

    } catch (error) {
        console.log("EMAIL ERROR:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});


// ================== VERIFY OTP ==================
app.post("/api/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        console.log("DB OTP:", user?.otp);
        console.log("Entered OTP:", otp);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (
            user.otp.toString().trim() !== otp.toString().trim() ||
            user.otpExpiry < new Date()
        ) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        const token = jwt.sign(
            { email: user.email },
            "SECRET_KEY",
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login successful ✅",
            token
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Verification failed" });
    }
});


// ================== AUTH MIDDLEWARE ==================

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No header
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    // ❌ Wrong format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const token = authHeader.split(" ")[1];

    // ❌ Empty token
    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const decoded = jwt.verify(token, "SECRET_KEY");

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ================== BUY STOCK ==================

app.post("/api/buy", authMiddleware, async (req, res) => {
    try {
        // ✅ FIRST define values
        const { symbol, quantity, buyPrice } = req.body;

        // ✅ FORCE NUMBER
        const qty = Number(quantity);
        const price = Number(buyPrice);
        // ✅ THEN validate
        if (!symbol || !quantity || !buyPrice) {
            return res.status(400).json({ error: "All fields required" });
        }

        if (quantity <= 0 || buyPrice <= 0) {
            return res.status(400).json({ error: "Invalid values" });
        }

        const cleanSymbol = symbol.toUpperCase();
        // 🔍 Validate symbol using API
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=GRTFYKVRBL26D70C`;

        const response = await axios.get(url);
        const data = response.data["Global Quote"];

        // ❌ Invalid symbol check
        if (!data || !data["05. price"]) {
            return res.status(400).json({ error: "Invalid stock symbol ❌" });
        }
        let existingStock = await Portfolio.findOne({
            symbol: cleanSymbol,
            userEmail: req.user.email
        });

        if (existingStock) {
            const totalQty = existingStock.quantity + qty;

            const totalInvestment =
            existingStock.buyPrice * existingStock.quantity +
            price * qty;

            existingStock.quantity = totalQty;
            existingStock.buyPrice = totalInvestment / totalQty;

            await existingStock.save();

            return res.json({
                message: "Stock updated ✅",
                data: existingStock
            });
        }

        const newStock = new Portfolio({
            symbol: cleanSymbol,
            quantity: qty,
            buyPrice: price,
            userEmail: req.user.email
        });

        
        await newStock.save();

        res.json({
            message: "Stock added ✅",
            data: newStock
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to save stock" });
    }
});


// ================== GET PORTFOLIO (PROTECTED) ==================
app.get("/api/portfolio", authMiddleware, async (req, res) => {
    try {
        const stocks = await Portfolio.find({
            userEmail: req.user.email
        });

        let result = [];

        for (let stock of stocks) {
            try {
                const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stock.symbol}&apikey=GRTFYKVRBL26D70C`;
                await new Promise(resolve => setTimeout(resolve, 1200)); // ⏳ delay
                const response = await axios.get(url);
                const data = response.data["Global Quote"];

                // ✅ SINGLE clean variable
                let currentPrice;

                // ✅ If API works
                if (data && data["05. price"]) {
                    currentPrice = parseFloat(data["05. price"]);

                    // 🔥 Save last valid price
                    stock.lastPrice = currentPrice;
                    await stock.save();
                } 
                // ✅ Fallback if API fails
                else {
                    console.log("⚠️ Using fallback price for:", stock.symbol);

                    currentPrice = stock.lastPrice || stock.buyPrice;
                }

                // ✅ Calculations (only once)
                const investment = stock.buyPrice * stock.quantity;
                const currentValue = currentPrice * stock.quantity;
                const profitLoss = currentValue - investment;

                result.push({
                    symbol: stock.symbol,
                    quantity: stock.quantity,
                    buyPrice: stock.buyPrice,
                    currentPrice,
                    investment,
                    currentValue,
                    profitLoss
                });

            } catch (err) {
                console.log("❌ Error fetching:", stock.symbol);

                // ✅ fallback if API completely fails
                const currentPrice = stock.lastPrice || stock.buyPrice;

                const investment = stock.buyPrice * stock.quantity;
                const currentValue = currentPrice * stock.quantity;
                const profitLoss = currentValue - investment;

                result.push({
                    symbol: stock.symbol,
                    quantity: stock.quantity,
                    buyPrice: stock.buyPrice,
                    currentPrice,
                    investment,
                    currentValue,
                    profitLoss
                });
            }
        }

        res.json(result);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to fetch portfolio" });
    }
});


// ================== BASIC ROUTE ==================
app.get("/", (req, res) => {
    res.send("Stock Portfolio Backend Running");
});


// ================== START SERVER ==================
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});