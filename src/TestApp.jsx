import React from "react";

const TestApp = () => {
  console.log("TestApp component is rendering");

  return React.createElement(
    "div",
    {
      style: {
        padding: "20px",
        backgroundColor: "#f0f8ff",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      },
    },
    React.createElement(
      "h1",
      { style: { color: "green" } },
      "🎉 React is Working!"
    ),
    React.createElement(
      "p",
      null,
      "If you can see this, React is rendering correctly."
    ),
    React.createElement(
      "p",
      null,
      `Current time: ${new Date().toLocaleString()}`
    ),
    React.createElement("p", null, "This is a minimal test component.")
  );
};

export default TestApp;
