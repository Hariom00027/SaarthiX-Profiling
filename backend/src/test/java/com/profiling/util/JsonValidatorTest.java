package com.profiling.util;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JsonValidator Tests")
class JsonValidatorTest {

    @Test
    @DisplayName("isValidJson should return true for valid JSON")
    void testIsValidJson_ValidJson_ReturnsTrue() {
        assertTrue(JsonValidator.isValidJson("{\"key\":\"value\"}"));
        assertTrue(JsonValidator.isValidJson("{\"name\":\"John\",\"age\":30}"));
        assertTrue(JsonValidator.isValidJson("[]"));
        assertTrue(JsonValidator.isValidJson("[1,2,3]"));
    }

    @Test
    @DisplayName("isValidJson should return false for invalid JSON")
    void testIsValidJson_InvalidJson_ReturnsFalse() {
        assertFalse(JsonValidator.isValidJson(null));
        assertFalse(JsonValidator.isValidJson(""));
        assertFalse(JsonValidator.isValidJson("   "));
        assertFalse(JsonValidator.isValidJson("{invalid}"));
        assertFalse(JsonValidator.isValidJson("not json"));
    }

    @Test
    @DisplayName("parseJson should parse valid JSON string")
    void testParseJson_ValidJson_ReturnsJsonNode() {
        JsonNode node = JsonValidator.parseJson("{\"key\":\"value\"}");
        assertNotNull(node);
        assertEquals("value", node.get("key").asText());
    }

    @Test
    @DisplayName("parseJson should throw RuntimeException for invalid JSON")
    void testParseJson_InvalidJson_ThrowsException() {
        assertThrows(RuntimeException.class, () -> {
            JsonValidator.parseJson("invalid json");
        });
    }

    @Test
    @DisplayName("extractJsonFromText should extract JSON from markdown code block")
    void testExtractJsonFromText_WithMarkdown_ExtractsJson() {
        String text = "```json\n{\"key\":\"value\"}\n```";
        String extracted = JsonValidator.extractJsonFromText(text);
        assertEquals("{\"key\":\"value\"}", extracted);
    }

    @Test
    @DisplayName("extractJsonFromText should extract JSON from plain code block")
    void testExtractJsonFromText_WithPlainCodeBlock_ExtractsJson() {
        String text = "```\n{\"key\":\"value\"}\n```";
        String extracted = JsonValidator.extractJsonFromText(text);
        assertEquals("{\"key\":\"value\"}", extracted);
    }

    @Test
    @DisplayName("extractJsonFromText should extract JSON from text with surrounding content")
    void testExtractJsonFromText_WithSurroundingText_ExtractsJson() {
        String text = "Some text before {\"key\":\"value\"} some text after";
        String extracted = JsonValidator.extractJsonFromText(text);
        assertEquals("{\"key\":\"value\"}", extracted);
    }

    @Test
    @DisplayName("extractJsonFromText should return null for null input")
    void testExtractJsonFromText_NullInput_ReturnsNull() {
        assertNull(JsonValidator.extractJsonFromText(null));
    }

    @Test
    @DisplayName("extractJsonFromText should return trimmed text for empty string")
    void testExtractJsonFromText_EmptyString_ReturnsNull() {
        assertNull(JsonValidator.extractJsonFromText(""));
        assertNull(JsonValidator.extractJsonFromText("   "));
    }
}
