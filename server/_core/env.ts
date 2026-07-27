export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "change-me-in-production-32chars!!",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Local file upload directory (relative to project root)
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  // Optional: S3-compatible storage (leave empty to use local disk)
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Region: process.env.S3_REGION ?? "us-east-1",
  s3AccessKey: process.env.S3_ACCESS_KEY_ID ?? "",
  s3SecretKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  // Optional: OpenAI / LLM API
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  llmApiKey: process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  llmApiUrl: process.env.LLM_API_URL ?? "",
  // Optional: Google Maps
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
};
