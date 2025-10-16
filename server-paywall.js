import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { Polly } from 'aws-sdk';
import database from './database.js';
import { authenticateToken, createUserSession, getUserUsageStatus, checkFeatureAccess } from './auth.js';
import { createCustomer, createCheckoutSession, handleWebhook, processWebhookEvent, getPricing } from './stripe.js';
import { getRelevantDickensKnowledge } from './dickens-knowledge-base.js';

const app = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// AWS Polly configuration
const polly = new Polly({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Modal LLM configuration
const MODAL_CONFIG = {
  provider: "modal",
  baseURL: process.env.MODAL_BASE_URL || "https://minuterepeater7-hue--georgian-chat-llm-generate-response.modal.run",
  healthURL: process.env.MODAL_HEALTH_URL || "https://minuterepeater7-hue--georgian-chat-llm-health-check.modal.run"
};

// Character definitions
const CHARACTERS = {
  "georgian-gentleman": {
    name: "Georgian Gentleman",
    description: "A refined gentleman from 18th-century London",
    systemPrompt: "You are a refined gentleman from 18th-century London (1750-1800). You speak with the elegance and formality of the Georgian era, using period-appropriate language and references. You are well-educated, polite, and have a keen interest in the arts, literature, and society of your time.",
    typingMessage: "Composing correspondence...",
    avatar: "🎩"
  },
  "lady-regent": {
    name: "Lady Regent",
    description: "An elegant lady from the Regency period",
    systemPrompt: "You are an elegant lady from the Regency period (1811-1820). You are witty, intelligent, and well-versed in the social graces of the time. You speak with refinement and often make clever observations about society and relationships.",
    typingMessage: "Pondering witticisms...",
    avatar: "👒"
  },
  "colonial-scholar": {
    name: "Colonial Scholar",
    description: "An educated colonist from pre-Revolutionary America",
    systemPrompt: "You are an educated colonist from pre-Revolutionary America (1750-1775). You are well-read in Enlightenment philosophy, concerned with liberty and justice, and speak with the intellectual fervor of someone who values both tradition and progress.",
    typingMessage: "Crafting revolutionary thoughts...",
    avatar: "📜"
  },
  "mr-boz": {
    name: "Mr. Boz",
    description: "Victorian novelist and social observer",
    systemPrompt: "You are 'Mr. Boz,' a Victorian novelist and social observer from 1850s-1870s London. You are the author of several notable works including 'A Tale of Two Cities,' 'Great Expectations,' and 'Oliver Twist.' You speak with literary flair and keen social observation, using Victorian English with Dickensian insight.",
    typingMessage: "Penning literary observations...",
    avatar: "✍️"
  }
};

// Global prompt for all characters
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

// Usage tracking middleware
function trackUsage(req, res, next) {
  const originalSend = res.send;
  const startTime = Date.now();
  
  res.send = function(data) {
    const endTime = Date.now();
    const computeTime = Math.round((endTime - startTime) / 1000);
    
    if (req.user && req.user.userId) {
      // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
      const responseText = typeof data === 'string' ? data : JSON.stringify(data);
      const estimatedTokens = Math.ceil(responseText.length / 4);
      
      database.trackUsage(req.user.userId, {
        messages: 1,
        computeTime: computeTime,
        tokens: estimatedTokens
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
}

// Routes

// Health check
app.get("/health", async (req, res) => {
  try {
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

// User registration/login
app.post("/auth/register", async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }

    // Check if user already exists
    let user = database.getUserByEmail(email);
    
    if (!user) {
      // Create new user
      user = database.createUser({ email, name });
      
      // Create Stripe customer
      try {
        const customer = await createCustomer(email, name);
        database.updateUser(user.id, { customerId: customer.id });
      } catch (stripeError) {
        console.error('Failed to create Stripe customer:', stripeError);
        // Continue without Stripe customer for now
      }
    }

    // Create session
    const { session, token } = createUserSession(user.id);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Get user status
app.get("/auth/status", authenticateToken, (req, res) => {
  const user = database.getUser(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const usageStatus = getUserUsageStatus(req.user.userId);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus
    },
    usage: usageStatus
  });
});

// Chat endpoint with usage limits
app.post("/chat", authenticateToken, trackUsage, async (req, res) => {
  try {
    const { user: userMessage, character = "georgian-gentleman" } = req.body;
    const userId = req.user.userId;

    // Check usage limits
    const usageCheck = database.checkUsageLimit(userId, 'messages', 1);
    if (!usageCheck.allowed) {
      return res.status(429).json({
        error: "Usage limit exceeded",
        reason: usageCheck.reason,
        limits: usageCheck,
        upgradeRequired: true
      });
    }

    // Get character info
    const characterInfo = CHARACTERS[character];
    if (!characterInfo) {
      return res.status(400).json({ error: "Invalid character" });
    }

    // Enhance prompt for Mr. Boz with Dickens knowledge
    let enhancedPrompt = characterInfo.systemPrompt;
    if (character === "mr-boz") {
      try {
        const dickensKnowledge = await getRelevantDickensKnowledge(userMessage);
        if (dickensKnowledge) {
          enhancedPrompt += `\n\nRELEVANT KNOWLEDGE FROM YOUR WORKS:\n${dickensKnowledge}`;
        }
      } catch (error) {
        console.error('Error fetching Dickens knowledge:', error);
      }
    }

    // Prepare messages for LLM
    const messages = [
      { role: "system", content: GLOBAL_PROMPT + "\n\n" + enhancedPrompt },
      { role: "user", content: userMessage }
    ];

    // Call Modal LLM
    const response = await callModalLLM(messages, character);

    res.json({
      response,
      character: characterInfo.name,
      typingMessage: characterInfo.typingMessage,
      avatar: characterInfo.avatar,
      usage: {
        remaining: usageCheck.remaining,
        limit: usageCheck.limit
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

// TTS endpoint
app.post("/tts", authenticateToken, trackUsage, async (req, res) => {
  try {
    const { text, voice = "Joanna" } = req.body;
    const userId = req.user.userId;

    // Check usage limits for compute time
    const usageCheck = database.checkUsageLimit(userId, 'computeTime', 5); // Estimate 5 seconds for TTS
    if (!usageCheck.allowed) {
      return res.status(429).json({
        error: "Usage limit exceeded",
        reason: usageCheck.reason,
        upgradeRequired: true
      });
    }

    const params = {
      Text: text,
      OutputFormat: "mp3",
      VoiceId: voice,
      Engine: "neural"
    };

    const result = await polly.synthesizeSpeech(params).promise();
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': result.AudioStream.length
    });
    
    res.send(result.AudioStream);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: "TTS generation failed" });
  }
});

// Get characters
app.get("/characters", (req, res) => {
  const characterList = Object.entries(CHARACTERS).map(([id, info]) => ({
    id,
    name: info.name,
    description: info.description,
    avatar: info.avatar
  }));
  res.json(characterList);
});

// Stripe integration routes

// Get pricing
app.get("/pricing", (req, res) => {
  res.json(getPricing());
});

// Create checkout session
app.post("/create-checkout-session", authenticateToken, async (req, res) => {
  try {
    const { priceId } = req.body;
    const user = database.getUser(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.customerId) {
      // Create Stripe customer if doesn't exist
      const customer = await createCustomer(user.email, user.email);
      database.updateUser(user.id, { customerId: customer.id });
    }

    const session = await createCheckoutSession(
      user.customerId,
      priceId,
      `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      `${req.headers.origin}/cancel`
    );

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Stripe webhook
app.post("/stripe-webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = handleWebhook(req.body, sig);
    await processWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: "Webhook processing failed" });
  }
});

// Cancel subscription
app.post("/cancel-subscription", authenticateToken, async (req, res) => {
  try {
    const user = database.getUser(req.user.userId);
    if (!user || !user.subscriptionId) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    const subscription = await cancelSubscription(user.subscriptionId);
    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// Get user analytics
app.get("/analytics", authenticateToken, (req, res) => {
  const stats = database.getUserStats(req.user.userId);
  res.json(stats);
});

// Start server
app.listen(PORT, () => {
  console.log(`Georgian Chat server with paywall running on http://localhost:${PORT}`);
  console.log(`Using LLM provider: ${MODAL_CONFIG.provider}`);
  console.log(`Modal URL: ${MODAL_CONFIG.baseURL}`);
  console.log("Make sure AWS credentials and Stripe keys are configured");
});
