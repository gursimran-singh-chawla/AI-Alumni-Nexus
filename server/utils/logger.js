import fs from "fs";
import path from "path";

const logDir = path.resolve("logs");
const errorFile = path.join(logDir, "error.log");

const ensureLogDir = () => {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
};

export const logError = (error, context = {}) => {
  try {
    ensureLogDir();
    const payload = {
      timestamp: new Date().toISOString(),
      message: error?.message || "Unknown error",
      stack: error?.stack || null,
      context
    };
    fs.appendFileSync(errorFile, `${JSON.stringify(payload)}\n`, "utf8");
  } catch (e) {
    console.error("Error logger failure:", e.message);
  }
};

export const logInfo = (message, meta = {}) => {
  console.log(`[INFO] ${message}`, meta);
};
