console.log("background script loaded.");

chrome.runtime.onInstalled.addListener((details) => {
  // inject content script into all tabs when extension is updated
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

let currentFirebaseUid;
let currentFirebaseIdToken;
let focusMode = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // activate/deactivate Focus Mode
  if (request.action === "toggleFocusMode") {
    focusMode = request.state === "on" ? true : false;
    toggleAdBlocking(focusMode);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const action = focusMode ? "hideCustomAds" : "showCustomAds";
      controlNativeAdsDisplay(tabs[0].id, action);
    });

    console.log(`Ad blocking ${focusMode ? "enabled" : "disabled"}`);
    sendResponse({
      status: "success",
      message: `Focus mode set to ${request.state}`,
    });
    return true;

    // redirect to my archives
  } else if (request.action === "openDashboard") {
    const dashboardURL = "localhost:3001";
    chrome.tabs.create({ url: `${dashboardURL}?token=${request.token}` });

    // fetch firebase Uid from popup
  } else if (request.action === "userLoggedIn") {
    console.log("Received userLoggedIn message with UID:", request.firebaseUid);
    currentFirebaseUid = request.firebaseUid;
    currentFirebaseIdToken = request.idToken;
    console.log("current firebase uid:" + currentFirebaseUid);
    fetchUserData();
    return true;
  }
});

// activate, deactivate Ad blocker and get active Id tab
function toggleAdBlocking(focusMode) {
  const ruleSetIdsToEnable = focusMode ? ["rules"] : [];
  const ruleSetIdsToDisable = focusMode ? [] : ["rules"];

  chrome.declarativeNetRequest.updateEnabledRulesets(
    {
      enableRulesetIds: ruleSetIdsToEnable,
      disableRulesetIds: ruleSetIdsToDisable,
    },
    () => {
      console.log(`Ad blocking ${focusMode ? "enabled" : "disabled"}`);
    },
  );
}

function controlNativeAdsDisplay(tabId, action) {
  chrome.tabs.sendMessage(tabId, { action: action }, () => {
    if (chrome.runtime.lastError) {
      console.log(`Error injecting CSS: ${chrome.runtime.lastError.message}`);
    } else {
      console.log(`CSS injection ${action} on tab ${tabId} completed.`);
    }
  });
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
