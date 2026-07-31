package com.redavo.pos.repository;

import com.redavo.pos.model.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    List<CommunityPost> findAllByOrderByDisplayOrderAsc();

    List<CommunityPost> findByActiveTrueOrderByDisplayOrderAsc();
}
