import { useState, useEffect } from "react";
import styled from "styled-components";

function Features({ authState }) {
  const [isHighlightModeActive, setIsHighlightModeActive] = useState(false);
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const visualFilters = [
    "No Filter",
    "Dark Mode",
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
        <StyledSelect onChange={handleFilterChange}>
          {visualFilters.map((filter, index) => (
            <option key={index}>{filter}</option>
          ))}
        </StyledSelect>
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
      <FeaturesHeader>myburger for Chrome</FeaturesHeader>
      <FeatureSection>
        <FeatureItem>
          <FeatureLabel>Highlight Mode</FeatureLabel>
          <ToggleSwitch>
            <ToggleInput
              type="checkbox"
              checked={isHighlightModeActive}
              onChange={handleToggleHighlightMode}
            />
            <ToggleSlider></ToggleSlider>
          </ToggleSwitch>
        </FeatureItem>
      </FeatureSection>
      <FeatureSection>
        <FeatureItem>
          <FeatureLabel>Focus Mode</FeatureLabel>
          <ToggleSwitch>
            <ToggleInput
              type="checkbox"
              checked={isFocusModeActive}
              onChange={handleToggleFocusMode}
            />
            <ToggleSlider></ToggleSlider>
          </ToggleSwitch>
        </FeatureItem>
      </FeatureSection>
      <FeatureSection>
        <FeatureItem>
          <FeatureLabel>Visual Filters</FeatureLabel>
          <VisualFilterDropdown />
        </FeatureItem>
      </FeatureSection>
      <StyledButton onClick={handleOpenDashboard}>
        Go to my Archives
      </StyledButton>
    </FeaturesWrapper>
  );
}

const FeaturesWrapper = styled.div`
  background-color: white;
  padding: 20px;
  width: 250px;
  color: black;
  font-size: 15px;
`;

const FeaturesHeader = styled.h2`
  font-size: 14px;
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

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
`;

const ToggleSlider = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: grey;
  transition: 0.4s;
  border-radius: 20px;
  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  &:checked + span {
    background-color: green;
  }
  &:checked + span:before {
    transform: translateX(20px);
  }
`;

const StyledSelect = styled.select`
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #fff;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const StyledButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
  }

  &:active {
    background-color: #004499;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export default Features;
