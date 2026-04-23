const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Script to update the Expo API URL.
 * By default we keep the app pointed at the hosted Vercel backend.
 * Set USE_LOCAL_API=true to rewrite the URL to a local LAN endpoint.
 */

const HOSTED_API_URL = 'https://backend-one-eta-35.vercel.app';

function getLocalUrl() {
  // In many home networks, .local works and is stable across IP changes.
  // However, for Android Emulators, we specifically want 10.0.2.2.
  // For physical devices, LAN IP is most reliable if .local is not supported.
  
  const interfaces = os.networkInterfaces();
  const priorityPatterns = [/wi-fi/i, /ethernet/i, /wlan/i, /lan/i];
  const candidates = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push({ name, address: iface.address });
      }
    }
  }

  const lanIp = candidates.length > 0 ? candidates[0].address : '127.0.0.1';
  
  // Check if we have a priority interface
  for (const pattern of priorityPatterns) {
    const found = candidates.find(c => pattern.test(c.name));
    if (found) {
      return `http://${found.address}:3000`;
    }
  }

  return `http://${lanIp}:3000`;
}

const envPath = path.join(__dirname, '..', '.env');
const useLocalApi = String(process.env.USE_LOCAL_API || '').toLowerCase() === 'true';
const newUrl = useLocalApi ? getLocalUrl() : HOSTED_API_URL;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, `EXPO_PUBLIC_API_URL=${newUrl}\n`);
  console.log(`Created .env with EXPO_PUBLIC_API_URL=${newUrl}`);
} else {
  let content = fs.readFileSync(envPath, 'utf8');
  const apiVarRegex = /^EXPO_PUBLIC_API_URL=(.*)$/m;
  const match = content.match(apiVarRegex);

  if (!match) {
    content += `\nEXPO_PUBLIC_API_URL=${newUrl}\n`;
    fs.writeFileSync(envPath, content);
    console.log(`Added EXPO_PUBLIC_API_URL=${newUrl}`);
  } else {
    const currentUrl = match[1].trim();
    if (currentUrl !== newUrl) {
      const updatedContent = content.replace(apiVarRegex, `EXPO_PUBLIC_API_URL=${newUrl}`);
      fs.writeFileSync(envPath, updatedContent);
      console.log(`Updated EXPO_PUBLIC_API_URL: ${currentUrl} -> ${newUrl}`);
    } else {
      console.log(`Current API URL is: ${currentUrl}`);
    }
  }
}
