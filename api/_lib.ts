import { S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for token authentication on the server
export function getSupabaseServerClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "";
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY on server.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Verify incoming bearer token
export async function verifyUserAuth(req: Request | any): Promise<{ id: string; email?: string } | null> {
  try {
    const authHeader =
      (typeof req.headers?.get === "function" ? req.headers.get("authorization") : req.headers?.authorization) ||
      "";

    if (!authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return null;

    const supabase = getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

// Initialize AWS S3 client pointing to Cloudflare R2
export function getR2Client(): { client: S3Client; bucket: string; publicBaseUrl: string } {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicBaseUrl = (
    process.env.VITE_MEDIA_BASE_URL ||
    process.env.MEDIA_BASE_URL ||
    ""
  ).replace(/\/$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "Missing Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET) in environment."
    );
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucket, publicBaseUrl };
}
