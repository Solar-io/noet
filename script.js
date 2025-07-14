// Configuration
const CONFIG = {
  DEFAULT_DURATIONS: [60, 240, 480], // 1hr, 4hr, 8hr in minutes
  MAX_CUSTOM_HOURS: 24,
  TICK_INTERVAL: 1000, // 1 second
  HEARTBEAT_INTERVAL: 5000, // 5 seconds
  DOM_ACTIVITY_INTERVAL: 2000, // 2 seconds
  WAKE_METHODS: {
    WAKE_LOCK: "wake_lock",
    VIDEO: "video",
    AUDIO: "audio",
    INTERVAL: "interval",
    SERVICE_WORKER: "service_worker",
    WEB_WORKER: "web_worker",
    WEBSOCKET: "websocket",
    DOM_ACTIVITY: "dom_activity",
  },
};

// State management
let state = {
  isActive: false,
  startTime: null,
  duration: 0,
  wakeLock: null,
  timer: null,
  tickInterval: null,
  discordEnabled: false,
  discordWebhook: "",
  customDuration: 30,
  // Enhanced fallback methods
  videoElement: null,
  audioContext: null,
  audioOscillator: null,
  keepAliveInterval: null,
  visibilityChangeHandler: null,
  // New background methods
  serviceWorker: null,
  webWorker: null,
  webSocket: null,
  domActivityInterval: null,
  heartbeatInterval: null,
  backgroundMethods: new Set(),
};

// DOM elements
const elements = {
  timerDisplay: null,
  countdownElement: null,
  endTimeElement: null,
  durationButtons: null,
  customDurationInput: null,
  startButton: null,
  stopButton: null,
  toggleButton: null,
  discordEnabled: null,
  discordWebhook: null,
  statusElement: null,
  interfaceContainer: null,
};

let timerInterval;
let isTimerRunning = false;
let remainingTime = 0;
let keepAliveVideo = null;

// Load settings from localStorage
function loadSettings() {
  const customDuration = localStorage.getItem("customDuration");
  const discordWebhook = localStorage.getItem("discordWebhook");

  if (customDuration) {
    document.getElementById("customDuration").value = customDuration;
  }

  if (discordWebhook) {
    document.getElementById("discordWebhook").value = discordWebhook;
  }
}

// Save settings to localStorage
function saveSettings() {
  const customDuration = document.getElementById("customDuration").value;
  const discordWebhook = document.getElementById("discordWebhook").value;

  localStorage.setItem("customDuration", customDuration);
  localStorage.setItem("discordWebhook", discordWebhook);
}

// Picture-in-Picture keep-alive system
async function startKeepAlive() {
  try {
    // Create tiny 1x1 pixel video
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");

    // Create a minimal animation to keep the video active
    let frame = 0;
    const animate = () => {
      ctx.fillStyle = frame % 2 === 0 ? "#000000" : "#000001";
      ctx.fillRect(0, 0, 1, 1);
      frame++;
      if (keepAliveVideo && !keepAliveVideo.paused) {
        setTimeout(animate, 1000); // 1 FPS
      }
    };
    animate();

    keepAliveVideo = document.createElement("video");
    keepAliveVideo.style.position = "fixed";
    keepAliveVideo.style.top = "-100px";
    keepAliveVideo.style.left = "-100px";
    keepAliveVideo.style.width = "1px";
    keepAliveVideo.style.height = "1px";
    keepAliveVideo.style.opacity = "0";
    keepAliveVideo.style.pointerEvents = "none";
    keepAliveVideo.muted = true;
    keepAliveVideo.loop = true;
    keepAliveVideo.controls = false;
    keepAliveVideo.playsInline = true;

    // Create video stream from canvas
    const stream = canvas.captureStream(1);
    keepAliveVideo.srcObject = stream;
    document.body.appendChild(keepAliveVideo);

    // Start playing the video
    await keepAliveVideo.play();
    console.log("✅ Video element started");

    // Request Picture-in-Picture mode
    if (
      "pictureInPictureEnabled" in document &&
      document.pictureInPictureEnabled
    ) {
      await keepAliveVideo.requestPictureInPicture();
      console.log("✅ Picture-in-Picture keep-alive activated");

      // Handle PiP events
      keepAliveVideo.addEventListener("enterpictureinpicture", () => {
        console.log(
          "📺 Entered Picture-in-Picture mode - system will stay awake"
        );
        showStatus(
          "Keep-awake system activated (Picture-in-Picture)",
          "success"
        );
      });

      keepAliveVideo.addEventListener("leavepictureinpicture", () => {
        console.log("⚠️ Left Picture-in-Picture mode");
        showStatus(
          "Picture-in-Picture closed - video still playing",
          "warning"
        );
      });
    } else {
      console.log(
        "⚠️ Picture-in-Picture not supported, but video will still help keep system awake"
      );
      showStatus("Keep-awake video started (PiP not supported)", "info");
    }

    // Handle play/pause events
    keepAliveVideo.addEventListener("play", () => {
      console.log("▶️ Keep-alive video playing");
    });

    keepAliveVideo.addEventListener("pause", () => {
      console.log("⏸️ Keep-alive video paused - attempting to resume");
      if (isTimerRunning) {
        keepAliveVideo.play().catch(console.error);
      }
    });
  } catch (error) {
    console.error("❌ Could not start keep-alive:", error);
    showStatus("Keep-awake system failed to start", "error");

    // Fallback: just keep the hidden video playing
    if (keepAliveVideo) {
      keepAliveVideo.play().catch(console.error);
    }
  }
}

// Stop keep-alive system
function stopKeepAlive() {
  if (keepAliveVideo) {
    try {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(console.error);
      }
      keepAliveVideo.pause();
      keepAliveVideo.remove();
      keepAliveVideo = null;
      console.log("🛑 Keep-alive stopped");
      showStatus("Keep-awake system stopped", "info");
    } catch (error) {
      console.error("Error stopping keep-alive:", error);
    }
  }
}

// Format time display
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }
}

// Update timer display
function updateDisplay() {
  const countdownElement = document.getElementById("countdown");
  const endTimeElement = document.getElementById("endTime");

  if (remainingTime > 0) {
    countdownElement.textContent = formatTime(remainingTime);

    const endTime = new Date(Date.now() + remainingTime * 1000);
    endTimeElement.textContent = endTime.toLocaleTimeString();
  } else {
    countdownElement.textContent = "00:00";
    endTimeElement.textContent = "--:--";
  }
}

// Start timer
async function startTimer(duration) {
  if (isTimerRunning) return;

  remainingTime = duration;
  isTimerRunning = true;

  // Start keep-alive system
  showStatus("Starting keep-awake system...", "info");
  await startKeepAlive();

  // Hide interface
  document.getElementById("interface").style.display = "none";
  document.getElementById("activeTimer").style.display = "block";

  // Update display immediately
  updateDisplay();

  // Start countdown
  timerInterval = setInterval(() => {
    remainingTime--;
    updateDisplay();

    if (remainingTime <= 0) {
      stopTimer();
      sendDiscordNotification("⏰ No Sleep Timer completed!");
    }
  }, 1000);

  console.log(`⏱️ Timer started for ${formatTime(duration)}`);
}

// Stop timer
function stopTimer() {
  if (!isTimerRunning) return;

  isTimerRunning = false;
  clearInterval(timerInterval);

  // Stop keep-alive system
  stopKeepAlive();

  // Show interface
  document.getElementById("interface").style.display = "block";
  document.getElementById("activeTimer").style.display = "none";

  remainingTime = 0;
  updateDisplay();

  console.log("🛑 Timer stopped");
}

// Toggle interface visibility
function toggleInterface() {
  const interface = document.getElementById("interface");
  const isVisible = interface.style.display !== "none";
  interface.style.display = isVisible ? "none" : "block";
}

// Show status message
function showStatus(message, type = "info") {
  const statusElement = document.getElementById("status");
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;

    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusElement.textContent = "";
      statusElement.className = "status";
    }, 3000);
  }
}

// Send Discord notification
async function sendDiscordNotification(message) {
  const webhook = document.getElementById("discordWebhook").value;
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
    console.log("✅ Discord notification sent");
    showStatus("Discord notification sent", "success");
  } catch (error) {
    console.error("❌ Discord notification failed:", error);
    showStatus("Discord notification failed", "error");
  }
}

// Event listeners
document.getElementById("start1h").addEventListener("click", () => {
  saveSettings();
  startTimer(3600);
});

document.getElementById("start4h").addEventListener("click", () => {
  saveSettings();
  startTimer(14400);
});

document.getElementById("start8h").addEventListener("click", () => {
  saveSettings();
  startTimer(28800);
});

document.getElementById("startCustom").addEventListener("click", () => {
  const duration =
    parseInt(document.getElementById("customDuration").value) * 60;
  if (duration > 0) {
    saveSettings();
    startTimer(duration);
  }
});

document.getElementById("stopTimer").addEventListener("click", stopTimer);
document
  .getElementById("toggleInterface")
  .addEventListener("click", toggleInterface);

// Load settings on page load
document.addEventListener("DOMContentLoaded", loadSettings);

// Update display on load
updateDisplay();

// Add some helpful console messages
console.log("🌙 No Sleep Timer initialized");
console.log("📺 Using Picture-in-Picture keep-awake system");
console.log(
  "💡 This method works by creating a tiny hidden video that can run in Picture-in-Picture mode"
);
console.log(
  "🎯 Click any duration button to start the timer and activate keep-awake"
);
