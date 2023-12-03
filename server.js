require("dotenv").config();

const express = require("express");
const { OpenAI } = require("openai");
const cors = require("cors");

const app = express();
app.use(express.json({ limit: "10mb" })); // Make sure to parse JSON request bodies
app.use(
  cors({
    origin: "chrome-extension://aiedbcpigbinfldnpmlghkghcciedfnc", // Replace with your actual extension ID
  })
);

const openai = new OpenAI(process.env.OPENAI_API_KEY, ); // Load your OpenAI API key from environment variables

// Middleware to log the request
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  console.log(`Body: ${JSON.stringify(req.body)}`);
  next(); // Pass the request to the next middleware/handler
});

// Endpoint to handle OpenAI requests
app.post("/api/openai", async (req, res) => {
  try {
    console.log("Request to OpenAI API with body:", req.body);
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: req.body.messages,
    });
    console.log("OpenAI response:", chatCompletion);
    res.json(chatCompletion);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send(error.message);
  }
});

// Add this to server.js
app.post("/api/summarize", async (req, res) => {
  try {
    const promptText = req.body.content; // Assume the text to summarize is under the 'content' key

    // Construct the messages array with a system command to summarize
    const messages = [
      { role: "system", content: "Please summarize the following text:" },
      { role: "user", content: promptText },
    ];

    console.log("Request to OpenAI API with body:", req.body);

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: messages,
    });

      console.log("OpenAI response:", chatCompletion);
      console.log("choices:", chatCompletion.choices);

    // Respond with the summary from the last message
    // Assuming the last message in the completion is the summary
    const summary = chatCompletion.choices[0].message.content;

    res.json({ summary: summary });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send(error.message);
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
