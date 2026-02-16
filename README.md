# 🛡️ AI-Smart Food Items Register (Agentic AI)

A robust, multi-modal AI system designed for food delivery platforms. This application acts as an intelligent **"Content Gatekeeper"**, ensuring that only safe, high-quality, and accurate food images are accepted from merchants.

It utilizes an **Agentic Architecture** to validate images against strict organization rules, sanitize metadata, and generate marketing-ready descriptions using state-of-the-art Large Language Models (LLMs).

---

## 🚀 Key Features

* **Multi-LLM Support:** Automatically switches between **Google Gemini** and **OpenAI GPT** based on available API keys.
* **Agentic Validation:** A dedicated "Gatekeeper Agent" reviews every single image *before* it is accepted into the submission deck.
* **Client-Side Safety:** Uses TensorFlow.js (`nsfwjs`) in the browser to block explicit content instantly.
* **Privacy & Optimization:** Uses `sharp` to strip GPS/Camera metadata and standardize image size (max 800px) before AI processing.
* **Context-Aware Analysis:** The AI verifies if the uploaded image actually visually matches the *Item Name* and *Description* provided by the user.

---

## 🧠 The AI Engine

### Primary Model: **Gemini 2.5 Flash**

We utilize Google's **Gemini 2.5 Flash** as the primary engine.

* **Why?** It offers superior multimodal capabilities (native vision + text) with extremely low latency.
* **Role:** It acts as the "Safety Officer" and "Food Critic," processing visual data against complex text-based business policies.

### Secondary Model: **GPT-4o (OpenAI)**

The system is built with a **Model Factory Pattern**. If the `GOOGLE_API_KEY` is missing but `OPENAI_API_KEY` is present, the system seamlessly switches to **GPT-4o** for vision and reasoning.

---

## 🤖 Agentic Workflow

The system is orchestrated using **LangChain** and consists of two distinct agents:

### 1. The Gatekeeper Agent (Validation Layer)

* **Endpoint:** `/api/validate`
* **Trigger:** Runs immediately when a user selects an image.
* **Input:** Image Buffer + Item Name + Description + `company_rules.js`.
* **Responsibilities:**
* **Safety Check:** Scans for nudity, violence, or prohibited substances.
* **Quality Check:** Rejects blurry, dark, or distorted images.
* **Context Verification:** Checks if the image matches the claimed Item Name (e.g., *User types "Pizza" but uploads a "Burger" -> **REJECTED**).*


* **Output:** Returns a JSON status (`isValid: true/false`) with a specific reason.

### 2. The Analyst Agent (Submission Layer)

* **Endpoint:** `/api/identify`
* **Trigger:** Runs when the user clicks "Submit Item" (requires min 2 valid images).
* **Responsibilities:**
* Aggregates all validated images.
* Generates a **Confidence Score** (0-100%).
* Creates a professional analysis of the dish, identifying ingredients and visual appeal.


* **Output:** Returns a structured JSON object for the frontend feed.

---

## 📜 Organization Rules (The "Brain")

We do not use hard-coded `if/else` logic for validation. Instead, we use **System Prompt Injection**. The rules are defined in `company_rules.js` and injected into the LLM's context.

**Current Ruleset:**

1. **Authenticity:** The image must realistically represent the food item claimed.
2. **Clarity:** The image must not be blurry, overly dark, or distorted.
3. **Purity:** The image must contain only the food item (no people, pets, or clutter).
4. **Safety:** Strictly **NO** nudity, violence, or prohibited substances.
5. **Consistency:** If the item is described as "Veg", no meat should be visible.

*If an image violates Rule #3, the Agent rejects it and cites "Purity Violation" as the reason.*

---

## 🛡️ Security Pipeline (Double-Lock Strategy)

1. **Browser Layer:** `nsfwjs` (TensorFlow) runs on the client side. If it detects porn/hentai with >60% probability, the upload is blocked immediately.
2. **Server Layer:** `sharp` resizes images to reduce bandwidth and strips EXIF/GPS data to protect user privacy.
3. **API Layer:** Gemini `safetySettings` are configured to `BLOCK_LOW_AND_ABOVE` for harassment and hate speech.

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Orchestration:** LangChain
* **Image Processing:** Sharp
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
* **AI Models:** Google Generative AI (Gemini), OpenAI

---

## 💻 How to Run

### 1. Prerequisites

* Node.js (v18+)
* API Key for **Google Gemini** OR **OpenAI**.

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/intelli-123/food-agent-app.git
cd food-agent-app

# Install dependencies
npm install

```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Priority 1: Google Gemini
GOOGLE_API_KEY=your_gemini_key_here

# Priority 2: OpenAI (Optional Fallback)
# OPENAI_API_KEY=your_openai_key_here

PORT=3000

```

### 4. Start the Application

```bash
npm start

```

### 5. Usage

1. Go to `http://localhost:3000`.
2. **Step 1:** Enter the **Item Name** (e.g., "Chicken Biryani").
3. **Step 2:** Upload images.
* *Watch the "Deck"*: The Agent will validate images one by one. Invalid images are rejected with a red toast notification.


4. **Step 3:** Once you have **2 valid images** and a description, the **Submit** button unlocks.
5. **Step 4:** Click Submit to see the final Analysis Card in the feed.

### 6. Docker
1. Build Docker Image
```bash
docker build -t food-agent-app .
```
2. Run the Container
```bash
docker run -p 3000:3000 -e GOOGLE_API_KEY="your_key_here" food-agent-app
```
### 7. Using Docker Compose (Recommended)
1. Make sure your .env file has your keys

2. Run this command
```bash
docker-compose up --build
```
3. Remove Docker Images and Containers
```bash
docker compose down --rmi all --volumes
```
