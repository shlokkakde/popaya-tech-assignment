const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "frontend", "notes-ui", "public");
const destination = path.join(root, "public");

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });

console.log(`Copied frontend assets to ${destination}`);
