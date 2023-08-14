import { useEffect, useState } from "react";
import Features from "./components/Features";
import Login from "./components/Login";
import { auth } from "./utils/firebase";

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

  if (isLoading) return null;

  return authState && authState.user ? (
    <Features authState={authState} />
  ) : (
    <Login onLoginSuccess={setAuthState} />
  );
}

export default App;
