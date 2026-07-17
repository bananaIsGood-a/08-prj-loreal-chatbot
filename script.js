/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* 🔧 Your deployed Cloudflare Worker URL */
const WORKER_URL = "https://loreal-chatbot.haghuwei.workers.dev/";

/* The system prompt tells the AI how to behave.
   It keeps the bot focused on L'Oréal products, routines, and beauty topics only. */
const systemPrompt = {
  role: "system",
  content:
    "You are a friendly L'Oréal product advisor chatbot. You help users discover " +
    "L'Oréal makeup, skincare, haircare, and fragrance products, and you suggest " +
    "personalized routines and recommendations. Only answer questions related to " +
    "L'Oréal products, beauty routines, or beauty-related topics. If a user asks " +
    "about anything else, politely explain that you can only help with L'Oréal " +
    "products and beauty advice, and steer the conversation back on topic.",
};

/* This array stores the whole conversation so far.
   We start it with the system prompt — the AI will always see this first. */
const conversationHistory = [systemPrompt];
const visibleMessages = [];

/* Renders every message currently in the visible chat history. */
function renderConversation() {
  chatWindow.innerHTML = "";

  if (visibleMessages.length === 0) {
    const greetingBubble = document.createElement("div");
    greetingBubble.className = "msg ai";
    greetingBubble.textContent = "👋 Hello! How can I help you today?";
    chatWindow.appendChild(greetingBubble);
    return;
  }

  visibleMessages.forEach((message) => {
    const bubble = document.createElement("div");
    bubble.className = `msg ${message.role === "user" ? "user" : "ai"}`;
    bubble.textContent = message.content;
    chatWindow.appendChild(bubble);
  });
}

// Show the initial greeting
renderConversation();

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Grab whatever the user typed
  const message = userInput.value.trim();
  if (!message) return; // don't send empty messages

  // Add the user's message to the conversation history
  conversationHistory.push({ role: "user", content: message });

  // Clear the input box and show the question with a "Thinking…" placeholder
  userInput.value = "";
  visibleMessages.push({ role: "user", content: message });
  visibleMessages.push({ role: "ai", content: "Thinking…" });
  renderConversation();

  try {
    // Send the whole conversation to our Cloudflare Worker,
    // which forwards it to OpenAI and keeps our API key secret.
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    const data = await response.json();

    // Pull the AI's reply out of the response
    const reply = data.choices[0].message.content;

    // Save the AI's reply in the history too, so it remembers this turn later
    conversationHistory.push({ role: "assistant", content: reply });

    // Replace the temporary "Thinking…" bubble with the real reply
    visibleMessages.pop();
    visibleMessages.push({ role: "ai", content: reply });
    renderConversation();
  } catch (error) {
    // If something goes wrong (bad URL, network issue, etc.) show a friendly message
    console.error("Error talking to the chatbot:", error);
    renderTurn(
      message,
      "Sorry, something went wrong. Please try again in a moment.",
    );
  }
});
