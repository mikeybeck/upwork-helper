let items = [];

async function fetchAndParseRSS() {
  const response = await fetch(
    "https://www.upwork.com/ab/feed/jobs/rss?amount=500-999%2C1000-4999%2C5000-&contractor_tier=2%2C3&hourly_rate=60-&location=Oceania&paging=NaN-undefined&q=wordpress&sort=recency&t=0%2C1&api_params=1&securityToken=1469d0c33c7d72f34a75a3e9d644d8963f02a90b0a3144af2f60af2fb96b2ed35873080daabe9b435f94498f6bdf2bd06bdb90a2d887e28501bd5e79734116dc&userUid=424233588756824064&orgUid=424233588761018369"
  );
  const text = await response.text();
  chrome.runtime.sendMessage({ message: "parseXML", text: text });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "parsedXML") {
    chrome.storage.local.get(["items", "expiryDate"], function (data) {
      if (data.expiryDate && new Date().getTime() > data.expiryDate) {
        // The items have expired, clear them
        console.log('clearing');
        chrome.storage.local.remove(["items", "expiryDate"]);
      }

      if (data.items) {
        console.log('not clearing');
        // The items have not expired, use them
        const oldTitles = data.items.map((item) => item.title);
        const newTitles = request.items.map((item) => item.title);
        if (JSON.stringify(oldTitles) !== JSON.stringify(newTitles)) {
          items = request.items;
          const expiryDate = new Date();
          expiryDate.setHours(expiryDate.getHours() + 24); // Set expiry date to 24 hours from now
          chrome.storage.local.set({
            items: items,
            expiryDate: expiryDate.getTime(),
          });
        }
      } else {
        console.log('setting items');
        items = request.items;
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24); // Set expiry date to 24 hours from now
        chrome.storage.local.set({
          items: items,
          expiryDate: expiryDate.getTime(),
        });
      }
    });
  }
});

// async function fetchAndParseRSS() {
//   const response = await fetch(
// "https://www.upwork.com/ab/feed/jobs/rss?amount=500-999%2C1000-4999%2C5000-&contractor_tier=2%2C3&hourly_rate=60-&location=Oceania&paging=NaN-undefined&q=wordpress&sort=recency&t=0%2C1&api_params=1&securityToken=1469d0c33c7d72f34a75a3e9d644d8963f02a90b0a3144af2f60af2fb96b2ed35873080daabe9b435f94498f6bdf2bd06bdb90a2d887e28501bd5e79734116dc&userUid=424233588756824064&orgUid=424233588761018369"
//   );
//   const text = await response.text();
//   const parser = new DOMParser();
//   const doc = parser.parseFromString(text, "application/xml");
//   items = Array.from(doc.querySelectorAll("item")).map((item) => ({
// title: item.querySelector("title").textContent,
// link: item.querySelector("link").textContent,
// description: item.querySelector("description").textContent,
//   }));
// }

chrome.runtime.onMessageExternal.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request === "getItems") {
    chrome.storage.local.get("items", function (data) {
      sendResponse(data.items);
    });
    return true;
  }
});
// chrome.action.onClicked.addListener(async (tab) => {
//   await fetchAndParseRSS();
// });

chrome.runtime.onInstalled.addListener(function () {
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request === "getItems") {
      // Your code to get items and send response
      sendResponse(items);
      return true;
    }
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "buttonClicked") {
    fetchAndParseRSS();
  }

  if (request.message === "clearCache") {
    clearCache();
  }
});

function clearCache() {
  chrome.storage.local.clear(function () {
    var error = chrome.runtime.lastError;
    if (error) {
      console.error(error);
    } else {
      console.log("Cache cleared");
    }
  });
}
