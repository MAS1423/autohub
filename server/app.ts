import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { uploadRouter } from "./upload";

/**
 * Creates the shared Express application without opening a network listener.
 *
 * Local development attaches Vite and calls `listen()` in `server/_core/index.ts`.
 * Vercel imports this application from its serverless function entry point.
 */
export function createApp() {
  const app = express();

  // Configure body parsers with the existing upload-friendly request limit.
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Existing API paths remain unchanged.
  app.use("/api/upload", uploadRouter);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  return app;
}
