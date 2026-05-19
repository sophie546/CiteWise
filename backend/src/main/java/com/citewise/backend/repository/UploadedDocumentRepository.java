package com.citewise.backend.repository;

import com.citewise.backend.entity.UploadedDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UploadedDocumentRepository extends JpaRepository<UploadedDocument, Long> {
}
