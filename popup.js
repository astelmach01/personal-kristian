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
