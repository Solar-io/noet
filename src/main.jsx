import React from "react";
import ReactDOM from "react-dom/client";
import NoetTipTapApp from "./App-TipTap.jsx";
import RobustErrorBoundary from "./components/RobustErrorBoundary.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RobustErrorBoundary
      fallbackMessage="The Noet note-taking app encountered an error. Your notes are safe and you can try to recover."
      onError={(errorDetails) => {
        // Optional: Send to error reporting service
        console.error("Global error captured:", errorDetails);
      }}
    >
      <NoetTipTapApp />
    </RobustErrorBoundary>
  </React.StrictMode>
);
