import fs from "fs";
import path from "path";
import type { Express } from "express";
import { ENV } from "./env";

/**
 * Serves uploaded files from the local uploads directory.
 * Files are stored at: <uploadDir>/<key>
 * Accessed via: GET /uploads/<key>
 */
export function registerStorageProxy(app: Express) {
  const serveFile = async (req: import("express").Request, res: import("express").Response, key: string) => {
    if (!key) {
      res.status(400).send("Missing file key");
      return;
    }
    // Prevent path traversal
    const uploadDir = path.resolve(ENV.uploadDir);
    const filePath = path.resolve(uploadDir, key);
    if (!filePath.startsWith(uploadDir)) {
      res.status(403).send("Forbidden");
      return;
    }
    if (!fs.existsSync(filePath)) {
      res.status(404).send("File not found");
      return;
    }
    res.sendFile(filePath);
  };

  // Primary route: /uploads/<key>
  app.get("/uploads/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    await serveFile(req, res, key);
  });

}
