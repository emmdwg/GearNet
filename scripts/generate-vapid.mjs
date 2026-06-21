import { generateVAPIDKeys } from "web-push";
import { writeFileSync } from "fs";

const keys = generateVAPIDKeys();
writeFileSync("vapid-keys.tmp.json", JSON.stringify(keys, null, 2));
console.log(keys.publicKey);
console.log(keys.privateKey);
