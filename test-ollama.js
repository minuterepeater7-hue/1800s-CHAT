#!/usr/bin/env node

// Simple test script to verify Ollama is running and accessible
import fetch from "node-fetch";

async function testOllama() {
    try {
        console.log("Testing Ollama connection...");
        
        const response = await fetch("http://localhost:11434/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mistral:latest",
                messages: [
                    { role: "user", content: "Hello, say 'Good day' in Georgian English style." }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ Ollama is working!");
        console.log("Response:", data.message.content);
        
    } catch (error) {
        console.error("❌ Ollama test failed:");
        console.error(error.message);
        console.log("\nTroubleshooting:");
        console.log("1. Make sure Ollama is running: ollama serve");
        console.log("2. Make sure the model is installed: ollama pull llama3.2:3b-instruct");
        console.log("3. Check if Ollama is accessible at http://localhost:11434");
        process.exit(1);
    }
}

testOllama();
