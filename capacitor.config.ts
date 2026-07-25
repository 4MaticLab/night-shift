import type { CapacitorConfig } from "@capacitor/cli";

const productionUrl = "https://night-shift-zeta.vercel.app";
const configuredUrl = process.env.CAPACITOR_SERVER_URL?.trim();
const serverUrl = configuredUrl || productionUrl;

const config: CapacitorConfig = {
  appId: "com.fourmaticlab.nightshift",
  appName: "Night Shift",
  webDir: "mobile-shell",
  backgroundColor: "#111a25",
  loggingBehavior: "debug",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    androidScheme: "https",
    errorPath: "index.html",
  },
  ios: {
    contentInset: "never",
    backgroundColor: "#111a25",
    preferredContentMode: "mobile",
    scheme: "NightShift",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#111a25",
  },
};

export default config;
