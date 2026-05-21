import {
  findContentWithRelations,
  updateContentRemoteUrl,
} from "@/repositories/instagram-content.repo";
import { buildCdcPayload, forwardToCdc } from "@/services/cdc.service";
import { wsManager } from "@/ws/manager";
import { logger } from "@/utils/logger";

export async function processContentInBackground(contentId: number): Promise<void> {
  const tag = `[bg:${contentId}]`;
  try {
    const content = await findContentWithRelations(contentId);
    if (!content) {
      logger.warn({ contentId }, `${tag} content not found, skipping`);
      wsManager.broadcast({ type: "content_processed", contentId, remoteUrl: null, skipped: true });
      return;
    }

    const { payload, jobData } = await buildCdcPayload(
      content.display_url,
      { id: content.region_id, province_id: content.province_id, js_loker: content.js_loker },
      content.caption,
    );

    logger.info({ contentId, company: payload.nama, jobData }, `${tag} Gemini analysis complete`);

    if (!payload.nama) {
      logger.info({ contentId }, `${tag} no company name extracted — skipping CDC`);
      wsManager.broadcast({
        type: "content_processed",
        contentId,
        remoteUrl: null,
        skipped: true,
        skipReason: "no company name extracted",
      });
      return;
    }

    const remoteUrl = await forwardToCdc(payload);
    await updateContentRemoteUrl(contentId, remoteUrl);
    logger.info({ contentId, remoteUrl }, `${tag} forwarded to CDC`);
    wsManager.broadcast({ type: "content_processed", contentId, remoteUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ contentId, error }, `${tag} failed: ${message}`);
    wsManager.broadcast({ type: "content_processed", contentId, remoteUrl: null, error: message });
  }
}
