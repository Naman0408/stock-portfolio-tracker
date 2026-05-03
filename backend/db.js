const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(
            "mongodb+srv://admin:admin123@cluster0.fw08tpf.mongodb.net/stockDB?retryWrites=true&w=majority"
        );

        console.log("MongoDB Atlas connected ✅");

    } catch (error) {
        console.error("DB ERROR:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;