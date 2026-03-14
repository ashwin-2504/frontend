# Native Expo App

A React Native mobile application built with [Expo](https://expo.dev/).

## 🚀 Getting Started

Follow these instructions to set up the project locally and view changes in the Expo Go app.

### Prerequisites

- **Node.js**: [Download and install](https://nodejs.org/) (Version 18 or later recommended).
- **npm** (usually comes with Node.js) or **yarn**.
- **Expo Go App**: Install it on your [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) or [iOS](https://apps.apple.com/app/expo-go/id982107779) device.

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd Native
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### 💻 Development

Start the Expo development server:

```bash
npm start
```

This will start the **Expo CLI** and display a QR code in your terminal.

## 📱 Viewing Changes on Your Device

1. Open the **Expo Go** app on your phone.
2. **Android**: Use the "Scan QR Code" feature.
3. **iOS**: Use the camera app to scan the terminal's QR code, or open the link from the Expo Go app.
4. Ensure your phone and computer are on the **same Wi-Fi network**.

### Build & OTA (No Local Android SDK)

For production binaries and air updates, use EAS:

```bash
npm run build:android
npm run update:production -- --message "Your update message"
```

## 🛠️ Project Structure

- `App.js`: The main entry point of the application.
- `app.json`: Configuration for the Expo project.
- `assets/`: Folder containing images, icons, and fonts.

## ⚡ Live Reloading

Once the app is running on your device, any changes you make to the code (e.g., in `App.js`) will **automatically refresh** the app, allowing you to see results instantly.
