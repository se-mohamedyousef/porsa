/**
 * Validates required environment variables
 * Throws an error if any required variables are missing
 */

const requiredEnvVars = {
  // Vercel KV / Upstash Redis - Required for database
  KV_REST_API_TOKEN: "KV REST API Token",
  KV_REST_API_URL: "KV REST API URL",
  
  // Email service - Required for password reset
  RESEND_API_KEY: "Resend API Key for sending emails",
  RESEND_FROM_EMAIL: "Resend sender email address",
  
  // Hugging Face AI - Required for AI recommendations
  HF_TOKEN: "Hugging Face API Token",
  
  // Next.js public URL
  NEXT_PUBLIC_URL: "Public URL for the application",
};

const optionalEnvVars = {
  // Optional for read-only operations
  KV_REST_API_READ_ONLY_TOKEN: "Vercel KV Read-Only Token (optional)",
};

export function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[key]) {
      missing.push(`${key} (${description})`);
    }
  }

  // Check optional variables (just warn)
  for (const [key, description] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) {
      warnings.push(`${key} (${description})`);
    }
  }

  // Log warnings for optional variables
  if (warnings.length > 0 && process.env.NODE_ENV === "development") {
    console.warn("⚠️  Optional environment variables not set:");
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }

  // Throw error for missing required variables
  if (missing.length > 0) {
    const errorMessage = `
❌ Missing required environment variables:
${missing.map((m) => `   - ${m}`).join("\n")}

Please check your .env.local file or Vercel environment variables.
See .env.local.example for reference.
    `.trim();

    throw new Error(errorMessage);
  }

  // Success message in development
  if (process.env.NODE_ENV === "development") {
    console.log("✅ All required environment variables are set");
  }
}

// Validate on module load (server-side only). Do not exit the process on Vercel/serverless:
// env may be injected at runtime, and process.exit breaks builds and health checks.
if (typeof window === "undefined") {
  try {
    validateEnv();
  } catch (error) {
    console.error(error.message);
  }
}
