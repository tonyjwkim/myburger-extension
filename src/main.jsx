import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import GlobalStyles from "./styles/GlobalStyles";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <>
    <GlobalStyles />
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </>,
);
