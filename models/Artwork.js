const mongoose = require("mongoose");

const artworkSchema = new mongoose.Schema({
  title: String,
  imageURL: String,
  tags: [String],
  startingPrice: Number,
  ownerId: String,
  coins: { type: Number, default: 100 },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Artwork", artworkSchema);