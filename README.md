# Nodlets

HTML5 Canvas game hosted on Cloudflare Workers.

## Features

- **Responsive Canvas**: Automatically scales to screen size
- **Zoom Controls**: Mouse wheel, buttons, or keyboard (+/-)
- **Pan Navigation**: Click and drag, or use arrow keys/WASD
- **Tactical Cyberpunk Theme**: Neon purple/cyan aesthetic
- **Plain World**: Simple ground with grid overlay

## Controls

- **Mouse Wheel**: Zoom in/out
- **Click & Drag**: Pan camera
- **Arrow Keys / WASD**: Move camera
- **+/-**: Zoom in/out
- **Buttons**: UI controls for zoom

## Development

```bash
# Install dependencies
bun install

# Run locally
bun run dev

# Deploy to Cloudflare
bun run deploy
```

## Tech Stack

- Vanilla HTML5, CSS3, JavaScript (ES6+)
- Canvas API for rendering
- Cloudflare Workers for hosting
- EZ Space "Tactical Cyberpunk" design system
