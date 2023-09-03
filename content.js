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
let isTextSelected = false;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
    chrome.storage.sync.set({ focusMode: true });

    sendResponse({ message: "Custom ads removed and contents centered" });
  } else if (request.action === "showCustomAds") {
    toggleAds(ADSELECTORS, "show");
    toggleReaderMode(ARTICLESELECTOR, "default");
    chrome.storage.sync.set({ focusMode: false });

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
chrome.storage.sync.get(["isHighlightMode", "focusMode"], function (data) {
  isHighlightMode = data.isHighlightMode || false;
  console.log("isHighlightMode from storage: " + isHighlightMode);

  const isFocusMode = data.focusMode || false;
  if (isFocusMode) {
    toggleAds(ADSELECTORS, "hide");
    toggleReaderMode(ARTICLESELECTOR, "center");
  }
});

// highlight new text
document.addEventListener("mouseup", function (event) {
  if (isHighlightMode) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    console.log("Selected Text : " + selectedText);

    if (selectedText.length >= 2) {
      isTextSelected = true;
      currentSelection = selection;
      highlightedTextContent = selectedText;
      showContextMenu(event.clientX, event.clientY);
      event.stopPropagation();
    }
  }
});

// click highlighted text
document.addEventListener("click", function (event) {
  lastClickedHighlight = event.target;
  console.log("last clicked:" + lastClickedHighlight);

  if (isTextSelected) {
    isTextSelected = false;
    return;
  }

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
    contextMenu.innerHTML = `<button id="saveHighlight">Save</button>`;
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
    if (
      !contextMenu.contains(event.target) &&
      document.body.contains(contextMenu)
    ) {
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
      showToast("Successfully Saved!", "success");
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to Save!", "fail");
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

function applyDarkModeToElements() {
  const allElements = document.querySelectorAll("body, body *");
  allElements.forEach((el) => {
    const computedStyle = getComputedStyle(el);

    // if backgroundColor is white, change to #121212
    if (
      computedStyle.backgroundColor === "rgb(255, 255, 255)" ||
      computedStyle.backgroundColor === "rgb(102, 102, 102)" ||
      computedStyle.backgroundColor === "rgb(248, 249, 252)" ||
      computedStyle.backgroundColor === "rgb(239, 239, 240)"
    ) {
      el.style.setProperty("background", "#121212", "important");
    }

    // if text color is #1e1e23 black #303038 #222222, change to white
    if (
      computedStyle.color === "rgb(30, 30, 35)" ||
      computedStyle.color === "rgb(48, 48, 56)" ||
      computedStyle.color === "rgb(34, 34, 34)" ||
      computedStyle.color === "rgb(0, 0, 0)" ||
      computedStyle.color === "rgb(3, 0, 0)"
    ) {
      el.style.color = "#ffffff";
    }
  });

  const style = document.createElement("style");
  style.setAttribute("reverted", "false");

  style.innerHTML = `
    .as_gnb_mnews .Nlnb::before,
    .Nlnb.is_fixed::before,
    .Nlnb::after,
    .u_cbox .u_cbox_sort::before,
    .u_cbox .u_cbox_sort::after,
    .office_headline .ofhe_item::before,
    .u_ft_inner::before,
    .rankingnews .ra_tab_item .ra_tab_a {
      background-color: #121212 !important;
      background: #121212 !important;
    }
    .ranking_list .rl_time::before, .ranking_list .rl_comment::before, .ranking_list .rl_player::before, .ranking_list .rl_visit::before, .ra_extra_area .rl_time::before, .ra_extra_area .rl_comment::before, .ra_extra_area .rl_player::before, .ra_extra_area .rl_visit::before,
    .media_end_head_share .send_caption,
    .media_end_head_fontsize_set::before,
    .media_end_head_tts_run::before,
    .media_end_head_autosummary_button::before {
      filter: brightness(0) invert(1);
    }
  `;

  document.head.appendChild(style);
}

function revertDarkModeFromElements() {
  // Remove styles from individual elements
  const allElements = document.querySelectorAll("body, body *");
  allElements.forEach((el) => {
    const computedStyle = getComputedStyle(el);

    if (computedStyle.backgroundColor === "rgb(18, 18, 18)") {
      el.style.removeProperty("background");
    }

    if (computedStyle.color === "rgb(255, 255, 255)") {
      el.style.removeProperty("color");
    }
  });

  // Remove the added style element (if it exists)
  const addedStyle = document.querySelector('style[reverted="false"]');
  if (addedStyle) {
    addedStyle.remove();
  }
}

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
  document.body.style.filter = "none";

  switch (filter) {
    case "No Filter":
      document.body.style.filter = null;
      revertDarkModeFromElements();
      break;
    case "Dark Mode":
      applyDarkModeToElements();
      break;
    case "Grayscale Mode":
      svgFilters.innerHTML = `
    <filter id="grayscale-mode">
      <feColorMatrix type="saturate" values="0" />
    </filter>`;
      document.body.style.filter = "url('#grayscale-mode')";
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
