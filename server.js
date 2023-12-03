require("dotenv").config();
const express = require("express");
const { OpenAI } = require("openai");
const cors = require("cors");

const getSuggestedFeedback = require("./index.js");

const app = express();
app.use(express.json({ limit: "10mb" })); // Make sure to parse JSON request bodies
app.use(
  cors({
    origin: "chrome-extension://aiedbcpigbinfldnpmlghkghcciedfnc", // Replace with your actual extension ID
  })
);

const openai = new OpenAI(process.env.OPENAI_API_KEY); // Load your OpenAI API key from environment variables

// In-memory store for user history
// Structure: { sessionId: [message, ...], ... }
const userHistories = {};

// Middleware to log the request
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  console.log(`Body: ${JSON.stringify(req.body)}`);
  next(); // Pass the request to the next middleware/handler
});

// Endpoint to handle summarization requests with history tracking
// Endpoint to handle summarization requests with history tracking
app.post("/api/summarize", async (req, res) => {
  try {
    const sessionId = req.body.sessionId;
    if (!sessionId) {
      console.log("sessionId is required in the request body.");
      return res
        .status(400)
        .json({ error: "sessionId is required in the request body." });
    }

    const promptText = req.body.content; // Text to summarize

    // Retrieve or initialize history for the session
    const history = userHistories[sessionId] || [];

    // Construct the message for summarization
    const userMessage = { role: "user", content: promptText };

    // Construct the system message
    const systemMessage = {
      role: "system",
      content:
        "You are a helpful AI assistant, keeping track of user's browsing history. For each request, summarize what the user is doing in 1-3 sentences, like 'the user is reading about european politics'.",
    };

    // Prepare messages for OpenAI API including the user message and system command
    const messages = [userMessage, systemMessage];

    console.log("Request to OpenAI API with body:", req.body);

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: messages,
    });

    console.log("OpenAI response:", chatCompletion);

    // Assuming the last message in the completion is the summary
    const summary = chatCompletion.choices[0].message.content;

    // Append only the user interaction (not the system message) to the history
    history.push(summary);
    userHistories[sessionId] = history;

    console.log("Updated userHistories:", userHistories);
    const steps = await getSuggestedFeedback(history);

    res.json({ summary: steps });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
