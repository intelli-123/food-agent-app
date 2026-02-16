import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import sharp from "sharp";
import dotenv from "dotenv";
import { COMPANY_POLICIES } from "./company_rules.js";

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

// --- VALIDATION AGENT ---
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

// --- FINAL ANALYSIS ---
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

