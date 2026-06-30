const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("../config/db");

dotenv.config({ path: path.join(__dirname, "..", ".env") });
connectDB();

const app = express();
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

const artworkRoutes = require("../routes/artworkRoutes");
app.use("/api/artworks", artworkRoutes);

app.get("/", (req, res) => {
  res.send("API is working");
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
