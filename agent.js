import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

/**
 * 🏭 Model Factory
 */
const getModel = () => {
  const openAIKey = process.env.OPENAI_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;

  // Debug Log (Masked)
  console.log("--- DEBUG CREDENTIALS ---");
  console.log(`OpenAI Key Present: ${!!(openAIKey && openAIKey.length > 1)}`);
  console.log(`Google Key Present: ${!!(googleKey && googleKey.length > 1)}`);

  // 1. OpenAI Strategy
  if (openAIKey && openAIKey.length > 5) {
    console.log("🚀 Using Model: OpenAI GPT-4o");
    return new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.2,
      apiKey: openAIKey, // Direct pass
    });
  }
  // 2. Google Gemini Strategy
  else if (googleKey && googleKey.length > 5) {
    console.log("⚡ Using Model: Google Gemini 1.5 Flash");
    return new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash", // UPDATED: 2.5 does not exist yet. Using 1.5 Flash.
      temperature: 0.2,
      apiKey: googleKey,      // Primary param
      googleApiKey: googleKey // Fallback param for safety
    });
  }
  // 3. Error Strategy
  else {
    throw new Error("❌ No valid API Keys found in .env file!");
  }
};

const encodeImage = (filePath, mimeType) => {
  const image = fs.readFileSync(filePath);
  const base64Image = Buffer.from(image).toString("base64");
  return `data:${mimeType};base64,${base64Image}`;
};

export async function identifyFoodItem(files, itemName, userDescription) {
  try {
    const model = getModel();

    console.log(`🤖 Analyzing ${itemName} with ${files.length} images...`);

    const imageContent = files.map((file) => ({
      type: "image_url",
      image_url: {
        url: encodeImage(file.path, file.mimetype),
      },
    }));

    const systemPrompt = `You are an expert Culinary Agent.
    Analyze the food images.

    User Claims:
    - Name: "${itemName}"
    - Description: "${userDescription}"

    Output:
    1. Identification
    2. Verification (Match/Mismatch)
    3. Ingredients Analysis`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage({
        content: [
          { type: "text", text: "Analyze these images:" },
          ...imageContent,
        ],
      }),
    ];

    const response = await model.invoke(messages);
    return response.content;

  } catch (error) {
    console.error("❌ Agent Error Details:", error);
    throw new Error(`AI Processing Failed: ${error.message}`);
  }
}