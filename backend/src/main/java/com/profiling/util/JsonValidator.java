package com.profiling.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;

/**
 * Utility class for JSON validation
 */
public class JsonValidator {

    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    /**
     * Validate if a string is valid JSON
     */
    public static boolean isValidJson(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return false;
        }
        try {
            objectMapper.readTree(jsonString);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Parse JSON string to JsonNode
     */
    public static JsonNode parseJson(String jsonString) {
        try {
            return objectMapper.readTree(jsonString);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse JSON: " + e.getMessage(), e);
        }
    }

    /**
     * Extract JSON from text that might contain markdown code blocks
     */
    public static String extractJsonFromText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        // Remove markdown code blocks if present
        String cleaned = text.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        cleaned = cleaned.trim();

        // Try to find JSON object boundaries
        int startIdx = cleaned.indexOf('{');
        int endIdx = cleaned.lastIndexOf('}');
        if (startIdx >= 0 && endIdx > startIdx) {
            return cleaned.substring(startIdx, endIdx + 1);
        }

        return cleaned;
    }
}

