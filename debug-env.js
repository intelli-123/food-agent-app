import dotenv from 'dotenv';
dotenv.config();

console.log("--- DEBUG START ---");
console.log("1. Current Directory:", process.cwd());
console.log("2. Google Key Exists:", !!process.env.GOOGLE_API_KEY);
console.log("3. Google Key Length:", process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.length : "N/A");
console.log("4. OpenAI Key Exists:", !!process.env.OPENAI_API_KEY);

if (!process.env.GOOGLE_API_KEY) {
    console.error("❌ CRITICAL: GOOGLE_API_KEY is missing from .env file!");
} else {
    console.log("✅ .env loaded correctly.");
}
console.log("--- DEBUG END ---");