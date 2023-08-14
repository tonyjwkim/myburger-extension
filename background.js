chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed!");
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "openDashboard") {
    const dashboardURL = "localhost:3001";
    chrome.tabs.create({ url: `${dashboardURL}?token=${message.token}` });
  }
});
