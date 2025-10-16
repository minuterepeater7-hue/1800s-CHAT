import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Character definitions
const CHARACTERS = {
  "georgian-gentleman": {
    name: "Georgian Gentleman",
    description: "A refined gentleman from 18th-century London",
    typingMessage: "Composing correspondence...",
    prompt: `You are a refined gentleman from 18th-century London (1750-1800). You speak with the elegance and formality of the Georgian era, using period-appropriate language and references. You are well-educated, polite, and have a keen interest in the arts, literature, and society of your time.`
  },
  "lady-regent": {
    name: "Lady Regency",
    description: "An elegant lady from the Regency period",
    typingMessage: "Pondering witticisms...",
    prompt: `You are an elegant lady from the Regency period (1811-1820). You are witty, intelligent, and well-versed in the social graces of the time. You speak with refinement and often make clever observations about society and relationships.`
  },
  "colonial-scholar": {
    name: "Colonial Scholar",
    description: "An educated colonist from pre-Revolutionary America",
    typingMessage: "Drafting treatise...",
    prompt: `You are an educated colonist from pre-Revolutionary America (1750-1775). You are well-read in Enlightenment philosophy, concerned with liberty and justice, and speak with the intellectual fervor of someone who values both tradition and progress.`
  }
};

// Global prompt that applies to ALL characters
const GLOBAL_PROMPT = `
GLOBAL INSTRUCTIONS FOR ALL CHARACTERS:
- Always maintain your character's personality and speech patterns
- Keep responses concise (1-3 sentences) unless the topic requires more detail
- Always end with a follow-up question to encourage continued conversation
- Stay in character and maintain historical authenticity
- Be engaging and encourage the user to share more about their thoughts
- If discussing modern topics, relate them to your historical perspective
- Show genuine interest in the user's responses and build on their ideas
`;

// Modal LLM configuration
const MODAL_CONFIG = {
  provider: "modal",
  baseURL: process.env.MODAL_BASE_URL || "https://minuterepeater7-hue--georgian-chat-llm-generate-response.modal.run",
  healthURL: process.env.MODAL_HEALTH_URL || "https://minuterepeater7-hue--georgian-chat-llm-health-check.modal.run"
};

// Function to call Modal LLM
async function callModalLLM(messages, character) {
  const characterData = CHARACTERS[character] || CHARACTERS["georgian-gentleman"];
  const fullSystemPrompt = GLOBAL_PROMPT + "\n\n" + characterData.prompt;

  const requestBody = {
    messages: messages,
    character_prompt: fullSystemPrompt
  };

  const response = await fetch(MODAL_CONFIG.baseURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Modal API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.response;
}

// Chat endpoint
app.post("/chat", async (req, res) => {
  const { user: userMessage, character } = req.body;

  try {
    // Prepare messages for LLM
    const messages = [{ role: "user", content: userMessage }];

    // Call LLM
    const llmResponse = await callModalLLM(messages, character);

    res.json({ response: llmResponse });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ error: "Failed to get response from LLM", details: error.message });
  }
});

// Characters endpoint
app.get("/characters", (req, res) => {
  res.json(CHARACTERS);
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Check Modal health
    const modalHealth = await fetch(MODAL_CONFIG.healthURL);
    const modalStatus = await modalHealth.json();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      llm_provider: MODAL_CONFIG.provider,
      modal_status: modalStatus
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      llm_provider: MODAL_CONFIG.provider,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Georgian Chat server running on http://localhost:${PORT}`);
  console.log(`Using LLM provider: ${MODAL_CONFIG.provider}`);
  console.log(`Modal URL: ${MODAL_CONFIG.baseURL}`);
});
