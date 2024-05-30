chrome.runtime.sendMessage("getItems", function (response) {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError.message);
    return;
  }

  const items = response;
  const itemsContainer = document.getElementById("items");
  console.log(itemsContainer);
  items.forEach((item) => {
    const itemElement = document.createElement("div");
    itemElement.innerHTML = `
      <h2><a href="${item.link}" target="_blank">${item.title}</a></h2>
      <p>${item.description}</p>
    `;
    itemsContainer.appendChild(itemElement);
  });
});

document.getElementById("yourButtonId").addEventListener("click", function () {
  chrome.runtime.sendMessage({ message: "buttonClicked" });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message === 'parseXML') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(request.text, "application/xml");
    const items = Array.from(doc.querySelectorAll("item")).map((item) => ({
      title: item.querySelector("title").textContent,
      link: item.querySelector("link").textContent,
      description: item.querySelector("description").textContent,
    }));
    chrome.runtime.sendMessage({message: 'parsedXML', items: items});
  }
});
