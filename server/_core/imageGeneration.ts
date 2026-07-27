/**
 * Image generation helper using internal ImageService
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 *
 * For editing:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "Add a rainbow to this landscape",
 *     originalImages: [{
 *       url: "https://example.com/original.jpg",
 *       mimeType: "image/jpeg"
 *     }]
 *   });
 */
/**
 * Image generation helper.
 * To add real image generation, integrate OpenAI DALL-E or Stability AI here.
 */
import { storagePut } from "../storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{ url?: string; b64Json?: string; mimeType?: string }>;
  model?: string;
  quality?: string;
};

export type GenerateImageResponse = {
  url?: string;
};

export type ImageModelInfo = {
  model?: string;
  id?: string;
};

export type ListImageModelsResponse = {
  models: ImageModelInfo[];
};

/**
 * Generate an image using OpenAI DALL-E (requires OPENAI_API_KEY).
 * Falls back to a placeholder if no API key is configured.
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.openaiApiKey) {
    console.warn("[ImageGen] OPENAI_API_KEY not set — returning placeholder");
    return { url: undefined };
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: options.prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Image generation failed (${response.status}): ${detail}`);
  }

  const result = (await response.json()) as { data: Array<{ b64_json: string }> };
  const b64 = result.data[0]?.b64_json;
  if (!b64) return { url: undefined };

  const buffer = Buffer.from(b64, "base64");
  const { url } = await storagePut(`generated/${Date.now()}.png`, buffer, "image/png");
  return { url };
}

export async function listImageModels(): Promise<ListImageModelsResponse> {
  return { models: [{ model: "dall-e-3", id: "dall-e-3" }] };
}
