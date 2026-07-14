package com.redavo.pos.controller;

import com.redavo.pos.model.Product;
import com.redavo.pos.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, allowCredentials = "true")
public class ProductController {

    @Autowired
    private ProductService productService;

    // ── List all products ─────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(productService.getProductsByCategory(category));
    }

    // ── Create product ────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        return ResponseEntity.ok(productService.createProduct(product));
    }

    // ── Full update ───────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id,
                                                  @RequestBody Product product) {
        return ResponseEntity.ok(productService.updateProduct(id, product));
    }

    // ── Stock quantity only ───────────────────────────────────────
    @PutMapping("/{id}/stock")
    public ResponseEntity<Product> updateStock(@PathVariable Long id,
                                               @RequestBody Map<String, Integer> body) {
        int quantity = body.getOrDefault("quantity", 0);
        return ResponseEntity.ok(productService.updateStock(id, quantity));
    }

    // ── Delete ────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // ── Image upload ──────────────────────────────────────────────
    // Saves the image to the pos-web public folder so Next.js can serve it directly.
    // Path: <project-root>/frontend/apps/pos-web/public/uploads/<uuid>.<ext>
    // Override with UPLOAD_DIR env variable in production (e.g. /var/www/uploads).
    @org.springframework.beans.factory.annotation.Value("${app.upload.dir:../frontend/apps/pos-web/public/uploads}")
    private String uploadDir;

    @PostMapping("/{id}/images")
    public ResponseEntity<Map<String, List<String>>> uploadImages(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files) throws IOException {

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);
        
        List<String> uploadedUrls = new java.util.ArrayList<>();
        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            
            String originalName = file.getOriginalFilename();
            String extension    = (originalName != null && originalName.contains("."))
                    ? originalName.substring(originalName.lastIndexOf('.'))
                    : ".jpg";
            String filename = UUID.randomUUID() + extension;
            
            Files.copy(file.getInputStream(), uploadPath.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            String imageUrl = "/uploads/" + filename;
            uploadedUrls.add(imageUrl);
        }

        // Fetch product and append urls
        Product product = productService.getAllProducts().stream().filter(p -> p.getId().equals(id)).findFirst().orElseThrow();
        if (product.getImageUrls() == null) product.setImageUrls(new java.util.ArrayList<>());
        product.getImageUrls().addAll(uploadedUrls);
        
        // If no primary image is set, set it to the first one
        if (product.getImageUrl() == null && !uploadedUrls.isEmpty()) {
            product.setImageUrl(uploadedUrls.get(0));
        }
        
        productService.updateProduct(id, product);

        return ResponseEntity.ok(Map.of("imageUrls", uploadedUrls));
    }
}
