import { DeleteObjectCommand } from "@aws-sdk/client-s3";
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

    // 2. Parse key
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { key } = body;

    if (!key || typeof key !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'key' in request body." });
    }

    // 3. Delete object from Cloudflare R2
    const { client, bucket } = getR2Client();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);

    return res.status(200).json({
      success: true,
      key,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("delete-image error:", message);
    return res.status(500).json({ error: message });
  }
}
