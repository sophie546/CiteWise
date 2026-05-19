// ... (keep existing imports)
import java.util.concurrent.Executor;
import org.springframework.beans.factory.annotation.Qualifier;
// ... (other imports)

@Service
public class DocumentUploadService {
    // ... (keep fields)
    private final Executor aiScoringExecutor;

    public DocumentUploadService(
            @Value("${rrl.max-file-size-mb:20}") int maxFileSizeMb,
            UploadedDocumentRepository uploadedDocumentRepository,
            DocumentInsightRepository documentInsightRepository,
            CatalystClient catalystClient,
            NLPMicroserviceClient nlpMicroserviceClient,
            RubricScoringEngine rubricScoringEngine,
            @Qualifier("aiScoringExecutor") Executor aiScoringExecutor) {
        this.maxFileSizeBytes = maxFileSizeMb * 1024L * 1024L;
        this.uploadedDocumentRepository = uploadedDocumentRepository;
        this.documentInsightRepository = documentInsightRepository;
        this.catalystClient = catalystClient;
        this.nlpMicroserviceClient = nlpMicroserviceClient;
        this.rubricScoringEngine = rubricScoringEngine;
        this.aiScoringExecutor = aiScoringExecutor;
    }

    // Replace your old async method with this clean executor-based pattern
    public void analyzeDocumentAsync(UploadedDocument document) {
        CompletableFuture.runAsync(() -> {
            try {
                // 1. Build context
                CatalystPayload payload = catalystClient.fetchCatalystData(document.getSessionId());
                
                // 2. Prepare Request DTO
                NlpEvaluationRequest request = new NlpEvaluationRequest(
                    document.getParsedText(),
                    payload != null ? payload.title() : "",
                    payload != null ? payload.rationale() : "",
                    payload != null && payload.gaps() != null ? String.join("; ", payload.gaps()) : ""
                );

                // 3. Call AI
                RawAIResponse response = nlpMicroserviceClient.evaluateDocument(request);

                // 4. Save result
                if (response != null) {
                    DocumentInsight insight = rubricScoringEngine.mapToEntity(response, document.getId());
                    if (insight != null) {
                        documentInsightRepository.save(insight);
                    }
                }
            } catch (Exception e) {
                logger.error("AI scoring failed for document {}", document.getId(), e);
            }
        }, aiScoringExecutor);
    }
    
    // ... (rest of your existing methods like processUploads)
}