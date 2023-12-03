const axios = require("axios");
const { inspect } = require("util");

const OPENAI_KEY = process.env.OPENAI_API_KEY;

const objectivePrompt = `I am browsing the web. I may or may not have a broader objective in mind.
I will provide you with a summary of the user's visited websites.
Think step-by-step to identify the sentiment and objective of the user.
When identifying objectives, be as descriptive and specific as possible.
Even if you have just a hunch, please provide your best guess.`;

const nextStepsPrompt = `You have identified a few potential sentiments and objectives of a user
based on their search history and the current web page they are currently viewing.
Think carefully step-by-step to determine what recommendations or advice to provide to the
user that will help them reach the goals that you have identified.`;

const objectiveTools = [
  {
    type: "function",
    function: {
      name: "register_objectives",
      description:
        "Register potential objectives of a user based on their recent search history",
      parameters: {
        type: "object",
        properties: {
          objectives: {
            type: "array",
            items: {
              type: "object",
              description: "A potential objective of the user",
              properties: {
                sentiment: {
                  type: "string",
                  description:
                    "The sentiment of the user going into this action",
                },
                shortTermObjective: {
                  type: "string",
                  description:
                    "The short-term objective of the user: what they are trying to do or find on the current page. Be as descriptive and specific as possible.",
                },
                longTermObjective: {
                  type: "string",
                  description:
                    "Identify some broad life goals of the user, based on their recent search trends.",
                },
                reason: {
                  type: "string",
                  description:
                    "Reasoning and justification for why the user has this objective",
                },
              },
              required: [
                "sentiment",
                "shortTermObjective",
                "longTermObjective",
                "reason",
              ],
            },
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ["objectives"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "no_objective",
      description:
        "Call this if there is no clear objective based on the recent search history",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description:
              "Reasoning and justification for why the user has this objective",
          },
        },
        required: ["reason"],
      },
    },
  },
];

const nextStepsTools = [
  {
    type: "function",
    function: {
      name: "next_steps",
      description:
        "Provide recommendations or advice to the user that will help them reach the goals that you have identified.",
      parameters: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            items: {
              type: "object",
              description:
                "A step that the user should take to accomplish a goal",
              properties: {
                step: {
                  type: "string",
                  description:
                    "The title of the step that the user should take",
                },
                description: {
                  type: "string",
                  description:
                    "A detailed description of what the user should do to accomplish this step",
                },
              },
              required: ["step", "description"],
            },
            minItems: 3,
            maxItems: 5,
          },
        },
        required: ["steps"],
      },
    },
  },
];

async function queryChat(messages, tools, toolChoice) {
  try {
    const url = "https://api.openai.com/v1/chat/completions";
    const postData = {
      model: "gpt-3.5-turbo-1106",
      messages,
      temperature: 0.1,
      tools,
      ...(toolChoice && { tool_choice: toolChoice }),
    };

    const { data } = await axios.post(url, postData, {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
    });

    return data;
  } catch (err) {
    console.error(err.response ? err.response.data : err);
    throw new Error("Error querying OpenAI");
  }
}

async function getSuggestedFeedback(history) {
  const response = await queryChat(
    [
      { role: "system", content: objectivePrompt },
      {
        role: "user",
        content:
          history.slice(0, -1).join("\n") + "\n" + history[history.length - 1],
      },
    ],
    objectiveTools
  );

  const objectives = response.choices[0].message.tool_calls
    .filter((tc) => tc.function.name === "register_objectives")
    .flatMap((tc) => JSON.parse(tc.function.arguments).objectives);

  if (!objectives.length) return "No clear objectives identified.";

  const nextStepsResponse = await queryChat(
    [
      { role: "system", content: nextStepsPrompt },
      { role: "user", content: formatObjectives(objectives) },
    ],
    nextStepsTools,
    { type: "function", function: { name: "next_steps" } }
  );

  const steps = JSON.parse(
    nextStepsResponse.choices[0].message.tool_calls[0].function.arguments
  ).steps;
  return formatSteps(steps);
}

function formatObjectives(objectives) {
  return objectives
    .map(
      (obj) =>
        `Sentiment: ${obj.sentiment}\nShort-term objective: ${obj.shortTermObjective}\nLong-term objective: ${obj.longTermObjective}\nReason: ${obj.reason}`
    )
    .join("\n\n");
}

function formatSteps(steps) {
  return steps
    .map((step, index) => `${index + 1}. ${step.step}`)
    .join("<br><br>");
}

module.exports = getSuggestedFeedback;
