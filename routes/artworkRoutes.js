const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const Artwork = require("../models/Artwork");

const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// CREATE
router.post("/", upload.single("image"), async (req, res) => {
  const artworkData = {
    title: req.body.title,
  };

  if (req.file) {
    artworkData.imageURL = `/uploads/${req.file.filename}`;
  }

  const artwork = await Artwork.create(artworkData);
  res.json(artwork);
});


// READ ALL
router.get("/", async (req, res) => {
  const artworks = await Artwork.find();
  res.json(artworks);
});


// READ ONE
router.get("/:id", async (req, res) => {
  const artwork = await Artwork.findById(req.params.id);
  res.json(artwork);
});


// UPDATE
router.put("/:id", async (req, res) => {
  const artwork = await Artwork.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(artwork);
});


// DELETE
router.delete("/:id", async (req, res) => {
  await Artwork.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;