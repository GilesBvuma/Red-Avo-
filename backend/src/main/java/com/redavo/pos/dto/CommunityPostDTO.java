package com.redavo.pos.dto;

import com.redavo.pos.model.CommunityPost;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Full DTO used by the admin API — includes all fields.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommunityPostDTO {

    private Long id;

    @NotBlank(message = "Instagram handle is required")
    private String instagramHandle;

    @NotBlank(message = "Cover image URL is required")
    private String coverImageUrl;

    @NotBlank(message = "Media URL is required")
    private String mediaUrl;

    @NotNull(message = "Media type is required (VIDEO or IMAGE)")
    private CommunityPost.MediaType mediaType;

    private Integer displayOrder = 0;

    private Boolean active = true;

    private Instant createdAt;

    /** Maps entity → DTO */
    public static CommunityPostDTO from(CommunityPost p) {
        return new CommunityPostDTO(
                p.getId(),
                p.getInstagramHandle(),
                p.getCoverImageUrl(),
                p.getMediaUrl(),
                p.getMediaType(),
                p.getDisplayOrder(),
                p.getActive(),
                p.getCreatedAt()
        );
    }
}
