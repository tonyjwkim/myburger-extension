import { useEffect, useState } from "react";
import Features from "./components/Features";
import Login from "./components/Login";
import { auth } from "./utils/firebase";
import styled, { keyframes } from "styled-components";

function App() {
  const [authState, setAuthState] = useState({
    user: null,
    idToken: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const firebaseIdToken = await firebaseUser.getIdToken(true);
        setAuthState({
          user: firebaseUser,
          idToken: firebaseIdToken,
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
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <AppContainer>
      {isLoading ? (
        <LoadingSpinner />
      ) : authState && authState.user ? (
        <Features authState={authState} />
      ) : (
        <Login onLoginSuccess={setAuthState} />
      )}
    </AppContainer>
  );
}

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.div`
  border: 16px solid #f3f3f3;
  border-top: 16px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: ${spin} 2s linear infinite;
  position: absolute;
  top: 30%;
  left: 38%;
  transform: translate(-50%, -50%);
`;

const AppContainer = styled.div`
  position: relative;
  min-width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default App;
