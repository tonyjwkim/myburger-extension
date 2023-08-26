import { useState, useEffect } from "react";
import styled from "styled-components";

function Features({ authState }) {
  const [isHighlightModeActive, setIsHighlightModeActive] = useState(false);
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const visualFilters = [
    "No Filter",
    "Dark Mode",
    "Blur Mode",
    "Low Contrast Mode",
    "Grayscale Mode",
    "Red-Blind Mode",
    "Green-Blind Mode",
    "Blue-Blind Mode",
  ];

  useEffect(() => {
    chrome.storage.sync.get(["highlightMode", "focusMode"], (data) => {
      setIsHighlightModeActive(data.highlightMode || false);
      setIsFocusModeActive(data.focusMode || false);
    });
  }, []);

  function handleToggleHighlightMode() {
    const newHighlightModeState = !isHighlightModeActive;
    setIsHighlightModeActive(newHighlightModeState);

    chrome.storage.sync.set(
      { highlightMode: newHighlightModeState },
      function () {
        console.log("Highlight mode saved as:", newHighlightModeState);
      },
    );

    const highlightState = newHighlightModeState ? "on" : "off";
    console.log("After clicking highlightMode:", highlightState);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      console.log("Sending highlight mode to tab: ", activeTab.id);

      chrome.tabs.sendMessage(
        activeTab.id,
        {
          action: "toggleHighlightMode",
          state: highlightState,
        },
        function (response) {
          console.log(response.message);
        },
      );
    });
  }

  function handleToggleFocusMode() {
    const newFocusModeState = !isFocusModeActive;
    setIsFocusModeActive(newFocusModeState);

    const focusState = newFocusModeState ? "on" : "off";
    console.log("After clicking focusMode:", focusState);

    chrome.storage.sync.set({ focusMode: newFocusModeState }, function () {
      console.log("Focus mode saved as:", newFocusModeState);
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      console.log("Sending focus mode to tab: ", activeTab.id);

      chrome.runtime.sendMessage({
        action: "toggleFocusMode",
        state: focusState,
      });
    });
  }

  function VisualFilterDropdown() {
    function handleFilterChange(event) {
      const selectedFilter = event.target.value;

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        console.log("Sending message to tab: ", activeTab.id);
        console.log("Selected Filter: ", selectedFilter);

        chrome.tabs.sendMessage(activeTab.id, {
          action: "applyVisualFilter",
          filter: selectedFilter,
        });
      });
    }

    return (
      <div>
        <select onChange={handleFilterChange}>
          {visualFilters.map((filter, index) => (
            <option key={index}>{filter}</option>
          ))}
        </select>
      </div>
    );
  }

  function handleOpenDashboard() {
    if (authState && authState.idToken) {
      chrome.runtime.sendMessage({
        action: "openDashboard",
        token: authState.idToken,
      });
    }
  }

  return (
    <FeaturesWrapper>
      <FeaturesHeader>Features</FeaturesHeader>
      <FeatureSection>
        <FeatureItem>
          <FeatureLabel>Highlight Mode</FeatureLabel>
          <ToggleButton
            onClick={handleToggleHighlightMode}
            isActive={isHighlightModeActive}
          >
            {isHighlightModeActive ? "ON" : "OFF"}
          </ToggleButton>
        </FeatureItem>
      </FeatureSection>
      <FeatureSection>
        <FeatureItem>
          <FeatureLabel>Focus Mode</FeatureLabel>
          <ToggleButton
            onClick={handleToggleFocusMode}
            isActive={isFocusModeActive}
          >
            {isFocusModeActive ? "ON" : "OFF"}
          </ToggleButton>
        </FeatureItem>
      </FeatureSection>
      <FeatureSection>
        <FeatureItem>
          <FeatureLabel>Visual Filters</FeatureLabel>
          <VisualFilterDropdown />
        </FeatureItem>
      </FeatureSection>
      <button onClick={handleOpenDashboard}>My Archives</button>
    </FeaturesWrapper>
  );
}

const FeaturesWrapper = styled.div`
  background-color: #ffdab9;
  border-radius: 8px;
  padding: 20px;
  width: 250px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: black;
`;

const FeaturesHeader = styled.h2`
  font-size: 20px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
  margin-bottom: 15px;
`;

const FeatureSection = styled.div`
  margin-bottom: 15px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FeatureLabel = styled.div`
  flex: 1;
`;

const ToggleButton = styled.button`
  background-color: ${({ isActive }) => (isActive ? "green" : "red")};
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
`;

export default Features;
