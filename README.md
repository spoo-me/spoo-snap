# SpooSnap - Instant URL Shortening Extension 🚀

> Transform long URLs into short, shareable links instantly with this powerful Chrome extension powered by **spoo.me**.

# 🔥 Features

- `Instant Shortening` - **Automatically shorten URLs** as you copy them 🔄
- `Smart QR Codes` - Generate customizable QR codes in real-time 📱
- `Intelligent Notifications` - Clean, minimal notifications with quick actions 🔔
- `History Management` - Track and export your shortened URLs with analytics 📝
- `Rich Customization` - Personalize the extension with themes and settings ⚙️
- `Stealth Mode` - Silent operation without notifications for power users 🕴️
- `Context Menu` - Right-click to shorten links directly from any webpage 🖱️
- `Multi-browser Support` - Works across Chrome and Chromium-based browsers 🌐
- `Custom Domains` - Use your own domain with spoo.me integration 🏢
- `Data Export` - Export history in CSV/JSON formats for analysis 📊

# 🚀 Getting Started

1. **Installation**

   ```bash
   git clone https://github.com/Zingzy/spoo-snap.git
   ```
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable `Developer mode` in the top right corner
5. Click `Load unpacked` and select the cloned extension directory

**Or download directly from Chrome Web Store (coming soon)**

# 🎯 How to Use

1. **Basic Usage**:
   - **Copy any URL** to your clipboard or **right-click** on any url and select `Shorten Link` from the context menu
   - SpooSnap automatically generates a short link and copies it to your clipboard
   - Click notification to copy or scan QR code

<div align="center">

<img src="https://github.com/zingzy/spoo-snap/blob/main/.github/assets/spooSnapDemo.gif" alt="spooSnap Demo" width=500>

</div>

2. 🛠️ **Popup Interface**:
   - Click the extension icon in your toolbar
   - View your URL shortening history
   - Access and modify settings

<div align="center">
<img src="https://github.com/zingzy/spoo-snap/blob/main/.github/assets/popupUi.png" alt="Popup UI Preview" align="center">
</div>

# 🔌 APIs Used

### URL Shortening ([spoo.me](https://spoo.me))
- Supports URL shortening with optional features:
  - Password protection
  - Click limit setting
  - Bot blocking

### QR Code Generation ([qr.spoo.me](https://qr.spoo.me))
- Generates customizable QR codes with options for:
  - Custom colors (fill and background)
  - Various size options

## ⚙️ Configuration Options

| **Feature**   | **Options**                       |
| ------------- | --------------------------------- |
| QR Codes      | Enable/Disable, Style, Colors     |
| Notifications | Duration, Auto-copy, Stealth mode |
| Theme         | Light/Dark                        |
| History       | Auto-save, Export formats         |

# 🛠️ Technical Details

**Built using**:
- Manifest V3
- Chrome Extension APIs (clipboard, storage, notifications)
- [spoo.me](https://spoo.me/api) and [qr.spoo.me](https://qr.spoo.me) REST APIs

# 🌐 Browser Compatibility

**Currently supports**:
- Google Chrome
- Chromium-based browsers (Edge, Brave, etc.)

# 🤝 Contributing

**Contributions are always welcome!** 🎉 Here's how you can contribute:

- Bugs are logged using the github issue system. To report a bug, simply [open a new issue](https://github.com/zingzy/spoo-snap/issues/new).
- Make a [pull request](https://github.com/zingzy/spoo-snap/pull) for any feature or bug fix.

> [!IMPORTANT]
> For any type of support or queries, feel free to reach out to us at <kbd>[✉️ support@spoo.me](mailto:support@spoo.me)</kbd>

---

<h6 align="center">
<img src="https://spoo.me/static/images/favicon.png" height=30 title="Spoo.me Copyright">
<br>
© spoo.me . 2025

All Rights Reserved</h6>

<p align="center">
	<a href="https://github.com/spoo-me/spoo/blob/master/LICENSE.txt"><img src="https://img.shields.io/static/v1.svg?style=for-the-badge&label=License&message=APACHE-2.0&logoColor=d9e0ee&colorA=363a4f&colorB=b7bdf8"/></a>
</p>