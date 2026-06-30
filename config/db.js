const mongoose = require("mongoose");

const connectDB = async () => {
	try {
		const mongoUri =
			process.env.MONGO_URI ||
			process.env.MONGODB_URI ||
			"mongodb://127.0.0.1:27017/art-gallery";

		await mongoose.connect(mongoUri);
		console.log("MongoDB connected");
	} catch (error) {
		console.warn("MongoDB connection failed, using in-memory storage:", error.message);
	}
};

module.exports = connectDB;