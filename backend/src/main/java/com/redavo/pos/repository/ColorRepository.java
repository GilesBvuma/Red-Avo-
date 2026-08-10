package com.redavo.pos.repository;

import com.redavo.pos.model.Color;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ColorRepository extends JpaRepository<Color, Long> {

    /** Returns all colors ordered alphabetically by name. */
    List<Color> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);
}
