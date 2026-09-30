package com.redavo.pos.controller;

import com.redavo.pos.model.Category;
import com.redavo.pos.service.CategoryService;
import com.redavo.pos.service.ImageCompressionService;
import com.redavo.pos.service.ImageCompressionService.ImageRole;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    @org.springframework.beans.factory.annotation.Autowired
    private ImageCompressionService imageCompressionService;

    @org.springframework.beans.factory.annotation.Value("${app.upload.dir:../frontend/apps/pos-web/public/uploads}")
    private String uploadDir;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<Category> getAllCategories() {
        return categoryService.getAllCategories();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(categoryService.createCategory(category));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @RequestBody Category category) {
        return ResponseEntity.ok(categoryService.updateCategory(id, category));
    }

    @PostMapping("/{id}/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        // Always store as .jpg — compression normalises to JPEG
        String filename = "cat-" + UUID.randomUUID() + ".jpg";
        Path dest = uploadPath.resolve(filename);
        imageCompressionService.saveCompressed(file, dest, ImageRole.COVER);
        String imageUrl = "/uploads/" + filename;

        Category category = new Category();
        category.setImageUrl(imageUrl);
        categoryService.updateCategory(id, category);

        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok().build();
    }
}
