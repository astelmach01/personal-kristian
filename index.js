const axios = require("axios");

const OPENAI_KEY = process.env.OPENAI_API_KEY;

const objectivePrompt = `I am browsing the web. I may or may not have a broader objective in mind.
I will provide you with the most recent URLs I have visited and their titles.
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

async function queryChat(messages, tools) {
  try {
    const { data } = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo-1106",
        messages,
        temperature: 0.1,
        tools,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
      }
    );

    return data;
  } catch (err) {
    console.error(err.response.data);
    throw new Error("Error querying OpenAI");
  }
}

async function findObjectives(messages) {
  return queryChat(messages, objectiveTools);
}

function extractTitle(html) {
  const titleRegex = /<title>(.*?)<\/title>/i;
  const match = titleRegex.exec(html);
  return match ? match[1] : null;
}

async function queryUrls(history, current) {
  const response = await findObjectives([
    {
      role: "system",
      content: objectivePrompt,
    },
    {
      role: "user",
      content: history + "\n" + current,
    },
  ]);
  return response.choices[0];
}

async function identifyNextSteps(objectives) {
  const serializedObjectives = objectives
    .map(
      (obj) =>
        `Sentiment: ${obj.sentiment}\nShort-term objective: ${obj.shortTermObjective}\nLong-term objective: ${obj.longTermObjective}\nReason: ${obj.reason}`
    )
    .join("\n\n");
  const response = await queryChat(
    [
      {
        role: "system",
        content: nextStepsPrompt,
      },
      {
        role: "user",
        content: serializedObjectives,
      },
    ],
    nextStepsTools
  );
  return response.choices[0];
}

async function getSuggestedFeedback(history) {
  const response = await queryUrls(
    history.slice(0, history.length - 1),
    history[history.length - 1]
  );
  const { tool_calls } = response.message;
  const objectives = [];
  for (const toolCall of tool_calls) {
    const json = JSON.parse(toolCall.function.arguments);
    if (toolCall.function.name === "register_objectives") {
      const analysis = json;
      objectives.push(...analysis.objectives);
    } else {
      const analysis = json;
      console.log(analysis);
    }
  }

  const nextStepsResponse = await identifyNextSteps(objectives);
  const toolCall = nextStepsResponse.message.tool_calls[0];
  const json = JSON.parse(toolCall.function.arguments);
  const analysis = json;
  console.log(analysis.steps);
}

module.exports = getSuggestedFeedback;

const userHistories =  {
  lposyqon0ceexc6ynetg: [
    "The user is reading an article from CNN about the arrest of a suspect in the shootings of three homeless men in Los Angeles, as well as a related shooting at a homeless encampment in Las Vegas. The article provides details on the suspect's arrest and the circumstances of the shootings, as well as the response from Los Angeles city officials and law enforcement.",
    'The user is reading an article about the arrest of a suspect in the shootings of three homeless men in Los Angeles, as well as the subsequent investigation and response by law enforcement and city officials.'
  ]
}

getSuggestedFeedback(userHistories.lposyqon0ceexc6ynetg);

module.exports = getSuggestedFeedback;
