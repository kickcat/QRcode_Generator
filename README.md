# QR Code Generator

A fast, privacy-first QR code generator that runs entirely in your browser. Customize colors, error correction, size, and overlay a center logo — no account, no server, no tracking.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## Features

- **Instant local generation** — QR codes are created client-side; nothing leaves your device
- **Live preview** — Updates as you type with debounced rendering
- **Custom colors** — Foreground and background color pickers with hex display
- **Error correction** — Choose L, M, Q, or H levels (H recommended for logos)
- **Adjustable size** — 128 px to 512 px output
- **Center icon / logo upload** — Add a branded logo in the center of your QR code
  - Upload PNG, JPG, WebP, or SVG (max 2 MB)
  - Load from a custom image URL
  - Adjustable icon size (10%–30% of QR width)
  - Auto-suggests **H** error correction when a logo is enabled
- **Quick presets** — URL, email, phone, Wi-Fi, and vCard templates
- **PNG download** — Export the final QR (including logo overlay)
- **Lucide Icons** — Clean, consistent UI icons via [Lucide](https://lucide.dev)
- **Accessible markup** — Semantic HTML, ARIA labels, and keyboard-friendly controls

## Project structure

```
QRcode_Generator/
├── index.html    # Markup and CDN script tags
├── style.css     # Layout, glass UI, and component styles
├── script.js     # QR generation, icon overlay, and interactions
└── README.md
```

## Getting started

No build step or package manager required.

### Option 1 — Open directly

1. Clone or download this repository
2. Open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge)

### Option 2 — Local dev server (recommended)

Serving over HTTP avoids some browser restrictions for image URLs:

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Then visit `http://localhost:8080`.

## Usage

1. Enter a URL or text in the **Content** field
2. Adjust **colors**, **error correction**, and **size** as needed
3. Optionally enable **Center icon / logo**:
   - **Upload** a local image, or switch to **URL** and paste a direct image link
   - Tune **Icon size** — keep it ≤ 25% for reliable scanning
4. Click **Download PNG** to save the result

### Tips for scannable QR codes with logos

- Use **H** (High) error correction when adding a center icon
- Keep the logo between **15–20%** of the QR width
- Prefer simple, high-contrast logos on a solid background pad
- Test the downloaded PNG with your phone camera before printing

## Dependencies (CDN)

| Library | Purpose |
|---------|---------|
| [QRCode.js](https://github.com/davidshimjs/qrcodejs) | QR code generation |
| [Lucide](https://lucide.dev) | UI icons |
| [Inter](https://fonts.google.com/specimen/Inter) | Typography (Google Fonts) |

All dependencies are loaded from CDN; no `npm install` needed.

## Browser support

Works in all modern browsers with Canvas and ES6 support. Image URL loading may fail if the remote server blocks cross-origin requests (CORS).

## License

MIT — feel free to use, modify, and distribute.
