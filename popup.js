document.addEventListener("DOMContentLoaded", async function () {
  const summarizeButton = document.getElementById("summarizeButton");
  summarizeButton.addEventListener("click", summarizeCurrentPage);

  // Run the summarize function immediately when the popup loads
  await summarizeCurrentPage();
});

async function summarizeCurrentPage() {
  try {
    const sessionId = await getSessionId();
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: summarizePageContent,
    });

    for (const frameResult of injectionResults) {
      await sendTextToServerForSummarization(frameResult.result, sessionId);
    }
  } catch (error) {
    console.error("Error in summarizeCurrentPage:", error);
  }
}

async function sendTextToServerForSummarization(text, sessionId) {
  try {
    const response = await fetch("http://localhost:3000/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, sessionId }),
    });

    const data = await response.json();
    document.getElementById("summary").innerHTML = `<p>${data.summary}</p>`;
  } catch (error) {
    console.error("Error sending text to server for summarization:", error);
  }
}

function summarizePageContent() {
  return document.body.innerText;
}

async function getSessionId() {
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
