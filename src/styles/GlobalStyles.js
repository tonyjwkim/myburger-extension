import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  :root {
    font-family: Arial, sans-serif;
    color-scheme: black;
    background-color: white;
    text-rendering: optimizeLegibility;
  }

  body {
    height: 250px;
    width: 300px;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
`;

export default GlobalStyle;
