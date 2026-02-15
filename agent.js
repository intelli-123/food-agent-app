import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import sharp from "sharp";
import dotenv from "dotenv";
import { COMPANY_POLICIES } from "./company_rules.js"; // Import Rules

dotenv.config();

const cleanJSON = (text) => text.replace(/```json/g, "").replace(/```/g, "").trim();

const getModel = () => {
  const googleKey = process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.trim() : "";
  const openAIKey = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.trim() : "";

  if (openAIKey.length > 10) {
    return new ChatOpenAI({ model: "gpt-4o", temperature: 0.1, apiKey: openAIKey });
  } else if (googleKey.length > 10) {
    return new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0.1,
      apiKey: googleKey,
    });
  }
  throw new Error("❌ MISSING API KEYS.");
};

const processImage = async (filePath) => {
  const buffer = await sharp(filePath)
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .keepMetadata(false)
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
};

// --- ENHANCED VALIDATION AGENT ---
export async function validateImages(files, itemName, itemDesc) {
  try {
    const model = getModel();
    const processedImages = await Promise.all(files.map((file) => processImage(file.path)));

    // We send all images at once, but ask for an ARRAY of results
    const systemPrompt = `You are a Strict Content Moderator for a Food Delivery App.

    **CONTEXT:**
    User claims this is: "${itemName}"
    Description: "${itemDesc}"

    **YOUR TASK:**
    Evaluate EACH image individually against these rules:
    ${COMPANY_POLICIES}

    **CRITICAL CHECK:**
    Does the image visually match the User's Claimed Name?
    (e.g., If user says "Chicken" but image is "Idly", reject it).

    **OUTPUT JSON ONLY:**
    {
      "results": [
        {
          "index": 0, // Corresponds to 1st image
          "isValid": boolean,
          "reason": "Short reason for rejection (or 'Approved')"
        },
        ...
      ]
    }`;

    const messageContent = [
      { type: "text", text: "Validate these images individually." },
      ...processedImages.map(img => ({ type: "image_url", image_url: { url: img } }))
    ];

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage({ content: messageContent })
    ]);

    return JSON.parse(cleanJSON(response.content));

  } catch (error) {
    console.error("Validation Error:", error);
    // Fail safe: reject all if system errors
    return { results: files.map((_, i) => ({ index: i, isValid: false, reason: "System Error" })) };
  }
}

// --- FINAL ANALYSIS (Kept Simple) ---
export async function identifyFoodItem(files, itemName, itemDescription) {
  // Reuse validation logic or keep existing deep analysis
  // For brevity, using a simplified version here
  const model = getModel();
  const processedImages = await Promise.all(files.map((file) => processImage(file.path)));

  const response = await model.invoke([
    new SystemMessage(`Analyze these validated food images for "${itemName}". JSON Output: { "status": "SUCCESS", "data": { "isMatch": true, "confidence": 95, "analysis": "..." } }`),
    new HumanMessage({ content: processedImages.map(img => ({ type: "image_url", image_url: { url: img } })) })
  ]);

  return JSON.parse(cleanJSON(response.content));
}


// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { ChatOpenAI } from "@langchain/openai";
// import { HumanMessage, SystemMessage } from "@langchain/core/messages";
// import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
// import sharp from "sharp";
// import fs from "fs";
// import dotenv from "dotenv";

// dotenv.config();

// const cleanJSON = (text) => text.replace(/```json/g, "").replace(/```/g, "").trim();

// const getModel = () => {
//   const googleKey = process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.trim() : "";
//   const openAIKey = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.trim() : "";

//   if (openAIKey.length > 10) {
//     return new ChatOpenAI({ model: "gpt-4o", temperature: 0.1, apiKey: openAIKey });
//   } else if (googleKey.length > 10) {
//     return new ChatGoogleGenerativeAI({
//       model: "gemini-2.5-flash",
//       temperature: 0.1,
//       apiKey: googleKey,
//       safetySettings: [
//         { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
//         { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
//       ],
//     });
//   } else {
//     throw new Error("❌ MISSING API KEYS.");
//   }
// };

// const processImage = async (filePath) => {
//   const buffer = await sharp(filePath)
//     .resize({ width: 800, withoutEnlargement: true })
//     .jpeg({ quality: 80 })
//     .keepMetadata(false)
//     .toBuffer();
//   return `data:image/jpeg;base64,${buffer.toString("base64")}`;
// };

// // --- NEW: STEP 1 (Validation Only) ---
// export async function validateImageSafety(files) {
//   try {
//     const model = getModel();
//     const processedImages = await Promise.all(files.map((file) => processImage(file.path)));

//     const systemPrompt = `You are a Strict Content Moderator.
//     Analyze these images.
//     1. Check for UNSAFE content (Nudity, Gore, Drugs).
//     2. Check if the image is FOOD or BEVERAGE related.

//     Output JSON ONLY:
//     {
//       "isValid": boolean, // true ONLY if Safe AND Food
//       "reason": "string" // e.g., "Contains explicit content" or "Not a food item"
//     }`;

//     const messages = [
//       new SystemMessage(systemPrompt),
//       new HumanMessage({
//         content: [{ type: "text", text: "Validate these images." }, ...processedImages.map(img => ({ type: "image_url", image_url: { url: img } }))]
//       }),
//     ];

//     const response = await model.invoke(messages);
//     return JSON.parse(cleanJSON(response.content));

//   } catch (error) {
//     console.error("Validation Error:", error);
//     return { isValid: false, reason: "Security Check Failed (System Error)" };
//   }
// }

// // --- STEP 2 (Full Analysis) ---
// export async function identifyFoodItem(files, itemName, userDescription) {
//   // ... (Same logic as before, just for the final step) ...
//   try {
//     const model = getModel();
//     const processedImages = await Promise.all(files.map((file) => processImage(file.path)));

//     const messages = [
//       new SystemMessage(`You are a Food Inspector. Verify if images match the Name: "${itemName}" and Description. Output JSON: { "status": "SUCCESS", "data": { "isMatch": boolean, "confidence": number, "analysis": string } }`),
//       new HumanMessage({
//         content: [{ type: "text", text: `Description: ${userDescription}` }, ...processedImages.map(img => ({ type: "image_url", image_url: { url: img } }))]
//       }),
//     ];

//     const response = await model.invoke(messages);
//     return JSON.parse(cleanJSON(response.content));
//   } catch (error) {
//     return { status: "ERROR", guidance: error.message };
//   }
// }



// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { ChatOpenAI } from "@langchain/openai";
// import { HumanMessage, SystemMessage } from "@langchain/core/messages";
// import sharp from "sharp";
// import fs from "fs";
// import dotenv from "dotenv";

// // 1. Force load .env before anything else
// dotenv.config();

// // 2. Helper to clean JSON
// const cleanJSON = (text) => {
//   if (!text) return "";
//   return text.replace(/```json/g, "").replace(/```/g, "").trim();
// };

// // 3. Robust Model Factory
// const getModel = () => {
//   // Trim keys to remove accidental spaces from .env
//   const openAIKey = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.trim() : "";
//   const googleKey = process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.trim() : "";

//   // Strategy A: OpenAI
//   if (openAIKey.length > 10) {
//     console.log("🚀 Selected Model: GPT-4o");
//     return new ChatOpenAI({
//       model: "gpt-4o", // Modern param name
//       temperature: 0.1,
//       apiKey: openAIKey,
//     });
//   }

//   // Strategy B: Google Gemini
//   else if (googleKey.length > 10) {
//     console.log("⚡ Selected Model: Gemini 2.5 Flash");

//     // CRITICAL FIX: Ensure we never pass undefined
//     return new ChatGoogleGenerativeAI({
//       model: "gemini-2.5-flash", // Use 'model', not 'modelName'
//       temperature: 0.1,
//       apiKey: googleKey, // Must be a valid string
//       maxRetries: 2,
//     });
//   }

//   // Strategy C: Fail Gracefully
//   else {
//     throw new Error("❌ MISSING API KEYS. Please check your .env file.");
//   }
// };

// // 4. Image Processing
// const processImage = async (filePath) => {
//   try {
//     const buffer = await sharp(filePath)
//       .resize({ width: 800, withoutEnlargement: true })
//       .jpeg({ quality: 80 })
//       .keepMetadata(false)
//       .toBuffer();

//     return `data:image/jpeg;base64,${buffer.toString("base64")}`;
//   } catch (err) {
//     console.error("Image Processing Failed:", err);
//     throw new Error("Failed to optimize image.");
//   }
// };

// // 5. Main Agent Function
// export async function identifyFoodItem(files, itemName, userDescription) {
//   try {
//     // Initialize Model
//     const model = getModel();

//     console.log(`🤖 Processing ${files.length} images...`);

//     // Process Images
//     const processedImages = await Promise.all(
//       files.map((file) => processImage(file.path))
//     );

//     const imageContent = processedImages.map((base64) => ({
//       type: "image_url",
//       image_url: { url: base64 },
//     }));

//     // System Prompt
//     const systemPrompt = `You are an AI Food Safety Agent.

//     **TASK**:
//     1. Check for UNSAFE content (nudity, gore). If found, return status: "UNSAFE".
//     2. Check if images are FOOD. If not, return status: "IRRELEVANT".
//     3. If safe and relevant, verify if images match the Item Name: "${itemName}".

//     **OUTPUT JSON ONLY**:
//     {
//       "status": "SUCCESS" | "UNSAFE" | "IRRELEVANT" | "POOR_QUALITY",
//       "guidance": "Short feedback message for the user.",
//       "data": {
//          "isMatch": boolean,
//          "confidence": number,
//          "analysis": "Brief analysis string."
//       }
//     }`;

//     const messages = [
//       new SystemMessage(systemPrompt),
//       new HumanMessage({
//         content: [
//           { type: "text", text: `Description: ${userDescription || "None"}` },
//           ...imageContent,
//         ],
//       }),
//     ];

//     // Invoke AI
//     const response = await model.invoke(messages);

//     // Parse Response
//     try {
//       const result = JSON.parse(cleanJSON(response.content));
//       return result;
//     } catch (e) {
//       console.error("JSON Parse Error. Raw Output:", response.content);
//       return {
//         status: "ERROR",
//         guidance: "AI response was not valid JSON.",
//         data: null
//       };
//     }

//   } catch (error) {
//     console.error("🚨 Agent Error:", error.message);
//     // Return a safe error object to the UI instead of crashing
//     return {
//       status: "ERROR",
//       guidance: error.message,
//       data: null
//     };
//   }
// }