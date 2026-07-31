package com.redavo.pos.controller;

import com.redavo.pos.dto.CommunityPostDTO;
import com.redavo.pos.dto.CommunityPostPublicDTO;
import com.redavo.pos.service.CommunityPostService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
public class CommunityController {

    // ── Allowed MIME types ─────────────────────────────────────────
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp"
    );
    private static final Set<String> ALLOWED_MEDIA_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "video/mp4"
    );
    private static final long MAX_FILE_BYTES = 20L * 1024 * 1024; // 20 MB

    @Value("${app.upload.dir:../frontend/apps/pos-web/public/uploads}")
    private String uploadDir;

    @Autowired
    private CommunityPostService service;

    // ── Public endpoint ────────────────────────────────────────────

    @GetMapping("/api/community")
    public ResponseEntity<List<CommunityPostPublicDTO>> listPublic() {
        return ResponseEntity.ok(service.listActive());
    }

    // ── Admin endpoints ────────────────────────────────────────────

    @GetMapping("/api/admin/community")
    public ResponseEntity<List<CommunityPostDTO>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }

    @PostMapping("/api/admin/community")
    public ResponseEntity<CommunityPostDTO> create(@Valid @RequestBody CommunityPostDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/api/admin/community/{id}")
    public ResponseEntity<CommunityPostDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody CommunityPostDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/api/admin/community/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/admin/community/{id}/active")
    public ResponseEntity<CommunityPostDTO> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(service.toggleActive(id));
    }

    // ── File upload ────────────────────────────────────────────────

    /**
     * Accepts a single file upload (cover image or media file).
     * Query param {@code type=cover} → validates as image only.
     * Query param {@code type=media} (default) → accepts images + mp4.
     * Returns {@code { "url": "/uploads/<uuid>.<ext>" }}.
     */
    @PostMapping(value = "/api/admin/community/upload", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "media") String type) throws IOException {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new IllegalArgumentException("File exceeds the 20 MB limit.");
        }

        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        Set<String> allowed = "cover".equalsIgnoreCase(type) ? ALLOWED_IMAGE_TYPES : ALLOWED_MEDIA_TYPES;
        if (!allowed.contains(contentType)) {
            throw new IllegalArgumentException(
                    "Invalid file type '" + contentType + "'. Allowed: " + allowed);
        }

        String originalName = file.getOriginalFilename();
        String extension = (originalName != null && originalName.contains("."))
                ? originalName.substring(originalName.lastIndexOf('.'))
                : ".bin";

        String filename = "community-" + UUID.randomUUID() + extension;
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);
        Files.copy(file.getInputStream(), uploadPath.resolve(filename), StandardCopyOption.REPLACE_EXISTING);

        return ResponseEntity.ok(Map.of("url", "/uploads/" + filename));
    }
}
