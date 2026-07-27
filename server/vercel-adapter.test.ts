import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import vercelHandler from "../api/index";

let server: Server;
let baseUrl = "";

beforeAll(async () => {
  server = createServer((req, res) => vercelHandler(req, res));
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to start Vercel adapter test server");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

describe("Vercel Express adapter", () => {
  it("restores the original /api path before handing the request to Express", async () => {
    const response = await fetch(`${baseUrl}/api?__vercel_path=auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "missing@example.com", password: "not-the-password" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "Invalid email or password" });
  });

  it("preserves the existing /uploads proxy path", async () => {
    const response = await fetch(`${baseUrl}/api?__vercel_route=uploads&__vercel_path=missing-file.jpg`);

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe("File not found");
  });
});
