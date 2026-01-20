package com.profiling.service;

import com.profiling.dto.ResumeDataDTO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ResumeParserService {

    private static final Logger log = LoggerFactory.getLogger(ResumeParserService.class);
    
    private final WebClient webClient;
    
    @Value("${openai.api.key:}")
    private String openaiApiKey;

    public ResumeParserService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    /**
     * Parse resume file and extract relevant information
     */
    public ResumeDataDTO parseResume(MultipartFile file) throws IOException {
        String text = extractTextFromFile(file);
        ResumeDataDTO dto = parseTextWithAI(text);
        // Always include raw text for preview purposes
        dto.setRawText(text);
        return dto;
    }

    /**
     * Parse profile PDF file and extract relevant information
     */
    public ResumeDataDTO parseProfilePdf(MultipartFile file) throws IOException {
        String text = extractTextFromFile(file);
        ResumeDataDTO dto = parseProfileTextWithAI(text);
        // Always include raw text for preview purposes
        dto.setRawText(text);
        return dto;
    }

    /**
     * Extract text from PDF or DOCX file
     */
    private String extractTextFromFile(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("File name is required");
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = "";
        }

        // Extract text based on file type
        if (filename.toLowerCase().endsWith(".pdf") || contentType.contains("pdf")) {
            return extractTextFromPDF(file.getInputStream());
        } else if (filename.toLowerCase().endsWith(".docx") || contentType.contains("wordprocessingml")) {
            return extractTextFromDOCX(file.getInputStream());
        } else if (filename.toLowerCase().endsWith(".doc") || contentType.contains("msword")) {
            throw new IllegalArgumentException("Legacy .doc format is not supported. Please convert to .docx or PDF");
        } else {
            throw new IllegalArgumentException("Unsupported file format. Please upload PDF or DOCX file");
        }
    }

    /**
     * Extract text from PDF file
     */
    private String extractTextFromPDF(InputStream inputStream) throws IOException {
        try (PDDocument document = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    /**
     * Extract text from DOCX file
     */
    private String extractTextFromDOCX(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            StringBuilder text = new StringBuilder();
            List<XWPFParagraph> paragraphs = document.getParagraphs();
            for (XWPFParagraph paragraph : paragraphs) {
                text.append(paragraph.getText()).append("\n");
            }
            return text.toString();
        }
    }

    /**
     * Use AI to parse profile PDF text and extract structured information
     */
    private ResumeDataDTO parseProfileTextWithAI(String profileText) {
        log.info("Parsing profile PDF with AI...");
        
        try {
            // If OpenAI key is not configured, fall back to regex-based parsing
            if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
                log.warn("OpenAI API key not configured. Using fallback regex-based parsing.");
                return parseTextWithRegex(profileText);
            }

            String prompt = buildProfilePrompt(profileText);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");
            requestBody.put("messages", List.of(
                Map.of("role", "system", "content", "You are a profile parser. Extract information from profile documents and return it in a structured JSON format."),
                Map.of("role", "user", "content", prompt)
            ));
            requestBody.put("temperature", 0.3);
            requestBody.put("max_tokens", 1000);

            Mono<Map> responseMono = webClient.post()
                    .uri("https://api.openai.com/v1/chat/completions")
                    .header("Authorization", "Bearer " + openaiApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class);

            Map<String, Object> response = responseMono.block();
            
            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) message.get("content");
                    return parseAIResponse(content);
                }
            }
            
            // Fallback to regex if AI parsing fails
            log.warn("AI parsing failed. Falling back to regex-based parsing.");
            return parseTextWithRegex(profileText);
            
        } catch (Exception e) {
            log.error("Error parsing profile PDF with AI: {}", e.getMessage());
            // Fallback to regex-based parsing
            return parseTextWithRegex(profileText);
        }
    }

    private String buildProfilePrompt(String profileText) {
        return """
            Parse the following profile document and extract these fields in JSON format:
            {
                "name": "Full name",
                "email": "Email address",
                "phone": "Phone number",
                "linkedin": "LinkedIn URL",
                "institute": "Educational institute/university",
                "currentDegree": "Degree (e.g., Bachelor's, Master's)",
                "branch": "Field of study/major",
                "yearOfStudy": "Year or expected graduation year",
                "technicalSkills": "Technical skills (comma separated)",
                "softSkills": "Soft skills (comma separated)",
                "certifications": "Certifications",
                "achievements": "Achievements",
                "interests": "Professional interests",
                "hobbies": "Hobbies",
                "workExperience": "Work experience details",
                "companyName": "Most recent company name",
                "designation": "Most recent job title",
                "yearsOfExperience": "Total years of experience",
                "internshipDetails": "Internship details if any"
            }
            
            Important: Return ONLY valid JSON. If a field is not found, use empty string "".
            
            Profile text:
            """ + profileText;
    }

    /**
     * Use AI to parse resume text and extract structured information
     */
    private ResumeDataDTO parseTextWithAI(String resumeText) {
        log.info("Parsing resume with AI...");
        
        try {
            // If OpenAI key is not configured, fall back to regex-based parsing
            if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
                log.warn("OpenAI API key not configured. Using fallback regex-based parsing.");
                return parseTextWithRegex(resumeText);
            }

            String prompt = buildPrompt(resumeText);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");
            requestBody.put("messages", List.of(
                Map.of("role", "system", "content", "You are a resume parser. Extract information from resumes and return it in a structured JSON format."),
                Map.of("role", "user", "content", prompt)
            ));
            requestBody.put("temperature", 0.3);
            requestBody.put("max_tokens", 1000);

            Mono<Map> responseMono = webClient.post()
                    .uri("https://api.openai.com/v1/chat/completions")
                    .header("Authorization", "Bearer " + openaiApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class);

            Map<String, Object> response = responseMono.block();
            
            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) message.get("content");
                    return parseAIResponse(content);
                }
            }
            
            // Fallback to regex if AI parsing fails
            log.warn("AI parsing failed. Falling back to regex-based parsing.");
            return parseTextWithRegex(resumeText);
            
        } catch (Exception e) {
            log.error("Error parsing resume with AI: {}", e.getMessage());
            // Fallback to regex-based parsing
            return parseTextWithRegex(resumeText);
        }
    }

    private String buildPrompt(String resumeText) {
        return """
            Parse the following resume and extract these fields in JSON format:
            {
                "name": "Full name",
                "email": "Email address",
                "phone": "Phone number",
                "linkedin": "LinkedIn URL",
                "institute": "Educational institute/university",
                "currentDegree": "Degree (e.g., Bachelor's, Master's)",
                "branch": "Field of study/major",
                "yearOfStudy": "Year or expected graduation year",
                "technicalSkills": "Technical skills (comma separated)",
                "softSkills": "Soft skills (comma separated)",
                "certifications": "Certifications",
                "achievements": "Achievements",
                "interests": "Professional interests",
                "hobbies": "Hobbies",
                "workExperience": "Work experience details",
                "companyName": "Most recent company name",
                "designation": "Most recent job title",
                "yearsOfExperience": "Total years of experience",
                "internshipDetails": "Internship details if any"
            }
            
            Important: Return ONLY valid JSON. If a field is not found, use empty string "".
            
            Resume text:
            """ + resumeText;
    }

    private ResumeDataDTO parseAIResponse(String aiResponse) {
        try {
            // Extract JSON from the response (handle markdown code blocks)
            String jsonContent = aiResponse;
            if (jsonContent.contains("```json")) {
                jsonContent = jsonContent.substring(jsonContent.indexOf("```json") + 7);
                jsonContent = jsonContent.substring(0, jsonContent.indexOf("```"));
            } else if (jsonContent.contains("```")) {
                jsonContent = jsonContent.substring(jsonContent.indexOf("```") + 3);
                jsonContent = jsonContent.substring(0, jsonContent.lastIndexOf("```"));
            }
            
            jsonContent = jsonContent.trim();
            
            // Parse JSON using Jackson or manual parsing
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, String> data = mapper.readValue(jsonContent, Map.class);
            
            ResumeDataDTO dto = new ResumeDataDTO();
            dto.setName(data.getOrDefault("name", ""));
            dto.setEmail(data.getOrDefault("email", ""));
            dto.setPhone(data.getOrDefault("phone", ""));
            dto.setLinkedin(data.getOrDefault("linkedin", ""));
            dto.setInstitute(data.getOrDefault("institute", ""));
            dto.setCurrentDegree(data.getOrDefault("currentDegree", ""));
            dto.setBranch(data.getOrDefault("branch", ""));
            dto.setYearOfStudy(data.getOrDefault("yearOfStudy", ""));
            dto.setTechnicalSkills(data.getOrDefault("technicalSkills", ""));
            dto.setSoftSkills(data.getOrDefault("softSkills", ""));
            dto.setCertifications(data.getOrDefault("certifications", ""));
            dto.setAchievements(data.getOrDefault("achievements", ""));
            dto.setInterests(data.getOrDefault("interests", ""));
            dto.setHobbies(data.getOrDefault("hobbies", ""));
            dto.setWorkExperience(data.getOrDefault("workExperience", ""));
            dto.setCompanyName(data.getOrDefault("companyName", ""));
            dto.setDesignation(data.getOrDefault("designation", ""));
            dto.setYearsOfExperience(data.getOrDefault("yearsOfExperience", ""));
            dto.setInternshipDetails(data.getOrDefault("internshipDetails", ""));
            
            return dto;
        } catch (Exception e) {
            log.error("Error parsing AI response: {}", e.getMessage());
            // Fallback to regex
            return new ResumeDataDTO();
        }
    }

    /**
     * Fallback regex-based parsing when AI is not available
     */
    private ResumeDataDTO parseTextWithRegex(String text) {
        ResumeDataDTO dto = new ResumeDataDTO();
        
        // Extract email
        Pattern emailPattern = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
        Matcher emailMatcher = emailPattern.matcher(text);
        if (emailMatcher.find()) {
            dto.setEmail(emailMatcher.group());
        }
        
        // Extract phone (various formats)
        Pattern phonePattern = Pattern.compile("(?:\\+?1[-.]?)?(?:\\(?\\d{3}\\)?[-.]?)?\\d{3}[-.]?\\d{4}");
        Matcher phoneMatcher = phonePattern.matcher(text);
        if (phoneMatcher.find()) {
            dto.setPhone(phoneMatcher.group());
        }
        
        // Extract LinkedIn URL
        Pattern linkedinPattern = Pattern.compile("(?:https?://)?(?:www\\.)?linkedin\\.com/in/[a-zA-Z0-9-]+/?");
        Matcher linkedinMatcher = linkedinPattern.matcher(text);
        if (linkedinMatcher.find()) {
            dto.setLinkedin(linkedinMatcher.group());
        }
        
        // Try to extract name (usually first line or after certain keywords)
        String[] lines = text.split("\\n");
        for (int i = 0; i < Math.min(5, lines.length); i++) {
            String line = lines[i].trim();
            if (!line.isEmpty() && line.length() < 50 && !line.contains("@") && 
                !line.toLowerCase().contains("resume") && !line.toLowerCase().contains("cv")) {
                // Check if it looks like a name (2-4 words, each capitalized)
                String[] words = line.split("\\s+");
                if (words.length >= 2 && words.length <= 4) {
                    boolean looksLikeName = true;
                    for (String word : words) {
                        if (word.isEmpty() || !Character.isUpperCase(word.charAt(0))) {
                            looksLikeName = false;
                            break;
                        }
                    }
                    if (looksLikeName) {
                        dto.setName(line);
                        break;
                    }
                }
            }
        }
        
        // Extract sections using common resume keywords
        extractSection(text, dto, "(?i)(skills|technical skills)\\s*:?\\s*([^\\n]+(?:\\n[^\\n]+){0,3})", "technicalSkills");
        extractSection(text, dto, "(?i)(education)\\s*:?\\s*([^\\n]+(?:\\n[^\\n]+){0,3})", "institute");
        extractSection(text, dto, "(?i)(experience|work experience)\\s*:?\\s*([^\\n]+(?:\\n[^\\n]+){0,5})", "workExperience");
        
        return dto;
    }
    
    private void extractSection(String text, ResumeDataDTO dto, String regex, String field) {
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find() && matcher.groupCount() >= 2) {
            String content = matcher.group(2).trim();
            switch (field) {
                case "technicalSkills" -> dto.setTechnicalSkills(content);
                case "institute" -> dto.setInstitute(content);
                case "workExperience" -> dto.setWorkExperience(content);
            }
        }
    }
}


