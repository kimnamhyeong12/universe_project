// middleware/uploadNFT.js
import multer from "multer";
import path from "path";
import fs from "fs";

const nftDir = "uploads/nft";

if (!fs.existsSync(nftDir)) {
  fs.mkdirSync(nftDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, nftDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 99999);
    cb(null, unique + path.extname(file.originalname));
  },
});

export const uploadNFT = multer({ storage });
