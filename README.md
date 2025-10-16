# Historical Echoes - Victorian & Georgian Chat

A web application featuring historical characters from 1750-1899, spanning both Georgian and Victorian eras. Chat with characters from 18th-century London to 19th-century Victorian society, using Ollama for language generation and Amazon Polly for text-to-speech with synchronized mouth animation.

## Features

- **Historical Characters**: Speak in authentic Georgian and Victorian English (1750-1899)
- **Multiple Eras**: Characters from both Georgian (1750-1830) and Victorian (1830-1899) periods
- **Text-to-Speech**: Amazon Polly neural voice synthesis
- **Mouth Animation**: Viseme-based lip sync with SVG avatar
- **Local AI**: Ollama for language generation (no external API calls)
- **Responsive UI**: Beautiful historical-themed interface

## Available Characters

### Georgian Era (1750-1830)
- **The Correspondent**: A witty and charming Londoner from 1780s
- **Sir Reginald**: A witty and charming gentleman from 1780s London
- **Lady Catherine**: An educated woman from 1780s London
- **Mr. Thompson**: A successful merchant from 1780s London
- **The Casual Correspondent**: A more relaxed Londoner from 1780s

### Victorian Era (1830-1899)
- **Charles Dickens**: The celebrated Victorian novelist and social critic
- **Mr. Boz**: A Victorian novelist and social observer (Dickensian character)
- **The Victorian Gentleman**: A refined gentleman from 1850s-1890s London

## Prerequisites

Before running this application, ensure you have:

1. **Node.js 22+** installed
   ```bash
   node -v  # Should show v22 or higher
   ```

2. **Ollama** installed and running
   ```bash
   # Install Ollama (if not already installed)
   # Visit: https://ollama.ai/download

   # Start Ollama service
   ollama serve

   # Pull the required model (in a new terminal)
   ollama pull llama3.2:3b-instruct
   ```

3. **AWS CLI** configured with Polly access
   ```bash
   # Install AWS CLI (if not already installed)
   # Visit: https://aws.amazon.com/cli/

   # Configure AWS credentials
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, and region (e.g., us-east-1)
   ```

4. **AWS Polly Permissions**: Ensure your AWS user has the following permissions:
   - `polly:SynthesizeSpeech`
   - `polly:StartSpeechSynthesisTask`

## Installation

1. **Clone or download this project**
   ```bash
   cd "/Users/dylan/Documents/Cursor Projects/1800s CHAT"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## Running the Application

1. **Start Ollama** (if not already running)
   ```bash
   ollama serve
   ```

2. **Start the Georgian Chat server**
   ```bash
   npm start
   # or
   node server.js
   ```

3. **Open your browser**
   Navigate to: http://localhost:8787

## Usage

1. **Start a conversation**: Type a message in the input field and press Enter or click Send
2. **Listen to responses**: The avatar will speak with synchronized mouth movement
3. **Try these example prompts**:
   - "Good day! What news from London?"
   - "Tell me about the latest fashions"
   - "What do you think of the King's policies?"
   - "How is the weather treating you?"

## Configuration

### Changing the Voice

To use a different Amazon Polly voice, edit `server.js` and modify the `VoiceId` parameter:

```javascript
const params = {
  OutputFormat: "mp3",
  VoiceId: "Amy", // Change this to another voice
  // ... other parameters
};
```

Popular British voices:
- `Amy` (British English, Female)
- `Emma` (British English, Female)
- `Brian` (British English, Male)
- `Arthur` (British English, Male)

### Adjusting the Character

Modify the `SYSTEM_PROMPT` in `server.js` to change the character's personality:

```javascript
const SYSTEM_PROMPT = `You are "The Correspondent," a Londoner living in 1760–1800. 
// ... customize the character description
`;
```

### Changing the AI Model

To use a different Ollama model, update the model name in the `/chat` endpoint:

```javascript
body: JSON.stringify({
  model: "llama3.2:3b-instruct", // Change this
  // ... other parameters
})
```

## Troubleshooting

### Common Issues

1. **"Ollama API error"**
   - Ensure Ollama is running: `ollama serve`
   - Check if the model is installed: `ollama list`
   - Pull the model: `ollama pull llama3.2:3b-instruct`

2. **"TTS API error" or "Failed to generate speech"**
   - Verify AWS credentials: `aws sts get-caller-identity`
   - Check AWS region in `server.js` (default: us-east-1)
   - Ensure Polly permissions are granted

3. **Audio not playing**
   - Check browser console for errors
   - Ensure browser supports Web Audio API
   - Try refreshing the page

4. **Mouth not animating**
   - Check browser console for viseme errors
   - Ensure audio is playing (check volume)
   - Try shorter messages first

### Debug Mode

Enable debug logging by adding this to `server.js`:

```javascript
// Add after imports
process.env.DEBUG = 'true';
```

## Project Structure

```
georgian_chat/
├── server.js          # Express.js backend
├── package.json       # Dependencies and scripts
├── public/
│   └── index.html     # Frontend with chat UI and avatar
└── README.md          # This file
```

## API Endpoints

- `POST /chat` - Send message to Ollama, get character response
- `POST /tts` - Convert text to speech with viseme data
- `GET /health` - Health check endpoint

## Technical Details

### Viseme Mapping

The application maps Amazon Polly visemes to mouth shapes:

- `sil`, `PP`, `FF`, `TH`, `DD`, `kk`, `CH`, `SS`, `nn`, `RR` → Closed mouth
- `aa` → Open mouth
- `E`, `I` → "E" mouth shape
- `O`, `U` → "O" mouth shape

### Audio Processing

- Uses Web Audio API for precise timing
- Base64-encoded MP3 audio from Amazon Polly
- Viseme timestamps synchronized with audio playback

## Future Enhancements

- **Streaming responses**: Real-time text generation
- **Emotion system**: Facial expressions based on sentiment
- **Voice selection**: Multiple character voices
- **Offline mode**: Replace Polly with local TTS
- **Docker deployment**: Containerized setup

## License

ISC License - feel free to modify and distribute.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check browser console for error messages
4. Ensure all services (Ollama, AWS) are running properly
