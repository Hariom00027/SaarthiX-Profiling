package com.profiling.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for score normalization and calculations
 */
public class ScoreUtils {

    /**
     * Normalize scores so they sum to 100
     * @param scores Map of interest category to score
     * @return Normalized scores that sum to 100
     */
    public static Map<String, Double> normalizeScores(Map<String, Double> scores) {
        if (scores == null || scores.isEmpty()) {
            return new HashMap<>();
        }

        // Calculate total score
        double totalScore = scores.values().stream()
                .mapToDouble(Double::doubleValue)
                .sum();

        // If total is 0, return equal distribution
        if (totalScore == 0) {
            double equalValue = 100.0 / scores.size();
            Map<String, Double> normalized = new HashMap<>();
            scores.keySet().forEach(key -> normalized.put(key, equalValue));
            return normalized;
        }

        // Normalize: (score / totalScore) * 100
        Map<String, Double> normalized = new HashMap<>();
        for (Map.Entry<String, Double> entry : scores.entrySet()) {
            double normalizedValue = (entry.getValue() / totalScore) * 100.0;
            normalized.put(entry.getKey(), normalizedValue);
        }

        // Ensure sum is exactly 100 (adjust for rounding errors)
        double sum = normalized.values().stream().mapToDouble(Double::doubleValue).sum();
        if (Math.abs(sum - 100.0) > 0.01) {
            // Adjust the largest value to make sum exactly 100
            String largestKey = normalized.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(normalized.keySet().iterator().next());
            double adjustment = 100.0 - sum;
            normalized.put(largestKey, normalized.get(largestKey) + adjustment);
        }

        return normalized;
    }

    /**
     * Round scores to 2 decimal places
     */
    public static Map<String, Double> roundScores(Map<String, Double> scores, int decimals) {
        Map<String, Double> rounded = new HashMap<>();
        double multiplier = Math.pow(10, decimals);
        for (Map.Entry<String, Double> entry : scores.entrySet()) {
            double roundedValue = Math.round(entry.getValue() * multiplier) / multiplier;
            rounded.put(entry.getKey(), roundedValue);
        }
        return rounded;
    }
}

