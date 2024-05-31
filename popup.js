chrome.runtime.sendMessage("getItems", async function (response) {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError.message);
    return;
  }

  const items = response;
  const itemsContainer = document.getElementById("items");
  console.log(itemsContainer);
  for (const item of items) {
    const itemElement = document.createElement("div");
    const clientData = await fetchAndParseHTML(item.link);

    clientData.hourlyRate = parseFloat(clientData.hourlyRate.replace('$', ''));

    if (clientData.hourlyRate < 20) {
        continue;
    } else if (clientData.hourlyRate < 40 || isNaN(clientData.hourlyRate)) {
        itemElement.style.backgroundColor = 'red';
    } else if (clientData.hourlyRate < 50) {
        itemElement.style.backgroundColor = 'yellow';
    } else {
        itemElement.style.backgroundColor = 'green';
    }

    itemElement.innerHTML = `
      <h2><a href="${item.link}" target="_blank">${item.title}</a></h2>
      <p>${item.description}</p>
      <p>Hourly rate: ${clientData.hourlyRate}</p>
      <p>Rating: ${clientData.rating}</p>
      <p>Hire rate: ${clientData.hireRate}%</p>
      <p>Last viewed: ${clientData.lastViewed}</p>
    `;
    itemsContainer.appendChild(itemElement);
  }
});

document.getElementById("yourButtonId").addEventListener("click", function () {
  chrome.runtime.sendMessage({ message: "buttonClicked" });
});
document.getElementById("clearCacheButton").addEventListener("click", function () {
  chrome.runtime.sendMessage({ message: "clearCache" });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "parseXML") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(request.text, "application/xml");
    const items = Array.from(doc.querySelectorAll("item")).map((item) => ({
      title: item.querySelector("title").textContent,
      link: item.querySelector("link").textContent,
      description: item.querySelector("description").textContent,
    }));
    chrome.runtime.sendMessage({ message: "parsedXML", items: items });
  }
});

async function fetchAndParseHTML(url) {
  const response = await fetch(url);
  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");

  let clientData = {
    'hourlyRate': getHourlyRate(doc),
    'rating': getRating(doc),
    'hireRate': getHireRate(doc),
    'lastViewed': getLastViewed(doc)
  }

  return clientData;
}

function getHourlyRate(doc) {
    const element = doc.querySelector("[data-qa='client-hourly-rate']");
    let hourlyRate = '';
    if (element) {
        const regex = /\$[\d.]+/g;
        const match = regex.exec(element.textContent);
        hourlyRate = match ? match[0] : null;
    }

    return hourlyRate;
}

function getRating(doc) {
    const element = doc.querySelector(".air3-rating-value-text");
    return element ? element.textContent : null;
}

function getHireRate(doc) {
    // Element looks like <li data-qa="client-job-posting-stats" data-v-b14c8560=""><strong data-v-b14c8560=""> 98 jobs posted </strong> <div data-v-b14c8560=""> 2% hire rate, 1 open job </div></li>
    const element = doc.querySelector("[data-qa='client-job-posting-stats']");
    if (!element) {
        console.log('No hiring rate element found');
        return null;
    }

    const hireRateRegex = /(\d+)% hire rate/;
    const hireRateMatch = hireRateRegex.exec(element.textContent);
    const hireRate = hireRateMatch ? hireRateMatch[1] : null;
    return hireRate;
}

function getLastViewed(doc) {
    const element = doc.querySelector(".client-activity-items");
    if (!element) {
        console.log('No activity items element found');
        return null;
    }

    // Get last viewed by client.  Element looks like <span class="value" data-v-8d65ed88="">1 hour ago</span>
    const lastViewedRegex = /(\d+) (hour|day|hours|days) ago/;
    const lastViewedMatch = lastViewedRegex.exec(element.textContent);
    const lastViewed = lastViewedMatch ? lastViewedMatch[1] : null;

    return lastViewed;
}
