import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import { HashRouter } from "react-router-dom";
// Import FontAwesome CSS
import '@fortawesome/fontawesome-free/css/all.min.css';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
  <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </HashRouter>
  // </React.StrictMode>
);
