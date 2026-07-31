package com.redavo.pos.service;

import com.redavo.pos.dto.CommunityPostDTO;
import com.redavo.pos.dto.CommunityPostPublicDTO;
import com.redavo.pos.model.CommunityPost;
import com.redavo.pos.repository.CommunityPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommunityPostService {

    @Autowired
    private CommunityPostRepository repo;

    // ── Admin queries ─────────────────────────────────────────────────

    public List<CommunityPostDTO> listAll() {
        return repo.findAllByOrderByDisplayOrderAsc()
                   .stream()
                   .map(CommunityPostDTO::from)
                   .toList();
    }

    // ── Public query ──────────────────────────────────────────────────

    public List<CommunityPostPublicDTO> listActive() {
        return repo.findByActiveTrueOrderByDisplayOrderAsc()
                   .stream()
                   .map(CommunityPostPublicDTO::from)
                   .toList();
    }

    // ── Create ────────────────────────────────────────────────────────

    @Transactional
    public CommunityPostDTO create(CommunityPostDTO dto) {
        CommunityPost post = new CommunityPost();
        applyDto(post, dto);
        return CommunityPostDTO.from(repo.save(post));
    }

    // ── Update ────────────────────────────────────────────────────────

    @Transactional
    public CommunityPostDTO update(Long id, CommunityPostDTO dto) {
        CommunityPost post = repo.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Community post not found: " + id));
        applyDto(post, dto);
        return CommunityPostDTO.from(repo.save(post));
    }

    // ── Delete ────────────────────────────────────────────────────────

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new java.util.NoSuchElementException("Community post not found: " + id);
        }
        repo.deleteById(id);
    }

    // ── Toggle active ─────────────────────────────────────────────────

    @Transactional
    public CommunityPostDTO toggleActive(Long id) {
        CommunityPost post = repo.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Community post not found: " + id));
        post.setActive(!Boolean.TRUE.equals(post.getActive()));
        return CommunityPostDTO.from(repo.save(post));
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private void applyDto(CommunityPost post, CommunityPostDTO dto) {
        post.setInstagramHandle(dto.getInstagramHandle().trim());
        post.setCoverImageUrl(dto.getCoverImageUrl().trim());
        post.setMediaUrl(dto.getMediaUrl().trim());
        post.setMediaType(dto.getMediaType());
        post.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
        post.setActive(dto.getActive() != null ? dto.getActive() : true);
    }
}
