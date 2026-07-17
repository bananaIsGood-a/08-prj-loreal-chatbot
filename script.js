/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* 🔧 TODO: replace this with your deployed Cloudflare Worker URL */
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

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Grab whatever the user typed
  const message = userInput.value.trim();
  if (!message) return; // don't send empty messages

  // Add the user's message to the conversation history
  conversationHistory.push({ role: "user", content: message });

  // Clear the input box and let the user know we're working on it
  userInput.value = "";
  chatWindow.textContent = "Thinking…";

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

    // Show the reply in the chat window
    chatWindow.textContent = reply;
  } catch (error) {
    // If something goes wrong (bad URL, network issue, etc.) show a friendly message
    console.error("Error talking to the chatbot:", error);
    chatWindow.textContent =
      "Sorry, something went wrong. Please try again in a moment.";
  }
});