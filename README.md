# No Sleep Timer 🌙

A sleep timer that prevents your computer from going to sleep, designed to look like a regular timer rather than an obvious "keep-awake" tool.

## Features

- **Picture-in-Picture Keep-Awake**: Uses a tiny hidden video that can run in Picture-in-Picture mode to keep your system awake
- **Multiple Duration Options**: 1hr, 4hr, 8hr, or custom duration
- **Clean Interface**: Sleep-friendly purple design with glassmorphism effects
- **NSA Background**: Displays the NSA website at low opacity for discretion
- **Discord Notifications**: Optional webhook notifications when timer completes
- **Persistent Settings**: Saves custom duration and Discord webhook to localStorage
- **Manual Interface Control**: Toggle interface visibility with always-visible button

## How It Works

The app uses the **Picture-in-Picture API** with a tiny 1x1 pixel video to keep your system awake. This method:

- Creates a minimal hidden video element
- Requests Picture-in-Picture mode which can run in the background
- Works even when the browser tab is not active or the window is minimized
- Is much more reliable than traditional keep-awake methods
- Only requires one user interaction to activate

## Usage

### Simple Static Mode (Recommended)

1. Open `index.html` in your browser
2. Choose a duration (1hr, 4hr, 8hr, or custom)
3. Click start - the Picture-in-Picture video will automatically launch
4. The timer will keep your system awake even if you minimize the browser

### Browser Compatibility

- **Chrome/Edge**: Full Picture-in-Picture support
- **Firefox**: Limited PiP support, falls back to hidden video
- **Safari**: Basic support varies by version

## Interface Controls

- **Duration Buttons**: Quick selection for 1hr, 4hr, or 8hr
- **Custom Duration**: Set any duration in minutes
- **Discord Webhook**: Optional notifications when timer completes
- **Toggle Interface**: Top-left button to show/hide controls manually
- **Auto-hide**: Interface automatically hides when timer starts

## Technical Implementation

The keep-awake system:

1. Creates a 1x1 pixel canvas with minimal animation
2. Converts canvas to video stream using `captureStream()`
3. Creates hidden video element with the stream
4. Requests Picture-in-Picture mode
5. PiP video continues running even when tab is inactive

This approach is much more reliable than:

- Wake Lock API (limited browser support)
- Service Workers (can be suspended)
- WebSocket connections (can time out)
- DOM manipulation (can be throttled)

## Privacy & Security

- **No Data Collection**: Everything runs locally in your browser
- **No External Connections**: Except optional Discord webhook
- **No Installation Required**: Pure HTML/CSS/JavaScript
- **Open Source**: All code is visible and auditable

## Troubleshooting

If the system still goes to sleep:

1. **Check Browser Support**: Ensure your browser supports Picture-in-Picture
2. **Allow PiP**: Make sure you don't close the Picture-in-Picture window
3. **Keep Browser Open**: Don't force-quit the browser entirely
4. **Power Settings**: Check OS-level power management settings

## Development

The app is a simple static website:

```
index.html  - Main interface
style.css   - Purple sleep-friendly styling
script.js   - Picture-in-Picture keep-awake logic
```

## License

MIT License - Use freely for personal or commercial projects.
