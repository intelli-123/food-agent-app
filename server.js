import express from "express";
import multer from "multer";
import fs from "fs";
import { validateImages, identifyFoodItem } from "./agent.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));
app.use(express.json());

// --- 1. SMART VALIDATION ENDPOINT ---
app.post("/api/validate", upload.array("foodImages", 5), async (req, res) => {
  try {
    const { itemName, itemDescription } = req.body;
    const files = req.files;

    if (!files || files.length === 0) return res.json({ results: [] });

    // Validate ALL images against the Name/Description
    const aiResult = await validateImages(files, itemName, itemDescription);

    // Cleanup
    files.forEach(f => { try { fs.unlinkSync(f.path) } catch(e){} });

    res.json(aiResult);

  } catch (error) {
    console.error(error);
    if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path) } catch(e){} });
    res.status(500).json({ error: "Validation Failed" });
  }
});

// --- 2. FINAL SUBMISSION ---
app.post("/api/identify", upload.array("foodImages", 5), async (req, res) => {
  try {
    const { itemName, itemDescription } = req.body;
    const files = req.files;
    const result = await identifyFoodItem(files, itemName, itemDescription);
    files.forEach(f => { try { fs.unlinkSync(f.path) } catch(e){} });
    res.json({ success: true, analysis: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));













// import express from "express";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import { fileURLToPath } from "url";
// import dotenv from "dotenv";
// // Import BOTH functions from agent.js
// import { validateImageSafety, identifyFoodItem } from "./agent.js";

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const port = process.env.PORT || 3000;

// // Configure Multer
// const upload = multer({ dest: "uploads/" });

// app.use(express.static("public"));
// app.use(express.json());

// // --- 1. NEW ENDPOINT: Pre-Validation (Fixes your 404) ---
// app.post("/api/validate", upload.array("foodImages", 5), async (req, res) => {
//   try {
//     const files = req.files;

//     if (!files || files.length === 0) {
//       return res.status(400).json({ isValid: false, reason: "No files uploaded" });
//     }

//     console.log(`🔍 Validating ${files.length} images...`);

//     // Call the Validation Agent
//     const result = await validateImageSafety(files);

//     // Cleanup files immediately after validation
//     files.forEach((file) => {
//       try { fs.unlinkSync(file.path); } catch (e) {}
//     });

//     res.json(result);

//   } catch (error) {
//     console.error("Validation Error:", error);
//     // Cleanup on error
//     if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path) } catch(e){} });

//     res.status(500).json({ isValid: false, reason: "Server Error" });
//   }
// });

// // --- 2. EXISTING ENDPOINT: Final Analysis ---
// app.post("/api/identify", upload.array("foodImages", 5), async (req, res) => {
//   try {
//     const { itemName, itemDescription } = req.body;
//     const files = req.files;

//     if (!files || files.length === 0) {
//       return res.status(400).json({ error: "No images uploaded." });
//     }

//     console.log(`🤖 Analyzing Item: ${itemName}`);

//     const result = await identifyFoodItem(files, itemName, itemDescription);

//     // Cleanup
//     files.forEach((file) => {
//       try { fs.unlinkSync(file.path); } catch (e) {}
//     });

//     res.json({ success: true, analysis: result });

//   } catch (error) {
//     console.error("Analysis Error:", error);
//     if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path) } catch(e){} });

//     res.status(500).json({ error: error.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });