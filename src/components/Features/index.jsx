import { useState, useEffect } from "react";
import styled from "styled-components";

function Features({ authState }) {
  const [HighlightMode, setHighlightMode] = useState(false);
  const [FocusMode, setFocusMode] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get("highlightMode", (data) => {
      setHighlightMode(data.highlightMode || false);
    });
    chrome.storage.sync.get("focusMode", (data) => {
      setFocusMode(data.focusMode || false);
    });
  }, [HighlightMode]);

  function toggleHighlightMode() {
    let newMode = !HighlightMode;
    setHighlightMode(newMode);

    chrome.storage.sync.set({ highlightMode: newMode }, function () {
      console.log("Highlight mode saved as:", newMode);
    });

    const highlightState = newMode ? "on" : "off";
    console.log("after clicking highlightMode:", highlightState);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      console.log("Sending message to tab: ", activeTab.id);

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

  function toggleFocusMode() {
    let newMode = !FocusMode;
    setFocusMode(newMode);

    chrome.storage.sync.set({ focusMode: newMode }, function () {
      console.log("Focus mode saved as:", newMode);
    });

    const focusState = newMode ? "on" : "off";
    console.log("after clicking focusMode:", focusState);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      console.log("Sending message to tab: ", activeTab.id);

      chrome.tabs.sendMessage(
        activeTab.id,
        {
          action: "toggleFocusMode",
          state: focusState,
        },
        function (response) {
          console.log(response.message);
        },
      );
    });
  }

  function openDashboard() {
    if (authState && authState.idToken) {
      chrome.runtime.sendMessage({
        action: "openDashboard",
        token: authState.idToken,
      });
    }
  }

  return (
    <FeaturesContainer>
      <Header>Features</Header>
      <FeatureBlock>
        <FeatureRow>
          <FeatureText>Highlight Mode</FeatureText>
          <ToggleHighlightButton
            onClick={toggleHighlightMode}
            active={HighlightMode}
          >
            {HighlightMode ? "ON" : "OFF"}
          </ToggleHighlightButton>
        </FeatureRow>
      </FeatureBlock>
      <FeatureBlock>
        <FeatureRow>
          <FeatureText>Focus Mode</FeatureText>
          <ToggleHighlightButton onClick={toggleFocusMode} active={FocusMode}>
            {FocusMode ? "ON" : "OFF"}
          </ToggleHighlightButton>
        </FeatureRow>
      </FeatureBlock>
      <FeatureBlock>Visual Filters</FeatureBlock>
      <button onClick={openDashboard}>My Archives</button>
    </FeaturesContainer>
  );
}

const FeaturesContainer = styled.div`
  background-color: #ffdab9;
  border-radius: 8px;
  padding: 20px;
  width: 250px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: black;
`;

const Header = styled.h2`
  font-size: 20px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
  margin-bottom: 15px;
`;

const FeatureBlock = styled.div`
  margin-bottom: 15px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const FeatureRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FeatureText = styled.div`
  flex: 1;
`;

const ToggleHighlightButton = styled.button`
  background-color: ${({ active }) => (active ? "green" : "red")};
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
`;

export default Features;
