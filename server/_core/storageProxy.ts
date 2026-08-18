import type { Express } from "express";
import { storageGetSignedUrl } from "../storage";

/**
 * Serves stored files (resumes, IDs, logos, hero images, etc.) by redirecting
 * to a short-lived presigned S3 GET URL. Keeps bucket credentials off the
 * client and out of stored URLs.
 */
export function registerStorageProxy(app: Express) {
  app.get("/storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      const url = await storageGetSignedUrl(key);
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
