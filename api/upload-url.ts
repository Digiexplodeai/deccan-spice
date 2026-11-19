import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, verifyUserAuth } from "./_lib";

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    // 1. Verify Supabase JWT token
    const user = await verifyUserAuth(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized. Valid Supabase auth token required." });
    }

    // 2. Parse and validate input
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { filename, contentType, folder = "cms" } = body;

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/jpg"];
    if (!contentType || !allowedMimeTypes.includes(contentType.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid contentType: ${contentType}. Allowed: jpeg, png, webp, avif.`,
      });
    }

    // 3. Generate unique R2 object key
    const rawExt = (filename || "").split(".").pop()?.toLowerCase();
    const ext = rawExt && ["jpg", "jpeg", "png", "webp", "avif"].includes(rawExt)
      ? rawExt
      : contentType.split("/")[1] || "webp";
    const cleanFolder = (folder || "cms").replace(/[^a-zA-Z0-9_-]/g, "");
    const randomStr = Math.random().toString(36).substring(2, 10);
    const key = `${cleanFolder}/${Date.now()}-${randomStr}.${ext}`;

    // 4. Initialize Cloudflare R2 Client & Generate Presigned PUT URL
    const { client, bucket, publicBaseUrl } = getR2Client();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: 300, // 5 minutes
    });

    const publicUrl = publicBaseUrl ? `${publicBaseUrl}/${key}` : `/${key}`;

    return res.status(200).json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("upload-url error:", message);
    return res.status(500).json({ error: message });
  }
}
