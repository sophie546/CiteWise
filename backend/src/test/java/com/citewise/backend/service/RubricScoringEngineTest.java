package com.citewise.backend.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class RubricScoringEngineTest {
    private final RubricScoringEngine engine = new RubricScoringEngine();

    @Test
    public void testCalculateOverallScore() {
        double overall = engine.calculateOverallScore(80, 70, 60, 90);
        // expected = 80*0.4 + 70*0.25 + 60*0.2 + 90*0.15 = 32 + 17.5 + 12 + 13.5 = 75
        assertEquals(75.0, overall, 0.0001);
    }

    @Test
    public void testRecommendedClassification() {
        String rec = engine.computeRecommendation(85, 80, "Medium", java.util.List.of());
        assertEquals("Recommended", rec);
    }

    @Test
    public void testNeedsReviewClassification() {
        String rec = engine.computeRecommendation(75, 70, "Medium", java.util.List.of());
        assertEquals("Needs Review", rec);
    }

    @Test
    public void testLowRelevanceByOverall() {
        String rel = engine.applyThresholdRules(50, 80, "Medium", java.util.List.of(), java.util.List.of());
        assertEquals("Low", rel);
    }

    @Test
    public void testNullFlagsAndEvidenceHandled() {
        // should not throw
        String rel = engine.applyThresholdRules(85, 80, null, null, null);
        // No evidence -> Low relevance per rules
        assertEquals("Low", rel);
    }
}
