package com.redavo.pos.dto;

import com.redavo.pos.model.CommunityPost;

/**
 * Lightweight public DTO — only the fields the storefront needs.
 * Profile URL is derived on the frontend as https://instagram.com/{instagramHandle}.
 */
public record CommunityPostPublicDTO(
        Long id,
        String instagramHandle,
        String coverImageUrl,
        String mediaUrl,
        CommunityPost.MediaType mediaType
) {
    public static CommunityPostPublicDTO from(CommunityPost p) {
        return new CommunityPostPublicDTO(
                p.getId(),
                p.getInstagramHandle(),
                p.getCoverImageUrl(),
                p.getMediaUrl(),
                p.getMediaType()
        );
    }
}
