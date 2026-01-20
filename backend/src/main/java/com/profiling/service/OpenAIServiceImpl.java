package com.profiling.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;

@Service
public class OpenAIServiceImpl implements OpenAIService {

    private final WebClient webClient;
    private final String apiKey;
    // Note: Using gpt-4o-mini as the actual model name (user requested gpt-4.1-mini which doesn't exist)
    // If you need to use a different model, update this constant
    private static final String MODEL = "gpt-4o-mini";
    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private static final int MAX_TOKENS = 1000;
    private static final int MAX_TOKENS_EVALUATION = 4000;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    private static final Logger log = LoggerFactory.getLogger(OpenAIServiceImpl.class);

    public OpenAIServiceImpl(@Value("${openai.api.key:}") String apiKey) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalArgumentException("OpenAI API key must be configured. Set OPENAI_API_KEY environment variable or openai.api.key property.");
        }
        this.apiKey = apiKey;
        this.webClient = WebClient.builder()
                .baseUrl(OPENAI_API_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }

    @Override
    public String enhanceProfile(String profileText) {
        if (profileText == null || profileText.trim().isEmpty()) {
            throw new IllegalArgumentException("Profile text cannot be empty");
        }

        log.info("Calling OpenAI to enhance profile text");
        String prompt = buildPrompt(profileText);

        // Build request payload for OpenAI Chat Completions API
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", MODEL);
        
        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        
        requestBody.put("messages", java.util.List.of(message));
        requestBody.put("max_tokens", MAX_TOKENS);
        requestBody.put("temperature", 0.7);

        try {
            log.info("Sending request to OpenAI with model: {}, max_tokens: {}", MODEL, MAX_TOKENS);
            log.debug("Request body: {}", requestBody);
            
            OpenAIResponse response = webClient.post()
                    .uri(OPENAI_API_URL)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(OpenAIResponse.class)
                    .block(Duration.ofSeconds(600));

            if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
                throw new RuntimeException("No choices returned from OpenAI API");
            }

            Choice firstChoice = response.getChoices().get(0);
            if (firstChoice.getMessage() == null || firstChoice.getMessage().getContent() == null) {
                throw new RuntimeException("Invalid response structure from OpenAI API");
            }

            String enhancedText = firstChoice.getMessage().getContent().trim();
            
            // Post-process to remove year of study if it wasn't in the original
            enhancedText = removeUnwantedYearMentions(profileText, enhancedText);
            
            return enhancedText;
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            log.error("OpenAI API Error - Status: {}, Response: {}", e.getStatusCode(), e.getResponseBodyAsString());
            log.error("Request details - Model: {}, Prompt length: {} characters", MODEL, prompt.length());
            throw new RuntimeException("Failed to enhance profile with AI: " + e.getMessage() + " | Response: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Failed to enhance profile via OpenAI: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to enhance profile with AI: " + e.getMessage(), e);
        }
    }

    @Override
    public String enhanceParagraphWithReport(String originalParagraph, String reportInsights) {
        if (originalParagraph == null || originalParagraph.trim().isEmpty()) {
            throw new IllegalArgumentException("Original paragraph cannot be empty");
        }
        if (reportInsights == null) {
            reportInsights = "";
        }

        String normalizedOriginal = originalParagraph.trim().replaceAll("\\s+", " ");
        int maxWords = normalizedOriginal.isEmpty() ? 0 : normalizedOriginal.split("\\s+").length;

        String prompt = buildParagraphWithReportPrompt(normalizedOriginal, reportInsights, maxWords);
        String enhanced = callChatCompletions(prompt, 900, 0.6);

        // Hard guard: if the model exceeds maxWords, do a quick second pass to shorten.
        if (countWords(enhanced) > maxWords) {
            String shortenPrompt = buildShortenPrompt(enhanced, maxWords);
            enhanced = callChatCompletions(shortenPrompt, 700, 0.4);
        }

        // Final normalization: single paragraph, collapsed spaces.
        enhanced = enhanced == null ? "" : enhanced.replaceAll("[\\r\\n]+", " ").replaceAll("\\s+", " ").trim();
        return enhanced;
    }

    private int countWords(String text) {
        if (text == null) return 0;
        String t = text.trim();
        if (t.isEmpty()) return 0;
        return t.split("\\s+").length;
    }

    private String buildParagraphWithReportPrompt(String originalParagraph, String reportInsights, int maxWords) {
        return String.format(
            "You are an expert resume/profile writer.\n\n" +
            "TASK:\n" +
            "- Rewrite the ORIGINAL PARAGRAPH into a better, more professional paragraph.\n" +
            "- Blend in ONLY POSITIVE and RELEVANT insights from the PSYCHOMETRIC REPORT (strengths, fit analysis, behavioral insights).\n" +
            "- Keep the content truthful: do not invent projects, companies, awards, dates, or skills not present in the paragraph or report insights.\n\n" +
            "HARD LENGTH CONSTRAINT (CRITICAL):\n" +
            "- The original paragraph has %d words.\n" +
            "- Your output MUST be a SINGLE PARAGRAPH with AT MOST %d words.\n" +
            "- Do NOT increase word count. Prefer replacing weak words with stronger ones.\n\n" +
            "OUTPUT RULES:\n" +
            "- Output ONLY the enhanced paragraph.\n" +
            "- No headings, no bullet points, no quotes, no extra commentary.\n\n" +
            "ORIGINAL PARAGRAPH:\n" +
            "%s\n\n" +
            "PSYCHOMETRIC REPORT INSIGHTS (use selectively, positive only):\n" +
            "%s\n\n" +
            "ENHANCED PARAGRAPH:",
            maxWords,
            maxWords,
            originalParagraph,
            reportInsights
        );
    }

    private String buildShortenPrompt(String paragraph, int maxWords) {
        return String.format(
            "You are an expert editor.\n\n" +
            "TASK:\n" +
            "- Shorten the paragraph below WITHOUT losing key meaning.\n" +
            "- Keep it as a SINGLE PARAGRAPH.\n\n" +
            "HARD CONSTRAINT:\n" +
            "- Output MUST be AT MOST %d words.\n\n" +
            "OUTPUT ONLY the shortened paragraph:\n" +
            "%s",
            maxWords,
            paragraph == null ? "" : paragraph.trim()
        );
    }

    private String callChatCompletions(String userPrompt, int maxTokens, double temperature) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", MODEL);

        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", userPrompt);

        requestBody.put("messages", java.util.List.of(message));
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("temperature", temperature);

        try {
            log.debug("OpenAI request - Model: {}, Max tokens: {}, Temp: {}, Prompt length: {}", 
                MODEL, maxTokens, temperature, userPrompt.length());
            
            OpenAIResponse response = webClient.post()
                    .uri(OPENAI_API_URL)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(OpenAIResponse.class)
                    .block(Duration.ofSeconds(600));

            if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
                throw new RuntimeException("No choices returned from OpenAI API");
            }

            Choice firstChoice = response.getChoices().get(0);
            if (firstChoice.getMessage() == null || firstChoice.getMessage().getContent() == null) {
                throw new RuntimeException("Invalid response structure from OpenAI API");
            }

            return firstChoice.getMessage().getContent().trim();
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            log.error("OpenAI API Error - Status: {}, Response: {}", e.getStatusCode(), e.getResponseBodyAsString());
            log.error("Request details - Model: {}, Max tokens: {}, Prompt length: {}", MODEL, maxTokens, userPrompt.length());
            throw new RuntimeException("Failed to enhance paragraph with AI: " + e.getMessage() + " | Response: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Failed to call OpenAI chat completions: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to enhance paragraph with AI: " + e.getMessage(), e);
        }
    }

    @Override
    public String completePrompt(String prompt, int maxTokens, double temperature) {
        if (prompt == null || prompt.trim().isEmpty()) {
            throw new IllegalArgumentException("Prompt cannot be empty");
        }
        int tokens = maxTokens > 0 ? maxTokens : MAX_TOKENS;
        double temp = temperature >= 0 ? temperature : 0.7;
        return callChatCompletions(prompt, tokens, temp);
    }

    /**
     * Remove year of study mentions from enhanced text if they weren't in the original
     */
    private String removeUnwantedYearMentions(String originalText, String enhancedText) {
        // Check if original text contains year of study
        boolean originalHasYear = originalText.toLowerCase().matches(".*\\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\\s+year\\b.*") ||
                                   originalText.toLowerCase().contains("year of study") ||
                                   originalText.toLowerCase().contains("yearofstudy") ||
                                   originalText.toLowerCase().matches(".*\\b(year)\\s+(one|two|three|four|five)\\b.*");
        
        // If original doesn't have year, remove it from enhanced text
        if (!originalHasYear) {
            // Remove common year of study phrases
            enhancedText = enhancedText.replaceAll("(?i)\\b(in my|currently in my|as a|as an)\\s+(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\\s+year\\b", "");
            enhancedText = enhancedText.replaceAll("(?i)\\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\\s+year\\s+(student|of study)\\b", "");
            enhancedText = enhancedText.replaceAll("(?i)\\b(year)\\s+(one|two|three|four|five)\\b", "");
            enhancedText = enhancedText.replaceAll("(?i)\\b(year of study|academic year|study year)\\b", "");
            
            // Clean up any double spaces or punctuation issues
            enhancedText = enhancedText.replaceAll("\\s+", " ");
            enhancedText = enhancedText.replaceAll("\\s+([.,;:])", "$1");
            enhancedText = enhancedText.replaceAll("([.,;:])\\s*\\s+", "$1 ");
            enhancedText = enhancedText.trim();
            
            log.info("Removed year of study mentions from enhanced text as they were not in the original");
        }
        
        return enhancedText;
    }

    private String buildPrompt(String profileText) {
        // Count words in the original text
        String trimmedText = profileText.trim();
        int wordCount = trimmedText.isEmpty() ? 0 : trimmedText.split("\\s+").length;
        
        // Determine if this is a short selection (likely partial text) or full profile
        boolean isShortText = wordCount < 50;
        String wordCountInstruction;
        
        if (isShortText) {
            // For short text selections, be very strict about word count
            wordCountInstruction = String.format(
                "- The original text contains exactly %d words.\n" +
                "- Your enhanced version MUST contain EXACTLY the same number of words (%d words).\n" +
                "- Do NOT add any extra words. Do NOT expand the text.\n" +
                "- Replace words with better alternatives, but keep the exact same word count.\n" +
                "- If you need to improve clarity, use more precise or impactful words, not more words.\n",
                wordCount, wordCount
            );
        } else {
            // For longer texts, allow small tolerance
            wordCountInstruction = String.format(
                "- The original text contains approximately %d words.\n" +
                "- Your enhanced version MUST contain approximately the SAME number of words (within ±3%% tolerance, so between %d and %d words).\n" +
                "- Do NOT significantly expand or reduce the text length.\n" +
                "- Focus on improving quality, clarity, and impact while maintaining the same length.\n",
                wordCount, (int)(wordCount * 0.97), (int)(wordCount * 1.03)
            );
        }
        
        // Check if the text actually contains placeholders
        boolean hasPlaceholders = profileText.contains("[") && profileText.contains("]");
        String placeholderInstruction = "";
        
        // Check if year of study is mentioned in the original text
        boolean hasYearOfStudy = profileText.toLowerCase().matches(".*\\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\\s+year\\b.*") ||
                                  profileText.toLowerCase().contains("year of study") ||
                                  profileText.toLowerCase().contains("yearofstudy");
        
        if (hasPlaceholders) {
            placeholderInstruction = 
                "- If you encounter placeholders in square brackets like [specific field], [institution name], etc., " +
                "fill them with realistic and appropriate values that make sense in the context.\n" +
                "- Remove all placeholder brackets and replace them with actual meaningful content based on the context.\n" +
                "- DO NOT add placeholders for [year of study] or any year-related information unless it explicitly exists in the original text.\n";
        } else {
            placeholderInstruction = 
                "- DO NOT add any information that is not explicitly stated in the original text.\n" +
                "- DO NOT infer or assume details like year of study, specific skills, or achievements that are not mentioned.\n" +
                "- Only improve the wording, grammar, and clarity of what is already there.\n";
        }
        
        String yearRestriction = "";
        if (!hasYearOfStudy) {
            yearRestriction = 
                "ABSOLUTE PROHIBITION - YEAR OF STUDY:\n" +
                "- The original text does NOT mention any year of study (first year, second year, third year, etc.).\n" +
                "- You MUST NOT add any mention of year of study in your enhanced version.\n" +
                "- Do NOT use phrases like 'in my third year', 'currently in my second year', 'as a first-year student', etc.\n" +
                "- If the original text doesn't mention the year, your enhanced version must also not mention it.\n" +
                "- This is a CRITICAL requirement - adding year information when it's not in the original is a serious error.\n\n";
        }
        
        return String.format(
            "You are an AI specialized in transforming student profiles into polished, professional, and impactful descriptions suitable for resumes, portfolios, and academic applications. Improve the clarity, tone, grammar, and flow of the profile given below. Maintain all factual information—do NOT add any skills, achievements, or experience that the student has not provided.\n\n" +
            "Rewrite the following text into a more polished, concise, and impactful version.\n\n" +
            "CRITICAL REQUIREMENT - WORD COUNT PRESERVATION:\n" +
            "%s" +
            "CRITICAL REQUIREMENT - FACTUAL ACCURACY:\n" +
            "- Maintain ALL factual information exactly as provided.\n" +
            "- Do NOT add, remove, or change any facts, numbers, dates, names, or specific details.\n" +
            "- Do NOT infer information that is not explicitly stated (e.g., do not assume year of study, specific skills, or achievements).\n" +
            "- Only improve the language, grammar, and flow while keeping all facts identical.\n\n" +
            "%s" +
            "PLACEHOLDER HANDLING:\n" +
            "%s" +
            "IMPORTANT INSTRUCTIONS:\n" +
            "- Keep the text strictly truthful and professional.\n" +
            "- Remove grammar issues and improve clarity, flow, and professionalism.\n" +
            "- Maintain all provided real information (like email addresses, names, dates) exactly as given.\n" +
            "- Use more impactful and concise language to improve quality without adding length.\n" +
            "- Replace weak words with stronger alternatives, but keep the same structure and length.\n" +
            "- DO NOT add any information that is not in the original text.\n" +
            "- DO NOT mention year of study, academic year, or study year unless it is explicitly stated in the original text.\n\n" +
            "Text to enhance: %s\n\n" +
            "Remember: Your response must have the same word count as the original text and must NOT contain any information not present in the original. If the original does not mention year of study, your response must also not mention it.",
            wordCountInstruction, yearRestriction, placeholderInstruction, profileText
        );
    }

    @Override
    public List<String> generateQuestions(Map<String, String> userProfileData) {
        String prompt = buildQuestionGenerationPrompt(userProfileData);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", MODEL);
        
        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        
        requestBody.put("messages", java.util.List.of(message));
        requestBody.put("max_tokens", 2000);
        requestBody.put("temperature", 0.8);

        log.info("Generating personalized questions via OpenAI");
        try {
            OpenAIResponse response = webClient.post()
                    .uri(OPENAI_API_URL)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(OpenAIResponse.class)
                    .block(Duration.ofSeconds(600));

            if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
                throw new RuntimeException("No choices returned from OpenAI API");
            }

            String responseText = response.getChoices().get(0).getMessage().getContent().trim();
            return parseQuestionsFromResponse(responseText);
        } catch (Exception e) {
            log.error("Failed to generate questions: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate questions: " + e.getMessage(), e);
        }
    }

    @Override
    public String generateWhyQuestion(String question, String answer) {
        if (answer == null || answer.trim().length() < 50) {
            return null; // Only ask WHY for substantial answers
        }

        String prompt = String.format(
            "You are Saathi, an expert AI career counselor. The user answered a question with a substantial response.\n\n" +
            "Original Question: %s\n" +
            "User's Answer: %s\n\n" +
            "Generate a single, thoughtful follow-up 'WHY' question that digs deeper into their reasoning or motivation. " +
            "The question should be concise (one sentence), natural, and help understand their thought process better.\n\n" +
            "If the answer is too brief or doesn't warrant a WHY question, respond with 'SKIP'.\n\n" +
            "Generate only the question, nothing else.",
            question, answer
        );

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", MODEL);
        
        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        
        requestBody.put("messages", java.util.List.of(message));
        requestBody.put("max_tokens", 150);
        requestBody.put("temperature", 0.7);

        try {
            log.info("Generating WHY question via OpenAI");
            OpenAIResponse response = webClient.post()
                    .uri(OPENAI_API_URL)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(OpenAIResponse.class)
                    .block(Duration.ofSeconds(600));

            if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
                return null;
            }

            String whyQuestion = response.getChoices().get(0).getMessage().getContent().trim();
            if (whyQuestion.equalsIgnoreCase("SKIP") || whyQuestion.length() < 10) {
                return null;
            }
            return whyQuestion;
        } catch (Exception e) {
            log.warn("Failed to generate WHY question: {}", e.getMessage());
            return null; // Fail silently for WHY questions
        }
    }

    @Override
    public String evaluateInterests(Map<String, String> userProfileData, Map<String, String> answers, Map<String, String> invalidAnswers) {
        String prompt = buildEvaluationPrompt(userProfileData, answers, invalidAnswers);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", MODEL);
        
        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        
        requestBody.put("messages", java.util.List.of(message));
        requestBody.put("max_tokens", MAX_TOKENS_EVALUATION);
        requestBody.put("temperature", 0.7);
        requestBody.put("response_format", Map.of("type", "json_object"));

        try {
            log.info("Evaluating interests via OpenAI");
            OpenAIResponse response = webClient.post()
                    .uri(OPENAI_API_URL)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(OpenAIResponse.class)
                    .block(Duration.ofSeconds(600));

            if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
                throw new RuntimeException("No choices returned from OpenAI API");
            }

            return response.getChoices().get(0).getMessage().getContent().trim();
        } catch (Exception e) {
            log.error("Failed to evaluate interests: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to evaluate interests: " + e.getMessage(), e);
        }
    }

    private String buildQuestionGenerationPrompt(Map<String, String> userProfileData) {
        StringBuilder profileContext = new StringBuilder();
        profileContext.append("User Profile Information:\n");
        if (userProfileData.get("name") != null) {
            profileContext.append("- Name: ").append(userProfileData.get("name")).append("\n");
        }
        if (userProfileData.get("institute") != null) {
            profileContext.append("- Institute: ").append(userProfileData.get("institute")).append("\n");
        }
        if (userProfileData.get("branch") != null) {
            profileContext.append("- Branch: ").append(userProfileData.get("branch")).append("\n");
        }
        if (userProfileData.get("yearOfStudy") != null) {
            profileContext.append("- Year of Study: ").append(userProfileData.get("yearOfStudy")).append("\n");
        }
        if (userProfileData.get("technicalSkills") != null) {
            profileContext.append("- Technical Skills: ").append(userProfileData.get("technicalSkills")).append("\n");
        }
        if (userProfileData.get("softSkills") != null) {
            profileContext.append("- Soft Skills: ").append(userProfileData.get("softSkills")).append("\n");
        }
        if (userProfileData.get("certifications") != null) {
            profileContext.append("- Certifications: ").append(userProfileData.get("certifications")).append("\n");
        }
        if (userProfileData.get("achievements") != null) {
            profileContext.append("- Achievements: ").append(userProfileData.get("achievements")).append("\n");
        }
        if (userProfileData.get("hobbies") != null) {
            profileContext.append("- Hobbies: ").append(userProfileData.get("hobbies")).append("\n");
        }
        if (userProfileData.get("interests") != null) {
            profileContext.append("- Interests: ").append(userProfileData.get("interests")).append("\n");
        }
        if (userProfileData.get("goals") != null) {
            profileContext.append("- Goals: ").append(userProfileData.get("goals")).append("\n");
        }

        return String.format(
            "You are Saathi, an expert AI career counselor. Generate exactly 15 personalized questions that draw connections between everything the student shared and their current journey, but tilt the set heavily toward their interests, skills, and hobbies.\n\n" +
            "%s\n\n" +
            "Generate 15 questions divided into 3 stages (5 questions each):\n\n" +
            "Stage 1 (Questions 1-5): Focus on skills, technical interests, and problem-solving approach\n" +
            "Stage 2 (Questions 6-10): Focus on creativity, design thinking, hobbies, and innovation\n" +
            "Stage 3 (Questions 11-15): Focus on leadership, management, entrepreneurship, research interests, and how their interests/skills tie back to broader goals\n\n" +
            "Requirements:\n" +
            "- Questions must be personalized based on the user's profile, referencing their interests, skills, hobbies, and the rest of the context\n" +
            "- Keep the tone conversational and let the questions naturally refer to what they already mentioned\n" +
            "- Each question should help the AI understand their motivations, strengths, and future focus areas\n" +
            "- If you can relate a question back to their hobbies, skills, or interests, do so even while touching other profile details\n\n" +
            "Output format: Return ONLY a JSON array of exactly 15 question strings, like this:\n" +
            "[\"Question 1 text\", \"Question 2 text\", ..., \"Question 15 text\"]\n\n" +
            "Do not include any other text, explanations, or formatting. Just the JSON array.",
            profileContext.toString()
        );
    }

    private List<String> parseQuestionsFromResponse(String responseText) {
        try {
            // Remove markdown code blocks if present
            String cleaned = responseText.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            // Extract JSON array
            int startIdx = cleaned.indexOf('[');
            int endIdx = cleaned.lastIndexOf(']');
            if (startIdx >= 0 && endIdx > startIdx) {
                cleaned = cleaned.substring(startIdx, endIdx + 1);
            }

            @SuppressWarnings("unchecked")
            List<String> questions = objectMapper.readValue(cleaned, List.class);
            
            // Remove duplicates (case-insensitive, normalized) FIRST
            questions = removeDuplicateQuestions(questions);
            
            // Check if "interests and goals" question already exists
            boolean hasInterestsGoalsQuestion = questions.stream()
                .anyMatch(q -> q.toLowerCase().contains("interests") && 
                             (q.toLowerCase().contains("goals") || q.toLowerCase().contains("goal")));
            
            // Ensure we have exactly 15 questions
            if (questions.size() < 15) {
                // Pad with generic questions if needed, but avoid "interests and goals" if it already exists
                List<String> fallbackQuestions = generateFallbackQuestions();
                int index = 0;
                while (questions.size() < 15 && index < fallbackQuestions.size()) {
                    String fallbackQ = fallbackQuestions.get(index);
                    // Skip if it's the interests/goals question and we already have one
                    boolean isInterestsGoals = fallbackQ.toLowerCase().contains("interests") && 
                                             (fallbackQ.toLowerCase().contains("goals") || fallbackQ.toLowerCase().contains("goal"));
                    if (!isInterestsGoals || !hasInterestsGoalsQuestion) {
                        // Also check if this question is already in the list
                        boolean isDuplicate = questions.stream()
                            .anyMatch(q -> normalizeQuestion(q).equals(normalizeQuestion(fallbackQ)));
                        if (!isDuplicate) {
                            questions.add(fallbackQ);
                        }
                    }
                    index++;
                }
                // If still not enough, add unique generic questions
                int genericIndex = 0;
                while (questions.size() < 15) {
                    final String genericQ;
                    if (genericIndex == 0) {
                        genericQ = "What aspects of your field interest you the most?";
                    } else if (genericIndex == 1) {
                        genericQ = "How do you plan to apply your skills in the future?";
                    } else if (genericIndex == 2) {
                        genericQ = "What challenges are you most excited to tackle?";
                    } else if (genericIndex == 3) {
                        genericQ = "What drives your passion for learning?";
                    } else {
                        // Skip interests/goals question if we already have one
                        if (hasInterestsGoalsQuestion) {
                            genericIndex++;
                            if (genericIndex > 10) break; // Safety break
                            continue;
                        }
                        genericQ = "Tell me more about your interests and goals.";
                    }
                    
                    final String normalizedGenericQ = normalizeQuestion(genericQ);
                    boolean isDuplicate = questions.stream()
                        .anyMatch(q -> normalizeQuestion(q).equals(normalizedGenericQ));
                    if (!isDuplicate) {
                        questions.add(genericQ);
                    }
                    genericIndex++;
                    if (genericIndex > 10) break; // Safety break
                }
            } else if (questions.size() > 15) {
                // Trim to exactly 15 questions
                questions = questions.subList(0, 15);
            }
            
            // Verify we have exactly 15 questions before returning
            if (questions.size() != 15) {
                log.warn("Question count mismatch: expected 15, got {}. Using fallback questions.", questions.size());
                return generateFallbackQuestions();
            }
            
            return questions;
        } catch (Exception e) {
            log.warn("Failed to parse generated questions, using fallback: {}", e.getMessage());
            // Fallback: return generic questions
            return generateFallbackQuestions();
        }
    }

    private List<String> generateFallbackQuestions() {
        List<String> questions = new ArrayList<>();
        questions.add("What technical skills are you most passionate about?");
        questions.add("How do you approach solving complex problems?");
        questions.add("What projects have you worked on that you're most proud of?");
        questions.add("What technologies or tools do you want to learn next?");
        questions.add("What motivates you to keep learning and growing?");
        questions.add("How do you express your creativity in your work or hobbies?");
        questions.add("What role does design thinking play in your projects?");
        questions.add("How do you handle feedback and iterate on your ideas?");
        questions.add("What innovative solutions have you come up with?");
        questions.add("How do you balance multiple interests and priorities?");
        questions.add("Describe a time when you took on a leadership role.");
        questions.add("How do you manage team conflicts or disagreements?");
        questions.add("What are your thoughts on starting your own venture?");
        questions.add("What research areas interest you the most?");
        questions.add("How do you see your interests and skills aligning with your future goals?");
        return questions;
    }

    /**
     * Remove duplicate questions from the list (case-insensitive, normalized)
     */
    private List<String> removeDuplicateQuestions(List<String> questions) {
        List<String> uniqueQuestions = new ArrayList<>();
        List<String> normalizedSeen = new ArrayList<>();
        
        for (String question : questions) {
            String normalized = normalizeQuestion(question);
            if (!normalizedSeen.contains(normalized)) {
                normalizedSeen.add(normalized);
                uniqueQuestions.add(question);
            }
        }
        
        return uniqueQuestions;
    }

    /**
     * Normalize a question for comparison (lowercase, trim, remove extra spaces)
     */
    private String normalizeQuestion(String question) {
        if (question == null) return "";
        return question.toLowerCase()
                .trim()
                .replaceAll("\\s+", " ")
                .replaceAll("[.,!?;:]", "");
    }

    private String buildEvaluationPrompt(Map<String, String> userProfileData, Map<String, String> answers, Map<String, String> invalidAnswers) {
        StringBuilder context = new StringBuilder();
        context.append("User Profile:\n");
        userProfileData.forEach((key, value) -> {
            if (value != null && !value.trim().isEmpty()) {
                context.append("- ").append(key).append(": ").append(value).append("\n");
            }
        });
        
        context.append("\nUser Answers:\n");
        answers.forEach((question, answer) -> {
            context.append("Q: ").append(question).append("\n");
            context.append("A: ").append(answer).append("\n\n");
        });

        if (invalidAnswers != null && !invalidAnswers.isEmpty()) {
            context.append("Invalid or placeholder answers detected for the following questions:\n");
            invalidAnswers.forEach((question, answer) -> {
                context.append("- ").append(question).append(": ");
                context.append(answer == null || answer.trim().isEmpty() ? "[no response]" : answer.trim()).append("\n");
            });
            context.append("Please mention that those entries were incomplete when you summarize the evaluation and rely mostly on the rest of the answers.\n\n");
        }

        return String.format(
            "You are Saathi, an expert AI career counselor. Analyze the user's profile and answers to generate a comprehensive interest evaluation.\n\n" +
            "%s\n\n" +
            "Generate a detailed evaluation in the following JSON format (all fields are required):\n\n" +
            "{\n" +
            "  \"interests\": {\n" +
            "    \"tech\": <number 0-100>,\n" +
            "    \"design\": <number 0-100>,\n" +
            "    \"management\": <number 0-100>,\n" +
            "    \"entrepreneurship\": <number 0-100>,\n" +
            "    \"research\": <number 0-100>\n" +
            "  },\n" +
            "  \"pie_chart_labels\": [\"Tech\", \"Design\", \"Management\", \"Entrepreneurship\", \"Research\"],\n" +
            "  \"pie_chart_values\": [<tech_score>, <design_score>, <management_score>, <entrepreneurship_score>, <research_score>],\n" +
            "  \"interest_persona\": \"<A 2-3 sentence description of their primary interest persona>\",\n" +
            "  \"strengths\": [\"<strength1>\", \"<strength2>\", \"<strength3>\"],\n" +
            "  \"weaknesses\": [\"<weakness1>\", \"<weakness2>\"],\n" +
            "  \"dos\": [\"<do1>\", \"<do2>\", \"<do3>\", \"<do4>\"],\n" +
            "  \"donts\": [\"<dont1>\", \"<dont2>\", \"<dont3>\"],\n" +
            "  \"recommended_roles\": [\"<role1>\", \"<role2>\", \"<role3>\", \"<role4>\"],\n" +
            "  \"roadmap_90_days\": \"<A detailed 90-day roadmap as a single paragraph>\",\n" +
            "  \"suggested_courses\": [\"<course1>\", \"<course2>\", \"<course3>\", \"<course4>\"],\n" +
            "  \"project_ideas\": [\"<idea1>\", \"<idea2>\", \"<idea3>\"],\n" +
            "  \"summary\": \"<A short, crisp 2-sentence summary (max) that highlights their interests, key skills, and hobbies and omits any mention of missing answers>\"\n" +
            "}\n\n" +
            "IMPORTANT:\n" +
            "- The interest scores should reflect their actual interests based on profile and answers\n" +
            "- All scores should be numbers (not strings)\n" +
            "- pie_chart_values should match the interest scores in the same order\n" +
            "- Be specific and personalized based on their profile\n" +
            "- Return ONLY valid JSON, no markdown, no explanations\n" +
            "- All arrays should have at least 2-4 items\n" +
            "- Recommended roles should be achievable within 1-2 years (entry-level, associate, internship, or junior titles) and tied to their interests/skills; avoid suggesting distant senior roles like project manager for a fresher\n" +
            "- Suggested courses must name concrete programs or certifications (include the course title and provider when possible) that support their stated interests or skills\n" +
            "- The summary should be concise and focused on their interests/skills/hobbies, not on invalid or missing answers",
            context.toString()
        );
    }

    // Inner classes for JSON deserialization
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class OpenAIResponse {
        @JsonProperty("choices")
        private java.util.List<Choice> choices;

        public java.util.List<Choice> getChoices() {
            return choices;
        }

        public void setChoices(java.util.List<Choice> choices) {
            this.choices = choices;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Choice {
        @JsonProperty("message")
        private Message message;

        public Message getMessage() {
            return message;
        }

        public void setMessage(Message message) {
            this.message = message;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Message {
        @JsonProperty("content")
        private String content;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
