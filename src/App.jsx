import { useEffect, useState } from "react";
import Features from "./components/Features";
import Login from "./components/Login";
import { auth } from "./utils/firebase";

function App() {
  const initialAuthState =
    localStorage.getItem("authenticated") === "true" ? {} : null;

  const [user, setUser] = useState(initialAuthState);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        localStorage.setItem("authenticated", "true");
        setUser(firebaseUser);
      } else {
        localStorage.setItem("authenticated", "false");
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return user ? <Features /> : <Login onLoginSuccess={setUser} />;
}

export default App;
