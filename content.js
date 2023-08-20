console.log("Content script loaded.");

let isHighlightMode = false;
let currentSelection;
let highlightedTextContent = null;
let lastClickedHighlight;

chrome.runtime.onMessage.addListener(function (message, request, sendResponse) {
  // get toggle status from popup and set highlightmode in storage
  if (message.action === "toggleHighlightMode") {
    if (message.state === "on") {
      isHighlightMode = true;
    } else if (message.state === "off") {
      isHighlightMode = false;
    }

    chrome.storage.sync.set({ isHighlightMode: isHighlightMode });

    sendResponse({
      status: "success",
      message: `Highlight mode set to ${message.state}`,
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

    if (selectedText.length >= 1) {
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
  if (event.target.classList.contains("highlightedText")) {
    showContextMenu(event.clientX, event.clientY, "highlighted");
  }
});

// show context menu (highlight OR Save/Remove)
function showContextMenu(x, y, context = "default") {
  const contextMenu = document.createElement("div");
  document.body.appendChild(contextMenu);
  contextMenu.classList.add("contextMenu");

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
    if (currentSelection && currentSelection.rangeCount > 0) {
      const range = currentSelection.getRangeAt(0);

      if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
        handleNodeHighlighting(range.commonAncestorContainer, range);
      } else {
        const commonAncestor = range.commonAncestorContainer;

        const treeWalker = document.createTreeWalker(
          commonAncestor,
          NodeFilter.SHOW_ALL,
          {
            acceptNode: function (node) {
              if (range.intersectsNode(node)) {
                return NodeFilter.FILTER_ACCEPT;
              }
              return NodeFilter.FILTER_SKIP;
            },
          },
        );

        let node;
        while ((node = treeWalker.nextNode())) {
          console.log("TreeWalker loop start");
          console.log("Node found:", node);
          handleNodeHighlighting(node, range);
          console.log("TreeWalker loop end");
        }
      }

      closeContextMenu();
    }
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
  console.log("Processing node:", node);

  if (node.nodeType === Node.TEXT_NODE) {
    const textNode = node;
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : textNode.length;

    if (start < end) {
      const preText = document.createTextNode(
        textNode.textContent.substring(0, start),
      );
      const highlightedText = document.createElement("span");
      highlightedText.classList.add("highlightedText");
      highlightedText.textContent = textNode.textContent.substring(start, end);
      const postText = document.createTextNode(
        textNode.textContent.substring(end),
      );

      textNode.parentNode.insertBefore(preText, textNode);
      textNode.parentNode.insertBefore(highlightedText, textNode);
      textNode.parentNode.insertBefore(postText, textNode);

      textNode.parentNode.removeChild(textNode);
    }
  }
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

    const url = `http://localhost:3000/users/${userIdFromStorage}/contents`;
    console.log(url);
    const data = {
      textContent: highlightedTextContent,
      userId: userIdFromStorage,
      url: currentUrl,
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
    } catch (error) {
      console.error("Error:", error);
    }
  });
}
