// File upload handler — receives multipart/form-data and stores via S3
import { Router } from "express";
import { storagePut } from "./storage";
import { createMediaUpload } from "./db";
import { notifyOwner } from "./_core/notification";

export const uploadRouter = Router();

// POST /api/upload — accepts a single file in field "file"
// Body fields: dealerId, vehicleId (optional), fileType (image|video|logo|cover)
uploadRouter.post("/", async (req, res) => {
  try {
    const contentType = req.headers["content-type"] ?? "";
    if (!contentType.includes("multipart/form-data")) {
      res.status(400).json({ error: "Expected multipart/form-data" });
      return;
    }

    // Parse multipart manually using built-in stream
    const chunks: Buffer[] = [];
    let boundary = "";
    const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
    if (!boundaryMatch) {
      res.status(400).json({ error: "No boundary in content-type" });
      return;
    }
    boundary = boundaryMatch[1];

    await new Promise<void>((resolve, reject) => {
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", resolve);
      req.on("error", reject);
    });

    const body = Buffer.concat(chunks);
    const bodyStr = body.toString("binary");

    // Extract fields and file from multipart body
    const fields: Record<string, string> = {};
    let fileBuffer: Buffer | null = null;
    let fileName = "upload";
    let fileMime = "application/octet-stream";

    const parts = bodyStr.split(`--${boundary}`);
    for (const part of parts) {
      if (part.trim() === "" || part.trim() === "--") continue;
      const [headerSection, ...bodyParts] = part.split("\r\n\r\n");
      if (!headerSection) continue;
      const bodyContent = bodyParts.join("\r\n\r\n").replace(/\r\n$/, "");

      const nameMatch = headerSection.match(/name="([^"]+)"/);
      const filenameMatch = headerSection.match(/filename="([^"]+)"/);
      const mimeMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/i);

      if (!nameMatch) continue;
      const fieldName = nameMatch[1];

      if (filenameMatch) {
        fileName = filenameMatch[1];
        fileMime = mimeMatch ? mimeMatch[1].trim() : "application/octet-stream";
        fileBuffer = Buffer.from(bodyContent, "binary");
      } else {
        fields[fieldName] = bodyContent;
      }
    }

    if (!fileBuffer) {
      res.status(400).json({ error: "No file found in request" });
      return;
    }

    const dealerId = parseInt(fields.dealerId ?? "0", 10);
    const vehicleId = fields.vehicleId ? parseInt(fields.vehicleId, 10) : undefined;
    const fileType = (fields.fileType ?? "image") as "image" | "video" | "logo" | "cover";

    if (!dealerId) {
      res.status(400).json({ error: "dealerId is required" });
      return;
    }

    // Validate file type
    const allowedImages = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const allowedVideos = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    const isImage = allowedImages.includes(fileMime);
    const isVideo = allowedVideos.includes(fileMime);

    if (!isImage && !isVideo) {
      res.status(400).json({ error: `نوع الملف غير مدعوم: ${fileMime}. المسموح: JPEG, PNG, WebP, MP4, WebM` });
      return;
    }

    // Max size: 50MB for video, 10MB for images
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (fileBuffer.length > maxSize) {
      const maxMB = isVideo ? 50 : 10;
      res.status(400).json({ error: `حجم الملف كبير جداً. الحد الأقصى ${maxMB} ميجابايت` });
      return;
    }

    // Upload to S3
    const prefix = isVideo ? "videos" : fileType === "logo" ? "logos" : fileType === "cover" ? "covers" : "images";
    const ext = fileName.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
    const storageKey = `dealers/${dealerId}/${prefix}/${Date.now()}.${ext}`;
    const { key, url } = await storagePut(storageKey, fileBuffer, fileMime);

    // Save to DB
    await createMediaUpload({
      dealerId,
      vehicleId: vehicleId ?? null,
      fileKey: key,
      fileUrl: url,
      fileType: isVideo ? "video" : fileType,
      mimeType: fileMime,
      originalName: fileName,
      sizeBytes: fileBuffer.length,
    });

    res.json({ success: true, key, url, fileType: isVideo ? "video" : fileType });
  } catch (err) {
    console.error("[Upload] Error:", err);
    res.status(500).json({ error: "فشل رفع الملف. يرجى المحاولة مرة أخرى." });
  }
});
