import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
  publicKeyEncoding: { type: "spki", format: "der" },
  privateKeyEncoding: { type: "pkcs8", format: "der" },
});

const pubB64 = Buffer.from(publicKey).toString("base64");
const privB64 = Buffer.from(privateKey).toString("base64");

console.log(`JWT_PUBLIC_KEY_BASE64=${pubB64}`);
console.log(`JWT_PRIVATE_KEY_BASE64=${privB64}`);
