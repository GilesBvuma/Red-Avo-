package com.redavo.pos.service;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * Centralised image compression service.
 *
 * Every uploaded image is piped through Thumbnailator before being written to
 * disk, which achieves two goals:
 *   1. Resolution cap  – hero / banner images are capped at 1920 px wide;
 *      product thumbnails at 1200 px wide; category / collection covers at
 *      800 px wide.  Images already smaller than the cap are left as-is.
 *   2. JPEG quality    – output quality is set to 0.80 (80 %) which cuts
 *      typical file sizes by 50–70 % with no perceptible quality loss at
 *      web sizes.
 *
 * GIF files are passed through uncompressed (Thumbnailator does not animate).
 * Video files (community media) are also passed through uncompressed.
 */
@Service
public class ImageCompressionService {

    /**
     * Image-type hint that controls the max width applied during compression.
     */
    public enum ImageRole {
        /** Full-bleed hero / banner — up to 1920 px wide, quality 0.82 */
        HERO(1920, 0.82f),
        /** Product listing image — up to 1200 px wide, quality 0.80 */
        PRODUCT(1200, 0.80f),
        /** Collection cover card / category thumbnail — up to 800 px wide, quality 0.80 */
        COVER(800, 0.80f),
        /** Community post media — up to 1400 px wide, quality 0.80 */
        COMMUNITY(1400, 0.80f);

        final int maxWidth;
        final float quality;

        ImageRole(int maxWidth, float quality) {
            this.maxWidth = maxWidth;
            this.quality  = quality;
        }
    }

    /**
     * Saves {@code file} to {@code dest} after applying resize + JPEG
     * compression suited to {@code role}.
     *
     * <p>If the file is a GIF or a video, it is copied verbatim so that
     * animated GIFs and MP4 files are not broken.</p>
     *
     * @param file the uploaded multipart file
     * @param dest absolute path of the target file (including filename)
     * @param role controls the max resolution and quality settings
     * @throws IOException on any I/O failure
     */
    public void saveCompressed(MultipartFile file, Path dest, ImageRole role) throws IOException {
        String contentType = file.getContentType() != null
                ? file.getContentType().toLowerCase()
                : "";

        // Pass-through for animated GIFs and video — Thumbnailator can't handle these
        if (contentType.equals("image/gif") || contentType.startsWith("video/")) {
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
            }
            return;
        }

        // For JPEG / PNG / WebP: resize to maxWidth (keeping aspect ratio) + JPEG compression.
        // outputFormat("jpg") normalises everything (including PNG) to JPEG on disk;
        // the caller is responsible for giving dest the ".jpg" extension in that case.
        Thumbnails.of(file.getInputStream())
                .width(role.maxWidth)          // shrinks if wider; no-op if already narrower
                .outputFormat("jpg")
                .outputQuality(role.quality)
                .toFile(dest.toFile());
    }
}
