package com.citewise.backend.repository;

import com.citewise.backend.entity.DocumentInsight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentInsightRepository extends JpaRepository<DocumentInsight, Long> {
    Optional<DocumentInsight> findByDocumentId(Long documentId);
}
