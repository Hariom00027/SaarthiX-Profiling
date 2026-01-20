package com.profiling.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ScoreUtils Tests")
class ScoreUtilsTest {

    @Test
    @DisplayName("normalizeScores should return empty map for null input")
    void testNormalizeScores_NullInput_ReturnsEmpty() {
        Map<String, Double> result = ScoreUtils.normalizeScores(null);
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("normalizeScores should return empty map for empty input")
    void testNormalizeScores_EmptyInput_ReturnsEmpty() {
        Map<String, Double> result = ScoreUtils.normalizeScores(new HashMap<>());
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("normalizeScores should normalize scores to sum to 100")
    void testNormalizeScores_ValidScores_SumsTo100() {
        Map<String, Double> scores = new HashMap<>();
        scores.put("Category1", 10.0);
        scores.put("Category2", 20.0);
        scores.put("Category3", 30.0);

        Map<String, Double> result = ScoreUtils.normalizeScores(scores);
        double sum = result.values().stream().mapToDouble(Double::doubleValue).sum();
        assertEquals(100.0, sum, 0.01);
    }

    @Test
    @DisplayName("normalizeScores should handle zero total score")
    void testNormalizeScores_ZeroTotal_EqualDistribution() {
        Map<String, Double> scores = new HashMap<>();
        scores.put("Category1", 0.0);
        scores.put("Category2", 0.0);
        scores.put("Category3", 0.0);

        Map<String, Double> result = ScoreUtils.normalizeScores(scores);
        double sum = result.values().stream().mapToDouble(Double::doubleValue).sum();
        assertEquals(100.0, sum, 0.01);
        // All should be equal (approximately 33.33)
        double expectedValue = 100.0 / 3;
        for (Double value : result.values()) {
            assertEquals(expectedValue, value, 0.01);
        }
    }

    @Test
    @DisplayName("normalizeScores should adjust for rounding errors")
    void testNormalizeScores_RoundingErrors_Adjusted() {
        Map<String, Double> scores = new HashMap<>();
        scores.put("Category1", 1.0);
        scores.put("Category2", 1.0);
        scores.put("Category3", 1.0);

        Map<String, Double> result = ScoreUtils.normalizeScores(scores);
        double sum = result.values().stream().mapToDouble(Double::doubleValue).sum();
        assertEquals(100.0, sum, 0.01);
    }

    @Test
    @DisplayName("roundScores should round to specified decimal places")
    void testRoundScores_ValidScores_RoundsCorrectly() {
        Map<String, Double> scores = new HashMap<>();
        scores.put("Category1", 33.333333);
        scores.put("Category2", 66.666666);

        Map<String, Double> result = ScoreUtils.roundScores(scores, 2);
        assertEquals(33.33, result.get("Category1"), 0.01);
        assertEquals(66.67, result.get("Category2"), 0.01);
    }

    @Test
    @DisplayName("roundScores should handle zero decimal places")
    void testRoundScores_ZeroDecimals_RoundsToInteger() {
        Map<String, Double> scores = new HashMap<>();
        scores.put("Category1", 33.7);
        scores.put("Category2", 66.3);

        Map<String, Double> result = ScoreUtils.roundScores(scores, 0);
        assertEquals(34.0, result.get("Category1"), 0.01);
        assertEquals(66.0, result.get("Category2"), 0.01);
    }

    @Test
    @DisplayName("roundScores should handle negative values")
    void testRoundScores_NegativeValues_RoundsCorrectly() {
        Map<String, Double> scores = new HashMap<>();
        scores.put("Category1", -33.333);

        Map<String, Double> result = ScoreUtils.roundScores(scores, 2);
        assertEquals(-33.33, result.get("Category1"), 0.01);
    }
}
