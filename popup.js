document.addEventListener("DOMContentLoaded", function () {
  // Add the event listener to the button
  document
    .getElementById("summarizeButton")
    .addEventListener("click", summarizeCurrentPage);

  // Also run the summarize function immediately when the popup loads
  summarizeCurrentPage();
});

function summarizeCurrentPage() {
  getSessionId().then((sessionId) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: summarizePageContent,
        },
        (injectionResults) => {
          for (const frameResult of injectionResults) {
            sendTextToServerForSummarization(frameResult.result, sessionId);
          }
        }
      );
    });
  });
}

function sendTextToServerForSummarization(text, sessionId) {
  fetch("http://localhost:3000/api/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: text, sessionId: sessionId }),
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("summary").textContent = data.summary;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function summarizePageContent() {
  return document.body.innerText; // This will be the result passed to the injectionResults
}

function getSessionId() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["sessionId"], function (result) {
      if (result.sessionId) {
        resolve(result.sessionId);
      } else {
        const newSessionId =
          Date.now().toString(36) + Math.random().toString(36).substr(2);
        chrome.storage.local.set({ sessionId: newSessionId }, () => {
          resolve(newSessionId);
        });
      }
    });
  });
}
