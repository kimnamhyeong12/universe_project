import fs from "fs";
import crypto from "crypto";

// RSA 키쌍 생성
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048, // 2048비트 키
});

// keys 폴더 자동 생성 후 저장
fs.mkdirSync("keys", { recursive: true });
fs.writeFileSync(
  "keys/private.pem",
  privateKey.export({ type: "pkcs1", format: "pem" })
);
fs.writeFileSync(
  "keys/public.pem",
  publicKey.export({ type: "pkcs1", format: "pem" })
);

console.log("✅ RSA 키 생성 완료!");
