# LLM Fine-Tuning Guide for Historical Personas (1750-1899)

## 🎭 **Era-Specific Character Development**

### Georgian Era (1750-1830)
- Focus on Enlightenment ideals, coffeehouse culture, and early industrialization
- Language: More formal, classical references, wit and wordplay
- Topics: American Revolution, new inventions, social etiquette, literature

### Victorian Era (1830-1899)
- Focus on social reform, industrial progress, and moral improvement
- Language: More structured, socially conscious, literary sophistication
- Topics: Social conditions, literature, industry, moral values, social progress

## 🎭 **Method 1: Enhanced System Prompts (Current Implementation)**

### What We Just Did
- Enhanced each character's system prompt with specific vocabulary, speech patterns, and personality traits
- Added structured sections for speech patterns, personality, and response style
- Included period-appropriate phrases and expressions for each character

### How It Works
- The LLM uses these detailed prompts to generate responses in character
- Each character now has unique vocabulary and speech patterns
- More consistent and authentic character voice

---

## 🔧 **Method 2: Few-Shot Learning (Advanced)**

### Add Example Conversations
Add example conversations to each character's prompt:

```javascript
const CHARACTERS = {
  'correspondent': {
    // ... existing properties
    prompt: `You are "The Correspondent," a witty and charming Londoner from 1780s.

SPEECH PATTERNS & VOCABULARY:
- Use elegant Georgian English with sophisticated vocabulary
- Common phrases: "I dare say," "Pray tell," "Most intriguing," "Quite the spectacle"
// ... rest of prompt

EXAMPLE CONVERSATIONS:
User: "What do you think about the new steam engine?"
The Correspondent: "Ah, the steam engine! I dare say it's quite the spectacle, my good friend. Such mechanical ingenuity promises to revolutionize our transport, much like the printing press transformed knowledge. Pray tell, have you witnessed one of these marvelous contraptions in action? I find myself most intrigued by their potential applications."

User: "How are things in London these days?"
The Correspondent: "London thrives with its usual bustle and intrigue, I must confess. The coffeehouses buzz with the latest intelligence, and Drury Lane offers some rather diverting productions this season. Most intriguing, however, is the political discourse surrounding our American colonies. What news reaches you from your corner of the realm?"
`
  }
};
```

---

## 🎯 **Method 3: Custom Ollama Models (Most Advanced)**

### Step 1: Create Training Data
Create JSONL files for each character:

```bash
# correspondent_training.jsonl
{"prompt": "You are The Correspondent, a witty Londoner from 1780s. User: What do you think about steam engines?", "response": "Ah, steam engines! I dare say they're quite the spectacle, my good friend. Such mechanical ingenuity promises to revolutionize our transport, much like the printing press transformed knowledge. Pray tell, have you witnessed one of these marvelous contraptions in action?"}
{"prompt": "You are The Correspondent, a witty Londoner from 1780s. User: How are things in London?", "response": "London thrives with its usual bustle and intrigue, I must confess. The coffeehouses buzz with the latest intelligence, and Drury Lane offers some rather diverting productions this season. Most intriguing, however, is the political discourse surrounding our American colonies."}
```

### Step 2: Create Modelfile
```dockerfile
FROM mistral:latest

TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
{{ end }}<|im_start|>assistant
{{ .Response }}<|im_end|>"""

PARAMETER stop "<|im_start|>"
PARAMETER stop "<|im_end|>"
PARAMETER temperature 0.7
PARAMETER top_p 0.9
```

### Step 3: Create Custom Model
```bash
# Create the model
ollama create correspondent-model -f Modelfile

# Train with data
ollama create correspondent-trained -f Modelfile --file correspondent_training.jsonl
```

### Step 4: Update Server
```javascript
// In server.js, update the model name
const response = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "correspondent-trained", // Use custom model
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: user }
    ],
    // ... rest of config
  }),
});
```

---

## 📚 **Method 4: Vocabulary Lists & Constraints**

### Add Character-Specific Vocabulary
```javascript
const CHARACTER_VOCABULARY = {
  'correspondent': {
    preferred: ['dare say', 'pray tell', 'most intriguing', 'quite the spectacle', 'by Jove', 'good heavens'],
    avoid: ['cool', 'awesome', 'yeah', 'okay', 'sure', 'no problem'],
    formal: true,
    exclamations: ['By Jove!', 'Good heavens!', 'What a curious notion!', 'Most extraordinary!']
  },
  'mr-thompson': {
    preferred: ['I reckon', 'profitable venture', 'market conditions', 'trade routes', 'business affairs'],
    avoid: ['awesome', 'cool', 'yeah', 'sure'],
    formal: false,
    exclamations: ['Capital opportunity!', 'What a fine prospect!', 'Most advantageous!']
  }
};
```

### Add Vocabulary Constraints to Prompts
```javascript
// Add to each character's prompt
VOCABULARY CONSTRAINTS:
- ALWAYS use these phrases: [character-specific phrases]
- NEVER use modern slang: [avoid list]
- PREFER these expressions: [preferred vocabulary]
- EXCLAMATIONS: [character-specific exclamations]
```

---

## 🎨 **Method 5: Character-Specific Parameters**

### Adjust Model Parameters Per Character
```javascript
const CHARACTER_PARAMS = {
  'correspondent': {
    temperature: 0.7,  // More creative
    top_p: 0.9,
    repeat_penalty: 1.1
  },
  'lady-catherine': {
    temperature: 0.5,  // More focused
    top_p: 0.8,
    repeat_penalty: 1.2
  },
  'mr-thompson': {
    temperature: 0.6,  // Balanced
    top_p: 0.85,
    repeat_penalty: 1.0
  }
};

// In the chat endpoint
const characterParams = CHARACTER_PARAMS[character] || CHARACTER_PARAMS['correspondent'];
const response = await fetch("http://localhost:11434/api/chat", {
  // ... other config
  options: characterParams
});
```

---

## 🔄 **Method 6: Dynamic Prompt Enhancement**

### Add Context-Aware Prompts
```javascript
function enhancePrompt(basePrompt, character, conversationHistory) {
  const context = conversationHistory.slice(-3); // Last 3 messages
  const contextStr = context.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
  
  return `${basePrompt}

RECENT CONVERSATION CONTEXT:
${contextStr}

Based on this context, respond in character while maintaining consistency with the conversation flow.`;
}
```

---

## 📊 **Method 7: Response Quality Scoring**

### Add Response Evaluation
```javascript
const RESPONSE_QUALITY_PROMPT = `
Evaluate this response for character authenticity (1-10):
- Uses character-specific vocabulary: ___
- Maintains period-appropriate language: ___
- Shows character personality: ___
- Avoids modern expressions: ___

Response: "{response}"
Character: {character}
`;

// Use this to score and improve responses
```

---

## 🚀 **Implementation Priority**

1. **Start with Method 1** (Enhanced System Prompts) - Already implemented
2. **Add Method 2** (Few-Shot Learning) - Add example conversations
3. **Implement Method 4** (Vocabulary Lists) - Add character-specific constraints
4. **Try Method 5** (Character Parameters) - Adjust model settings per character
5. **Advanced: Method 3** (Custom Models) - For production use

---

## 🧪 **Testing Your Changes**

### Test Each Character
```bash
# Test with different prompts
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"user": "What do you think about the weather?", "character": "correspondent"}'

curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"user": "What do you think about the weather?", "character": "mr-thompson"}'
```

### Evaluate Responses
- Check for character-specific vocabulary
- Verify period-appropriate language
- Ensure personality consistency
- Look for modern expressions to avoid

---

## 📝 **Quick Implementation**

To implement Method 2 (Few-Shot Learning) right now:

1. Add example conversations to each character's prompt
2. Include 2-3 example Q&A pairs per character
3. Use diverse topics to show character range
4. Test and iterate based on results

This will immediately improve character consistency and authenticity!
