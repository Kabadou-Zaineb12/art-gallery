const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const router = express.Router();

const Artwork = require("../models/Artwork");

let memoryArtworks = [];

const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const toPlainArtwork = (artwork) => ({
  _id: artwork._id.toString(),
  title: artwork.title,
  imageURL: artwork.imageURL || "",
  tags: artwork.tags || [],
  startingPrice: artwork.startingPrice,
  ownerId: artwork.ownerId,
  createdAt: artwork.createdAt || new Date(),
});

// CREATE
router.post("/", upload.single("image"), async (req, res) => {
  const artworkData = {
    title: req.body.title,
    ownerId: req.user?.id,
  };

  if (req.file) {
    artworkData.imageURL = `/uploads/${req.file.filename}`;
  }

  if (isDatabaseConnected()) {
    const artwork = await Artwork.create(artworkData);
    return res.json(artwork);
  }

  const artwork = {
    _id: Date.now().toString(),
    ...artworkData,
    createdAt: new Date(),
  };
  memoryArtworks.unshift(artwork);
  res.json(artwork);
});

// READ ALL
router.get("/", async (req, res) => {
  if (isDatabaseConnected()) {
    const artworks = await Artwork.find();
    return res.json(artworks);
  }

  res.json(memoryArtworks);
});

// READ ONE
router.get("/:id", async (req, res) => {
  if (isDatabaseConnected()) {
    const artwork = await Artwork.findById(req.params.id);
    return res.json(artwork);
  }

  const artwork = memoryArtworks.find((item) => item._id === req.params.id);
  res.json(artwork || null);
});

// UPDATE
router.put("/:id", async (req, res) => {
  if (isDatabaseConnected()) {
    const existingArtwork = await Artwork.findById(req.params.id);
    if (!existingArtwork) {
      return res.status(404).json({ error: "Artwork not found" });
    }
    if (existingArtwork.ownerId !== req.user?.id) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const artwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return res.json(artwork);
  }

  const index = memoryArtworks.findIndex((item) => item._id === req.params.id);
  if (index === -1) {
    return res.json(null);
  }

  if (memoryArtworks[index].ownerId !== req.user?.id) {
    return res.status(403).json({ error: "Not allowed" });
  }

  memoryArtworks[index] = {
    ...memoryArtworks[index],
    ...req.body,
  };
  res.json(memoryArtworks[index]);
});

// DELETE
router.delete("/:id", async (req, res) => {
  if (isDatabaseConnected()) {
    const existingArtwork = await Artwork.findById(req.params.id);
    if (!existingArtwork) {
      return res.status(404).json({ error: "Artwork not found" });
    }
    if (existingArtwork.ownerId !== req.user?.id) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await Artwork.findByIdAndDelete(req.params.id);
    return res.json({ message: "Deleted" });
  }

  const artwork = memoryArtworks.find((item) => item._id === req.params.id);
  if (!artwork) {
    return res.json({ message: "Deleted" });
  }
  if (artwork.ownerId !== req.user?.id) {
    return res.status(403).json({ error: "Not allowed" });
  }

  memoryArtworks = memoryArtworks.filter((item) => item._id !== req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;