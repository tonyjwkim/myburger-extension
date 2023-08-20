console.log("background script loaded.");

let currentFirebaseUid;
let currentFirebaseIdToken;

// redirect to my archives
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "openDashboard") {
    const dashboardURL = "localhost:3001";
    chrome.tabs.create({ url: `${dashboardURL}?token=${message.token}` });
  }
});

// fetch firebase Uid from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "userLoggedIn") {
    console.log("Received userLoggedIn message with UID:", message.firebaseUid);
    currentFirebaseUid = message.firebaseUid;
    currentFirebaseIdToken = message.idToken;
  }
  console.log("current firebase uid:" + currentFirebaseUid);
  fetchUserData();
});

// inject content script into all tabs when extension is updated
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == "update") {
    chrome.tabs.query({}, function (tabs) {
      for (let tab of tabs) {
        if (isValidURL(tab.url)) {
          chrome.tabs.reload(tab.id);
        }
      }
    });
  }
});

function isValidURL() {
  return true;
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
  if (userId) {
    sendUserIdToContentScript(activeInfo.tabId);
  }
});

let userId;

// fetch user Id from server
async function fetchUserData() {
  try {
    const response = await fetch(
      `http://localhost:3000/users/userData?firebaseUid=${currentFirebaseUid}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentFirebaseIdToken}`,
        },
        mode: "cors",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    const data = await response.json();
    console.log("Response data:", data);
    userId = data.userId;

    console.log("Fetched data:", userId);

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let currentTab = tabs[0];
      if (currentTab) {
        sendUserIdToContentScript(currentTab.id);
      }
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

// send user Id from background.js to content.js
function sendUserIdToContentScript(tabId) {
  chrome.tabs.sendMessage(
    tabId,
    { action: "setUserId", userId: userId },
    function (response) {
      if (chrome.runtime.lastError) {
        console.log("Failed to send message:", chrome.runtime.lastError);
        return;
      }
      console.log(response.message);
    },
  );
}
