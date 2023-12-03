require("dotenv").config();
const express = require("express");
const { OpenAI } = require("openai");
const cors = require("cors");
const getSuggestedFeedback = require("./index.js");

const app = express();

// Middleware setup
app.use(express.json({ limit: "10mb" }));
app.use(cors({ origin: `chrome-extension://${process.env.EXTENSION_ID}` }));
app.use(requestLogger);

// OpenAI setup
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// In-memory store for user history
const userHistories = {};

// Routes
app.post("/api/summarize", handleSummarizationRequest);

// Error handling middleware
app.use(errorHandler);

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});




// post functions
function requestLogger(req, res, next) {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  console.log(`Body: ${JSON.stringify(req.body)}`);
  next();
}

async function handleSummarizationRequest(req, res, next) {
  try {
    const { sessionId, content: promptText } = req.body;
    if (!sessionId) {
      throw new Error("sessionId is required in the request body.");
    }

    const history = userHistories[sessionId] || [];
    const messages = createMessages(promptText);
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages,
    });

    const summary = chatCompletion.choices[0].message.content;
    history.push(summary);
    userHistories[sessionId] = history;

    const steps = await getSuggestedFeedback(history);
    res.json({ summary: steps });
  } catch (error) {
    next(error);
  }
}

function createMessages(promptText) {
  return [
    { role: "user", content: promptText },
    {
      role: "system",
      content:
        "You are a helpful AI assistant, keeping track of user's browsing history. For each request, summarize what the user is doing in 1-3 sentences.",
    },
  ];
}

function errorHandler(err, req, res, next) {
  console.error("Error occurred:", err);
  res.status(500).send(err.message);
}
