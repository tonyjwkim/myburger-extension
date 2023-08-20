require("dotenv").config();
const fs = require("fs");

const manifest = {
  manifest_version: 3,
  name: "myburger",
  version: "1.0",
  description:
    "Elevate your browsing experience with our intuitive Chrome extension",
  background: {
    service_worker: "background.js",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      css: ["content.css"],
      js: ["content.js"],
      runAt: "document_end",
    },
  ],
  permissions: ["activeTab", "storage", "identity", "tabs"],
  host_permissions: ["http://localhost:3000/"],
  action: {
    default_popup: "index.html",
    default_width: 250,
    default_height: 300,
    default_icon: {
      16: "icons/burger.png",
      48: "icons/burger.png",
      128: "icons/burger.png",
    },
  },
  icons: {
    16: "icons/burger.png",
    48: "icons/burger.png",
    128: "icons/burger.png",
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self';",
  },
  oauth2: {
    client_id: `${process.env.FIREBASE_CLIENT_ID}`,
    scopes: ["openid", "email"],
  },
};

fs.writeFileSync("manifest.json", JSON.stringify(manifest, null, 2));
