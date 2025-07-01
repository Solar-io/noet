#!/usr/bin/env node

import { exec } from "child_process";

const ports = [3001, 3002, 3003];
const portList = ports.join(",");

exec(`lsof -ti:${portList} | xargs -r kill -9`, (error, stdout, stderr) => {
  if (error && !error.message.includes("No such process")) {
    console.error("Error cleaning processes:", error.message);
    process.exit(1);
  }

  console.log(stdout || "No processes to kill");
  console.log("✅ Cleanup complete");
});
