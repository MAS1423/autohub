/**
 * External Data API stub.
 * Implement this function to call external data APIs as needed.
 *
 * Example usage:
 *   await callDataApi("Youtube/search", {
 *     query: { gl: "US", hl: "en", q: "cars" },
 *   })
 */
import { ENV } from "./env";

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  apiId: string,
  options: DataApiCallOptions = {}
): Promise<unknown> {
  // External Data API is not configured.
  throw new Error(`Data API is not available in this build. Requested: ${apiId}`);
}
