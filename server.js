import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { identifyFoodItem } from "./agent.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Configure Multer
const upload = multer({ dest: "uploads/" });

// Serve Static UI
app.use(express.static("public"));
app.use(express.json());

// Main Endpoint
app.post("/api/identify", upload.array("foodImages", 5), async (req, res) => {
  try {
    const { itemName, itemDescription } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No images uploaded." });
    }

    // Call the Agent (Model selection happens inside identifyFoodItem)
    const result = await identifyFoodItem(files, itemName, itemDescription);

    // Cleanup files
    files.forEach((file) => {
      try { fs.unlinkSync(file.path); } catch (e) { console.error("Cleanup error", e); }
    });

    res.json({ success: true, analysis: result });

  } catch (error) {
    console.error("Server Error:", error);
    // Attempt cleanup on error
    if (req.files) {
      req.files.forEach((file) => {
         try { fs.unlinkSync(file.path); } catch (e) {}
      });
    }
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});