const crypto = require("crypto");
console.log(crypto.createHash("sha256").update("Admin2026*").digest("hex"));
