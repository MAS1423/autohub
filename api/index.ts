import type { Request, Response } from "express";

// Vercel executes the generated function as native ESM. The explicit `.js`

// specifier is resolved to `server/app.ts` during TypeScript/Vercel bundling and

// remains valid in the deployed Node.js bundle. An extensionless ESM import

// becomes `/var/task/server/app` and fails in the Vercel runtime.

import { createApp } from "../server/app.js";



const app = createApp();



type RequestWithVercelQuery = Request & {
  
  query?: Record<string, string | string[] | undefined>;
  
};



function getPathValue(value: unknown): string {
  
  if (typeof value === "string") return value;
  
  if (Array.isArray(value) && value.every(item => typeof item === "string")) {
    
    return value.join("/");
    
  }
  
  return "";
  
}



/**

 * Vercel rewrites `/api/<path>` to this function as `/api?path=<path>`.
 
 * Restore the original URL before Express receives the request so that every
 
 * existing route keeps its current `/api/...` path and query string.
 
 */

function restoreExpressUrl(req: RequestWithVercelQuery): string {
  
  const url = new URL(req.url ?? "/", "http://localhost");
  
  const rewrittenPath = getPathValue(req.query?.__vercel_path) || url.searchParams.get("__vercel_path") || "";
  
  const route = getPathValue(req.query?.__vercel_route) || url.searchParams.get("__vercel_route") || "api";
  

  
  if (!rewrittenPath) return req.url ?? "/";
  

  
  url.searchParams.delete("__vercel_path");
  
  url.searchParams.delete("__vercel_route");
  
  const path = rewrittenPath.replace(/^\/+/, "");
  
  const search = url.searchParams.toString();
  
  const prefix = route === "uploads" ? "/uploads" : "/api";
  
  return `${prefix}/${path}${search ? `?${search}` : ""}`;
  
}



export default function vercelHandler(req: Request, res: Response) {
  
  const request = req as RequestWithVercelQuery;
  
  request.url = restoreExpressUrl(request);
  
  return app(request, res);
  
}





























