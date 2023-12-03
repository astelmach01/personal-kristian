chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.contentScriptQuery == "queryOpenAI") {
    const data = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: request.message }],
    };

    console.log("Sending request to OpenAI:", data); // Log the request data

    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer YOUR_OPENAI_API_KEY`, // Replace with your actual API key
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        console.log("Raw response from OpenAI:", response); // Log the raw response
        return response.json();
      })
      .then((responseJson) => {
        console.log("Processed JSON response from OpenAI:", responseJson); // Log the processed response

        // Check if the response structure is as expected
        if (
          responseJson.choices &&
          responseJson.choices.length > 0 &&
          responseJson.choices[0].message
        ) {
          sendResponse({
            fulfillmentText: responseJson.choices[0].message.content,
          });
        } else {
          // Log and handle unexpected response structure
          console.error("Unexpected response structure:", responseJson);
          sendResponse({ error: "Unexpected response structure." });
        }
      })
      .catch((error) => {
        console.error("Error making API request:", error);
        sendResponse({ error: error.message });
      });
    return true; // indicates that the response is sent asynchronously
  }
});
