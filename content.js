console.log("Content script loaded.");
const ADSELECTORS = [
  'div[id*="ad"]',
  'div[id*="newsletter"]',
  'div[id*="subrightall"]',
  'div[id*="aside"]',
  'div[class^="ad_"]',
  'div[class*="side"]',
  'div[class*="footer"]',
  'div[class="outside_area"]',
  'div[class*="revenue"]',
  'div[class*="adsbygoogle"]',
  'div[class*="promotion"]',
  'div[class*="GoogleActive"]',
  'ins[class*="adsbygoogle"]',
  'aside[class*="main_aside"]',
  'div[class~="outside_area"]',
];

const ARTICLESELECTOR = [
  'h1[class^="headline"]', // 한국경제 제목
  'div[class^="content"]', // 한국경제 내용
  'div[class^="newsct_wrapper"]', // 네이버 신문 제목.내용
  'div[class*="ct_scroll_wrapper"]', // 네이버 세로막대기
];

let isHighlightMode = false;
let currentSelection;
let highlightedTextContent = null;
let lastClickedHighlight;

chrome.runtime.onMessage.addListener(function (request, sendResponse) {
  // get toggle status from popup and set highlightmode in storage
  if (request.action === "toggleHighlightMode") {
    if (request.state === "on") {
      isHighlightMode = true;
    } else if (request.state === "off") {
      isHighlightMode = false;
    }

    chrome.storage.sync.set({ isHighlightMode: isHighlightMode });

    sendResponse({
      status: "success",
      message: `Highlight mode set to ${request.state}`,
    });
  }

  // control native Ads and center div for focus mode
  if (request.action === "hideCustomAds") {
    toggleAds(ADSELECTORS, "hide");
    toggleReaderMode(ARTICLESELECTOR, "center");

    sendResponse({ message: "Custom ads removed and contents centered" });
  } else if (request.action === "showCustomAds") {
    toggleAds(ADSELECTORS, "show");
    toggleReaderMode(ARTICLESELECTOR, "default");

    sendResponse({ message: "Custom ads will not be removed" });
  }

  // apply filter
  if (request.action === "applyVisualFilter") {
    selectVisualFilter(request.filter);

    sendResponse({
      status: "success",
      message: `Visual filter set at ${request.filter}`,
    });
  }

  // get userId from background.js
  if (request.action == "setUserId") {
    chrome.storage.local.set({ userId: request.userId }, function () {
      console.log("UserId received and stored:", request.userId);
      sendResponse({ message: "UserId set successfully" });
    });
    return true;
  }
});

// get highlightmode from storage
chrome.storage.sync.get("isHighlightMode", function (data) {
  isHighlightMode = data.isHighlightMode || false;
  console.log("isHighlightMode from storage: " + isHighlightMode);
});

// highlight new text
document.addEventListener("mouseup", function (event) {
  if (isHighlightMode) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    console.log("Selected Text : " + selectedText);

    if (selectedText.length >= 2) {
      currentSelection = selection;
      highlightedTextContent = selectedText;
      showContextMenu(event.clientX, event.clientY);
    }
  }
});

// click highlighted text
document.addEventListener("click", function (event) {
  lastClickedHighlight = event.target;
  console.log("last clicked:" + lastClickedHighlight);
  if (event.target.classList.contains("highlighted-text")) {
    showContextMenu(event.clientX, event.clientY, "highlighted");
  }
});

// show context menu (highlight OR Save/Remove)
function showContextMenu(x, y, context = "default") {
  const contextMenu = document.createElement("div");
  document.body.appendChild(contextMenu);
  contextMenu.classList.add("context-menu");

  if (context === "default") {
    contextMenu.innerHTML = `<button id="highlightText">Highlight</button>`;
  } else if (context === "highlighted") {
    contextMenu.innerHTML = `
        <button id="saveHighlight">Save</button>
        <button id="removeHighlight">Remove</button>
    `;
  }

  contextMenu.style.position = "absolute";
  contextMenu.style.top = y + window.scrollY + "px";
  contextMenu.style.left = x + window.scrollX + "px";
  contextMenu.style.zIndex = "10000";

  contextMenu.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  if (context === "default") {
    document
      .getElementById("highlightText")
      .addEventListener("click", highlightTextHandler, { once: true });
  } else if (context === "highlighted") {
    document
      .getElementById("saveHighlight")
      .addEventListener("click", saveHighlightHandler, { once: true });
    // document
    //   .getElementById("removeHighlight")
    //   .addEventListener("click", removeHighlightHandler, { once: true });
  }

  function highlightTextHandler() {
    const range = currentSelection.getRangeAt(0);
    const startNode = range.startContainer;
    const endNode = range.endContainer;
    const commonAncestor = range.commonAncestorContainer;

    const treeWalker = document.createTreeWalker(
      commonAncestor,
      NodeFilter.SHOW_TEXT,
    );

    let currentNode = treeWalker.currentNode;
    let isHighlightingStarted = false;
    const nodesToHighlight = [];

    while (currentNode) {
      if (currentNode === startNode) {
        isHighlightingStarted = true;
      }

      if (isHighlightingStarted) {
        nodesToHighlight.push(currentNode);
      }

      if (currentNode === endNode) {
        break;
      }

      currentNode = treeWalker.nextNode();
    }

    nodesToHighlight.forEach((node) => handleNodeHighlighting(node, range));

    closeContextMenu();
  }

  function saveHighlightHandler() {
    if (highlightedTextContent) {
      saveToServer(highlightedTextContent);
    }
    closeContextMenu();
  }

  function closeContextMenu() {
    if (document.body.contains(contextMenu)) {
      document.body.removeChild(contextMenu);
    }
  }

  function removeContextMenu(event) {
    if (!contextMenu.contains(event.target)) {
      document.body.removeChild(contextMenu);
      document.removeEventListener("click", removeContextMenu);
    }
  }

  setTimeout(() => {
    document.addEventListener("click", removeContextMenu);
  }, 0);
}

// highlight nodes
function handleNodeHighlighting(node, range) {
  const nodeRange = document.createRange();

  let start = 0;
  let end = node.length;

  if (node === range.startContainer) {
    start = range.startOffset;
  }

  if (node === range.endContainer) {
    end = range.endOffset;
  }

  if (start === 0 && end === 0) {
    return;
  }

  nodeRange.setStart(node, start);
  nodeRange.setEnd(node, end);

  const highlightSpan = document.createElement("span");
  highlightSpan.className = "highlighted-text";
  nodeRange.surroundContents(highlightSpan);
}

// use userId as params and send text to server
async function saveToServer(highlightedTextContent) {
  chrome.storage.local.get(["userId"], async function (result) {
    if (!result.userId) {
      console.error("UserId is not set.");
      return;
    }

    console.log(`Saving: ${highlightedTextContent}`);

    const userIdFromStorage = result.userId;
    const currentUrl = window.location.href;
    const pageTitle = document.title;
    const metaDescription = document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");

    const url = `http://localhost:3000/users/${userIdFromStorage}/contents`;
    console.log(url);
    const data = {
      textContent: highlightedTextContent,
      userId: userIdFromStorage,
      url: currentUrl,
      title: pageTitle,
      description: metaDescription,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log(responseData);
      showToast("Successfully Saved!");
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to Save!");
    }
  });
}

function toggleAds(selectors, action) {
  const combinedAdSelector = selectors.join(", ");
  const elements = document.querySelectorAll(combinedAdSelector);
  const iframes = document.querySelectorAll("iframe");

  if (action === "hide") {
    elements.forEach((element) => {
      element.classList.add("hide-ads");
    });

    iframes.forEach((iframe) => {
      iframe.remove();
    });

    chrome.storage.local.set({ adsHidden: true });
  } else if (action === "show") {
    elements.forEach((element) => {
      element.classList.remove("hide-ads");
    });

    chrome.storage.local.set({ adsHidden: false });
  }
}

function toggleReaderMode(selectors, action) {
  const combinedArticleSelector = selectors.join(", ");
  const elements = document.querySelectorAll(combinedArticleSelector);

  if (action === "center") {
    elements.forEach((element) => {
      element.classList.add("center-content");
    });

    chrome.storage.local.set({ readerMode: true });
  } else if (action === "default") {
    elements.forEach((element) => {
      element.classList.remove("center-content");
    });

    chrome.storage.local.set({ readerMode: false });
  }
}

// select SVG filter
function selectVisualFilter(filter) {
  let existingFilters = document.getElementById("svg-filters");
  if (existingFilters) {
    existingFilters.remove();
  }

  let svgFilters = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  svgFilters.setAttribute("class", "svg-filters");
  svgFilters.setAttribute("id", "svg-filters");
  svgFilters.style.display = "none";

  switch (filter) {
    case "Dark Mode":
      svgFilters.innerHTML = `
    <filter id="dark-mode">
      <feComponentTransfer>
        <feFuncR type="table" tableValues="1 0" />
        <feFuncG type="table" tableValues="1 0" />
        <feFuncB type="table" tableValues="1 0" />
      </feComponentTransfer>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 1" />
      </feComponentTransfer>
    </filter>`;
      document.body.style.filter = "url('#dark-mode')";
      break;
    case "Grayscale Mode":
      svgFilters.innerHTML = `
    <filter id="grayscale-mode">
      <feColorMatrix type="saturate" values="0" />
    </filter>`;
      document.body.style.filter = "url('#grayscale-mode')";
      break;
    case "Blur Mode":
      svgFilters.innerHTML = `
        <filter id="blur">
          <feGaussianBlur stdDeviation="5" />
        </filter>`;
      document.body.style.filter = "url('#blur')";
      break;
    case "Low Contrast Mode":
      svgFilters.innerHTML = `
        <filter id="low-contrast">
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
        </filter>`;
      document.body.style.filter = "url('#low-contrast')";
      break;
    case "Red-Blind Mode":
      svgFilters.innerHTML = `
        <filter id="protanopia">
          <fecolormatrix type="matrix" values="0.567,0.433,0,0,0  0.558,0.442,0,0,0  0,0.242,0.758,0,0  0,0,0,1,0" />
        </filter>`;
      document.body.style.filter = "url('#protanopia')";
      break;
    case "Green-Blind Mode":
      svgFilters.innerHTML = `
        <filter id="deuteranopia">
          <fecolormatrix type="matrix" values="0.625,0.375,0,0,0  0.7,0.3,0,0,0  0,0.3,0.7,0,0  0,0,0,1,0" />
        </filter>`;
      document.body.style.filter = "url('#deuteranopia')";
      break;
    case "Blue-Blind Mode":
      svgFilters.innerHTML = `
        <filter id="tritanopia">
          <fecolormatrix type="matrix" values="0.95,0.05,0,0,0  0,0.433,0.567,0,0  0,0.475,0.525,0,0  0,0,0,1,0" />
        </filter>`;
      document.body.style.filter = "url('#tritanopia')";
      break;
    default:
      document.body.style.filter = "none";
      break;
  }

  if (filter !== "No Filter") {
    document.body.appendChild(svgFilters);
  }
}

function loadState() {
  chrome.storage.local.get(["adsHidden", "readerMode"], function (result) {
    if (result.adsHidden) {
      toggleAds(ADSELECTORS, "hide");
    }

    if (result.readerMode) {
      toggleReaderMode(ARTICLESELECTOR, "center-content");
    }
  });
}

function showToast(message, type) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
  }, 0);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  }, 3000);
}

loadState();
