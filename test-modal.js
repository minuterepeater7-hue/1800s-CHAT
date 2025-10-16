// Test script for Modal integration
import fetch from "node-fetch";

const MODAL_BASE_URL = process.env.MODAL_BASE_URL || "https://your-username--georgian-chat-llm-generate-response.modal.run";
const MODAL_HEALTH_URL = process.env.MODAL_HEALTH_URL || "https://your-username--georgian-chat-llm-health-check.modal.run";

async function testModalHealth() {
  try {
    console.log("Testing Modal health...");
    const response = await fetch(MODAL_HEALTH_URL);
    const data = await response.json();
    console.log("✅ Modal health check:", data);
    return true;
  } catch (error) {
    console.error("❌ Modal health check failed:", error.message);
    return false;
  }
}

async function testModalChat() {
  try {
    console.log("Testing Modal chat...");
    const response = await fetch(MODAL_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "user", content: "Good day, sir! How fares the weather in London today?" }
        ],
        character: "georgian-gentleman"
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log("✅ Modal chat response:", data);
    return true;
  } catch (error) {
    console.error("❌ Modal chat test failed:", error.message);
    return false;
  }
}

async function runTests() {
  console.log("🧪 Testing Modal Integration");
  console.log("================================");
  
  const healthOk = await testModalHealth();
  const chatOk = await testModalChat();
  
  if (healthOk && chatOk) {
    console.log("\n🎉 All tests passed! Modal integration is working.");
  } else {
    console.log("\n❌ Some tests failed. Check the errors above.");
    process.exit(1);
  }
}

runTests();
