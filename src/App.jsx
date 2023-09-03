import { useEffect, useState } from "react";
import Features from "./components/Features";
import Login from "./components/Login";
import { auth } from "./utils/firebase";
import styled from "styled-components";

function App() {
  const [authState, setAuthState] = useState({
    user: null,
    idToken: null,
  });

  useEffect(() => {
    chrome.storage.local.get(["authState"], (result) => {
      if (result.authState) {
        setAuthState(result.authState);
      }
    });

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const firebaseIdToken = await firebaseUser.getIdToken(true);
        setAuthState({
          user: firebaseUser,
          idToken: firebaseIdToken,
        });

        chrome.storage.local.set({
          authState: { user: firebaseUser, idToken: firebaseIdToken },
        });

        chrome.runtime.sendMessage({
          action: "userLoggedIn",
          firebaseUid: firebaseUser.uid,
          idToken: firebaseIdToken,
        });
      } else {
        setAuthState({
          user: null,
          idToken: null,
        });
        chrome.storage.local.remove("authState");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AppContainer>
      {authState && authState.user ? (
        <Features authState={authState} />
      ) : (
        <Login onLoginSuccess={setAuthState} />
      )}
    </AppContainer>
  );
}

const AppContainer = styled.div`
  position: relative;
  min-width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default App;
