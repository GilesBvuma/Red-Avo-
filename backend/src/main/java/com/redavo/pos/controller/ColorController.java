package com.redavo.pos.controller;

import com.redavo.pos.model.Color;
import com.redavo.pos.repository.ColorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST endpoints for the colors reference table.
 *
 * <ul>
 *   <li>{@code GET  /api/colors}      — list all colors (any authenticated user)</li>
 *   <li>{@code POST /api/colors}      — create a custom color (ADMIN only)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/colors")
public class ColorController {

    private final ColorRepository colorRepository;

    public ColorController(ColorRepository colorRepository) {
        this.colorRepository = colorRepository;
    }

    /** Returns all colors sorted alphabetically — used to populate the swatch grid. */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Color>> listColors() {
        return ResponseEntity.ok(colorRepository.findAllByOrderByNameAsc());
    }

    /**
     * Creates a new custom color.
     * <p>
     * Expected body: {@code { "name": "Sunset Coral", "hexCode": "#FF6B6B" }}
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createColor(@RequestBody Map<String, String> body) {
        String name    = body.get("name");
        String hexCode = body.get("hexCode");

        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Color name is required"));
        }
        if (hexCode == null || !hexCode.matches("^#[0-9A-Fa-f]{6}$")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "hexCode must be a valid 6-digit hex color (e.g. #FF6B6B)"));
        }
        if (colorRepository.existsByNameIgnoreCase(name.trim())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "A color named '" + name.trim() + "' already exists"));
        }

        Color color = new Color();
        color.setName(name.trim());
        color.setHexCode(hexCode.toUpperCase());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(colorRepository.save(color));
    }
}
