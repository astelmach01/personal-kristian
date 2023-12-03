require("dotenv").config();

const express = require("express");
const { OpenAI } = require("openai");
const cors = require("cors");

const app = express();
app.use(express.json()); // Make sure to parse JSON request bodies
app.use(
  cors({
    origin: "chrome-extension://aiedbcpigbinfldnpmlghkghcciedfnc", // Replace with your actual extension ID
  })
);

const openai = new OpenAI(process.env.OPENAI_API_KEY); // Load your OpenAI API key from environment variables

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
      model: "gpt-3.5-turbo",
      messages: req.body.messages,
    });
    console.log("OpenAI response:", chatCompletion);
    res.json(chatCompletion);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
