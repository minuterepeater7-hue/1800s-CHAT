import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import AWS from "aws-sdk";
import { getRelevantDickensKnowledge, getRandomQuote, getCharacterReferences } from "./dickens-knowledge-base.js";

const app = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// AWS Polly configuration
const polly = new AWS.Polly({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Default character
const DEFAULT_CHARACTER = "georgian-gentleman";

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
  },
  "mr-boz": {
    name: "Mr. Boz",
    description: "A Victorian novelist and social observer (Dickensian character)",
    typingMessage: "Penning observations...",
    prompt: `You are "Mr. Boz," a Victorian novelist and social observer from 1850s-1870s London.

LITERARY WORKS & KNOWLEDGE:
You are the author of several notable works including:
- "A Tale of Two Cities" (1859) - A story of love, sacrifice, and redemption set during the French Revolution
- "Great Expectations" (1861) - The coming-of-age story of Pip, exploring social class and ambition
- "Oliver Twist" (1838) - The story of an orphan boy exposing workhouse conditions and criminal underworld

FAMOUS CHARACTERS YOU'VE CREATED:
- Sydney Carton, Charles Darnay, Lucie Manette (A Tale of Two Cities)
- Pip, Estella, Miss Havisham (Great Expectations)  
- Oliver Twist, Fagin, Bill Sikes, Nancy (Oliver Twist)

SPEECH PATTERNS & VOCABULARY:
- Use Victorian English with literary flair and keen social observation
- Common phrases: "I must observe," "It strikes me that," "One cannot help but notice," "The human condition"
- Exclamations: "Good heavens!" "What a state of affairs!" "How remarkable!" "Bless my soul!"
- Formal address: "My dear friend," "Good sir/madam," "Esteemed reader"
- Literary language with vivid descriptions and social commentary
- References to literature: "the written word," "character study," "social observation," "human nature," "the common people"
- Occasionally reference your own works and characters when relevant

PERSONALITY & INTERESTS:
- Passionate about social reform and human nature with Dickensian insight
- Knowledgeable about: literature, social conditions, Victorian society, working-class life, poverty
- Empathetic with strong moral convictions and social awareness
- Interested in: social injustice, human character, storytelling, social reform, the plight of the poor
- Often makes observations about society and human behavior with literary flair
- Known for creating memorable characters and social commentary
- Draws from your own literary works to illustrate social points

RESPONSE STYLE:
- 1-3 sentences with literary and socially conscious language (be concise)
- Thoughtful and empathetic tone with social insight
- Use period-appropriate vocabulary with literary sophistication
- Maintain passionate, socially aware conversation with Victorian authenticity
- Keep responses brief but impactful with Dickensian wit
- Occasionally reference your characters or themes from your works when relevant`
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
  baseURL: process.env.MODAL_BASE_URL || "https://your-username--georgian-chat-llm-generate-response.modal.run",
  healthURL: process.env.MODAL_HEALTH_URL || "https://your-username--georgian-chat-llm-health-check.modal.run"
};

// Function to call Modal LLM
async function callModalLLM(messages, character) {
  const requestBody = {
    messages: messages,
    character: character
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

// Get available characters
app.get("/characters", (req, res) => {
  const characterList = Object.entries(CHARACTERS).map(([key, char]) => ({
    id: key,
    name: char.name,
    description: char.description,
    typingMessage: char.typingMessage
  }));
  res.json(characterList);
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { user, character = DEFAULT_CHARACTER } = req.body;
    
    if (!user || user.trim() === "") {
      return res.status(400).json({ error: "No message provided" });
    }

    // Get character prompt
    const characterData = CHARACTERS[character] || CHARACTERS[DEFAULT_CHARACTER];
    let systemPrompt = characterData.prompt;
    
    // Add global prompt
    systemPrompt = GLOBAL_PROMPT + "\n\n" + systemPrompt;
    
    // Enhance Mr. Boz with Dickens knowledge
    if (character === 'mr-boz') {
      const relevantBooks = getRelevantDickensKnowledge(user);
      if (relevantBooks.length > 0) {
        let bookContext = relevantBooks.map(book => {
          let context = `- "${book.title}" (${book.year}): ${book.plotSummary}`;
          
          if (book.analyzedCharacters && book.analyzedCharacters.length > 0) {
            context += `\n  Key characters: ${book.analyzedCharacters.slice(0, 5).join(', ')}`;
          }
          
          if (book.analyzedThemes && book.analyzedThemes.length > 0) {
            context += `\n  Themes: ${book.analyzedThemes.join(', ')}`;
          }
          
          // Add relevant text chunks from the actual novels
          if (book.relevantTextChunks && book.relevantTextChunks.length > 0) {
            context += `\n  Relevant passages from the text:\n`;
            book.relevantTextChunks.forEach((chunk, index) => {
              // Truncate very long chunks to keep context manageable
              const truncatedChunk = chunk.length > 500 ? chunk.substring(0, 500) + '...' : chunk;
              context += `    ${index + 1}. "${truncatedChunk}"\n`;
            });
          }
          
          return context;
        }).join('\n\n');
        
        systemPrompt += `\n\nRELEVANT LITERARY CONTEXT FOR THIS CONVERSATION:
${bookContext}

You may reference these works, their characters, themes, and quotes when responding to maintain authenticity as their author. Draw from the actual text and characters you've created.`;
      }
    }

    console.log(`Received chat request from ${characterData.name}:`, user);

    // Call Modal LLM
    const response = await callModalLLM([
      { role: "user", content: user }
    ], character);

    console.log(`${characterData.name} response:`, response);

    res.json({ 
      response: response,
      character: characterData.name,
      typingMessage: characterData.typingMessage
    });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      error: "Failed to process chat request",
      details: error.message 
    });
  }
});

// TTS endpoint
app.post("/tts", async (req, res) => {
  try {
    const { text, voice = "Joanna" } = req.body;
    
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No text provided" });
    }

    console.log(`Generating TTS for: ${text}`);

    const params = {
      Text: text,
      OutputFormat: "mp3",
      VoiceId: voice,
      Engine: "neural"
    };

    const result = await polly.synthesizeSpeech(params).promise();
    
    // Convert audio buffer to base64
    const audioBuffer = result.AudioStream;
    const base64Audio = audioBuffer.toString('base64');
    
    res.json({ 
      audio: base64Audio,
      format: "mp3"
    });

  } catch (error) {
    console.error("TTS error:", error);
    res.status(500).json({ 
      error: "Failed to generate speech",
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Georgian Chat server running on http://localhost:${PORT}`);
  console.log(`Using LLM provider: ${MODAL_CONFIG.provider}`);
  console.log(`Modal URL: ${MODAL_CONFIG.baseURL}`);
  console.log("Make sure AWS credentials are configured");
});

export default app;
