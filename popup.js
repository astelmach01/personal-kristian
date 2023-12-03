document.getElementById("testButton").addEventListener("click", () => {
  const userMessage = { role: "user", content: "Say this is a test" }; // Replace with user input if needed
  fetch("http://localhost:3000/api/openai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages: [userMessage] }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      document.getElementById("response").textContent =
        data.choices[0].message.content;
    })
    .catch((error) => {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    });
});


// Add this to popup.js
document.getElementById('summarizeButton').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: summarizePageContent
    }, (injectionResults) => {
      for (const frameResult of injectionResults)
        sendTextToServerForSummarization(frameResult.result);
    });
  });
});

function sendTextToServerForSummarization(text) {
  fetch('http://localhost:3000/api/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: text }),
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('summary').textContent = data.summary;
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

function summarizePageContent() {
  return document.body.innerText; // This will be the result passed to the injectionResults
}
