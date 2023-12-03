// contentScript.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "summarize") {
    const textContent = document.body.innerText || document.body.textContent;
    sendResponse({ text: textContent });
  }
});
