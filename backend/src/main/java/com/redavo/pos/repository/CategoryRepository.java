package com.redavo.pos.repository;

import com.redavo.pos.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByName(String name);

    /** Returns all categories sorted by displayOrder ascending, then by id. */
    List<Category> findAllByOrderByDisplayOrderAscIdAsc();
}
