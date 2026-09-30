import com.redavo.pos.model.ProductCollection;
import com.redavo.pos.service.CollectionService;
import com.redavo.pos.service.ImageCompressionService;
import com.redavo.pos.service.ImageCompressionService.ImageRole;
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
@RequestMapping("/api/collections")
public class CollectionController {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    );

    @Autowired
    private CollectionService collectionService;

    @Autowired
    private ImageCompressionService imageCompressionService;

    @Value("${app.upload.dir:../frontend/apps/pos-web/public/uploads}")
    private String uploadDir;

    // ── PUBLIC (storefront) ──────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<ProductCollection>> getActiveCollections() {
        return ResponseEntity.ok(collectionService.getAllActive());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<?> getCollectionBySlug(@PathVariable String slug) {
        try {
            return ResponseEntity.ok(collectionService.getBySlug(slug));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── ADMIN ────────────────────────────────────────────────────────────

    @GetMapping("/admin/all")
    public ResponseEntity<List<ProductCollection>> getAllCollections() {
        return ResponseEntity.ok(collectionService.getAll());
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<?> getCollectionById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(collectionService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createCollection(@RequestBody ProductCollection collection) {
        try {
            return ResponseEntity.ok(collectionService.create(collection));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCollection(@PathVariable Long id, @RequestBody ProductCollection collection) {
        try {
            return ResponseEntity.ok(collectionService.update(id, collection));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/products")
    public ResponseEntity<?> setProducts(@PathVariable Long id, @RequestBody Map<String, List<Object>> body) {
        try {
            List<Object> rawIds = body.get("productIds");
            List<Long> productIds = rawIds == null ? List.of() : rawIds.stream()
                .map(val -> Long.valueOf(val.toString()))
                .toList();
            return ResponseEntity.ok(collectionService.setProducts(id, productIds));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{collectionId}/products/{productId}")
    public ResponseEntity<?> removeProduct(@PathVariable Long collectionId, @PathVariable Long productId) {
        try {
            return ResponseEntity.ok(collectionService.removeProduct(collectionId, productId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCollection(@PathVariable Long id) {
        try {
            collectionService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── IMAGE UPLOADS ────────────────────────────────────────────────────

    @PostMapping("/{id}/cover-image")
    public ResponseEntity<?> uploadCoverImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        String url = saveImage(file, "cover", ImageRole.COVER);
        return ResponseEntity.ok(collectionService.updateCoverImage(id, url));
    }

    @PostMapping("/{id}/hero-image")
    public ResponseEntity<?> uploadHeroImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        String url = saveImage(file, "hero", ImageRole.HERO);
        return ResponseEntity.ok(collectionService.updateHeroImage(id, url));
    }

    // ── HELPERS ──────────────────────────────────────────────────────────

    private String saveImage(MultipartFile file, String prefix, ImageRole role) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.toLowerCase().startsWith("image/") && !contentType.toLowerCase().equals("application/octet-stream"))) {
            throw new IllegalArgumentException("Invalid file type: " + contentType);
        }
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        // Always store as .jpg (compression normalises to JPEG)
        String filename = "collection-" + prefix + "-" + UUID.randomUUID() + ".jpg";
        Path dest = uploadPath.resolve(filename);
        imageCompressionService.saveCompressed(file, dest, role);
        return "/uploads/" + filename;
    }
}
