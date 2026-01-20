package com.profiling.service.psychometric;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.profiling.model.psychometric.Answer;
import com.profiling.model.psychometric.PsychometricSession;
import com.profiling.model.psychometric.Question;
import com.profiling.model.psychometric.UserInfo;

/**
 * Service to generate PDF containing all psychometric test questions with user responses
 */
@Service
public class AnswersPdfService {
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMMM dd, yyyy")
            .withZone(ZoneId.systemDefault());
    
    /**
     * Generate a PDF with all questions and user's answers
     * 
     * @param session The psychometric session containing questions and answers
     * @return PDF bytes
     * @throws IOException if PDF generation fails
     */
    public byte[] generateAnswersPdf(PsychometricSession session) throws IOException {
        try {
            System.out.println("=== ANSWERS PDF GENERATION START ===");
            System.out.println("Session ID: " + session.getId());
            System.out.println("Session Status: " + session.getStatus());
            
            // Validate session data
            if (session.getQuestions() == null) {
                System.err.println("ERROR: Session has null questions list");
                throw new IOException("Session has no questions data");
            }
            
            System.out.println("Questions count: " + session.getQuestions().size());
            
            if (session.getAnswers() == null) {
                System.out.println("WARNING: Session has null answers list, will show all as unanswered");
            } else {
                System.out.println("Answers count: " + session.getAnswers().size());
            }
            
            if (session.getUserInfo() == null) {
                System.err.println("ERROR: Session has null userInfo");
                throw new IOException("Session has no user information");
            }
            
            System.out.println("User: " + session.getUserInfo().getName());
            System.out.println("Generating HTML content...");
            
            String htmlContent = generateHtmlContent(session);
            System.out.println("HTML generated successfully, length: " + htmlContent.length() + " characters");
            
            // Debug: Print first 500 characters of HTML
            System.out.println("HTML preview: " + htmlContent.substring(0, Math.min(500, htmlContent.length())));
            
            System.out.println("Creating PDF builder...");
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(htmlContent, null);
            builder.toStream(outputStream);
            
            System.out.println("Running PDF renderer...");
            builder.run();
            
            byte[] result = outputStream.toByteArray();
            System.out.println("=== PDF GENERATED SUCCESSFULLY ===");
            System.out.println("PDF size: " + result.length + " bytes");
            return result;
            
        } catch (Exception e) {
            System.err.println("=== ERROR GENERATING ANSWERS PDF ===");
            System.err.println("Error type: " + e.getClass().getName());
            System.err.println("Error message: " + e.getMessage());
            System.err.println("Stack trace:");
            e.printStackTrace();
            throw new IOException("Failed to generate answers PDF: " + e.getMessage(), e);
        }
    }
    
    private String generateHtmlContent(PsychometricSession session) {
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html>\n");
        html.append("<html>\n");
        html.append("<head>\n");
        html.append("<meta charset='UTF-8'/>\n");
        html.append("<style>\n");
        html.append(getStyles());
        html.append("</style>\n");
        html.append("</head>\n");
        html.append("<body>\n");
        
        // Create answer lookup map
        Map<String, Answer> answerMap = createAnswerMap(session.getAnswers());
        
        // Header
        html.append(generateHeader(session));
        
        // Group questions by section
        Map<Integer, List<Question>> questionsBySection = groupQuestionsBySection(session.getQuestions());
        
        // Generate content for each section
        for (int sectionNum = 1; sectionNum <= 3; sectionNum++) {
            if (questionsBySection.containsKey(sectionNum)) {
                html.append(generateSectionContent(
                    sectionNum, 
                    questionsBySection.get(sectionNum), 
                    answerMap
                ));
            }
        }
        
        html.append("</body>\n");
        html.append("</html>\n");
        
        return html.toString();
    }
    
    private String generateHeader(PsychometricSession session) {
        StringBuilder html = new StringBuilder();
        UserInfo userInfo = session.getUserInfo();
        
        html.append("<div class='header'>\n");
        html.append("  <h1>Psychometric Test - Questions and Responses</h1>\n");
        html.append("  <div class='candidate-info'>\n");
        
        if (userInfo != null) {
            if (userInfo.getName() != null && !userInfo.getName().isEmpty()) {
                html.append("    <p><strong>Candidate Name:</strong> ").append(escapeHtml(userInfo.getName())).append("</p>\n");
            }
            if (userInfo.getEmail() != null && !userInfo.getEmail().isEmpty()) {
                html.append("    <p><strong>Email:</strong> ").append(escapeHtml(userInfo.getEmail())).append("</p>\n");
            }
        }
        
        if (session.getUpdatedAt() != null) {
            String date = DATE_FORMATTER.format(session.getUpdatedAt());
            html.append("    <p><strong>Test Date:</strong> ").append(date).append("</p>\n");
        }
        
        if (session.getId() != null) {
            html.append("    <p><strong>Session ID:</strong> ").append(escapeHtml(session.getId())).append("</p>\n");
        }
        
        html.append("  </div>\n");
        html.append("</div>\n");
        
        return html.toString();
    }
    
    private String generateSectionContent(int sectionNum, List<Question> questions, Map<String, Answer> answerMap) {
        StringBuilder html = new StringBuilder();
        
        String sectionName = getSectionName(sectionNum);
        
        html.append("<div class='section-header'>\n");
        html.append("  <h2>Section ").append(sectionNum).append(": ").append(sectionName).append("</h2>\n");
        html.append("</div>\n");
        
        int questionNum = 1;
        for (Question question : questions) {
            html.append(generateQuestionBlock(questionNum, question, answerMap.get(question.getId())));
            questionNum++;
        }
        
        return html.toString();
    }
    
    private String generateQuestionBlock(int questionNum, Question question, Answer answer) {
        StringBuilder html = new StringBuilder();
        
        html.append("<div class='question-block'>\n");
        
        // Question number and category
        html.append("  <div class='question-header'>\n");
        html.append("    <span class='question-number'>Question ").append(questionNum).append("</span>\n");
        if (question.getCategory() != null && !question.getCategory().isEmpty()) {
            html.append("    <span class='question-category'>").append(escapeHtml(question.getCategory())).append("</span>\n");
        }
        html.append("  </div>\n");
        
        // Scenario (if present)
        if (question.getScenario() != null && !question.getScenario().isEmpty()) {
            html.append("  <div class='scenario'>\n");
            html.append("    <strong>Scenario:</strong><br/>\n");
            html.append("    ").append(escapeHtml(question.getScenario())).append("\n");
            html.append("  </div>\n");
        }
        
        // Question prompt
        html.append("  <div class='question-prompt'>\n");
        html.append("    ").append(escapeHtml(question.getPrompt())).append("\n");
        html.append("  </div>\n");
        
        // Options
        if (question.getOptions() != null && !question.getOptions().isEmpty()) {
            html.append("  <div class='options'>\n");
            
            Integer selectedIndex = answer != null ? answer.getSelectedOptionIndex() : null;
            Integer correctIndex = question.getCorrectOptionIndex();
            List<Integer> traitScores = question.getTraitImpactScores();
            List<String> rationales = question.getRationales();
            
            for (int i = 0; i < question.getOptions().size(); i++) {
                String option = question.getOptions().get(i);
                boolean isSelected = selectedIndex != null && selectedIndex == i;
                boolean isCorrect = correctIndex != null && correctIndex == i;
                
                String optionClass = "option";
                if (isSelected) {
                    optionClass += " selected";
                }
                if (isCorrect) {
                    optionClass += " correct";
                }
                
                html.append("    <div class='").append(optionClass).append("'>\n");
                html.append("      <span class='option-label'>").append((char)('A' + i)).append(".</span>\n");
                html.append("      <span class='option-text'>").append(escapeHtml(option)).append("</span>\n");
                
                // Show indicators
                if (isSelected) {
                    html.append("      <span class='indicator user-answer'>Your Answer</span>\n");
                }
                if (isCorrect && correctIndex != null) {
                    html.append("      <span class='indicator correct-answer'>Correct Answer</span>\n");
                }
                
                html.append("    </div>\n");
                
                // Show rationale if available for selected or correct answer
                if (rationales != null && i < rationales.size() && (isSelected || isCorrect)) {
                    String rationale = rationales.get(i);
                    if (rationale != null && !rationale.isEmpty()) {
                        html.append("    <div class='rationale'>\n");
                        html.append("      <strong>Rationale:</strong> ").append(escapeHtml(rationale)).append("\n");
                        html.append("    </div>\n");
                    }
                }
                
                // Show trait score if available for behavioral questions
                if (traitScores != null && i < traitScores.size() && isSelected) {
                    Integer score = traitScores.get(i);
                    if (score != null) {
                        html.append("    <div class='trait-score'>\n");
                        html.append("      <strong>Trait Impact Score:</strong> ").append(score).append("/100\n");
                        html.append("    </div>\n");
                    }
                }
            }
            
            html.append("  </div>\n");
        }
        
        // Show if unanswered
        if (answer == null || answer.getSelectedOptionIndex() == null) {
            html.append("  <div class='not-answered'>\n");
            html.append("    <em>Not Answered</em>\n");
            html.append("  </div>\n");
        }
        
        html.append("</div>\n");
        
        return html.toString();
    }
    
    private String getSectionName(int sectionNum) {
        switch (sectionNum) {
            case 1: return "Aptitude Assessment";
            case 2: return "Behavioral Assessment";
            case 3: return "Domain Knowledge";
            default: return "Section " + sectionNum;
        }
    }
    
    private Map<String, Answer> createAnswerMap(List<Answer> answers) {
        Map<String, Answer> map = new HashMap<>();
        if (answers != null) {
            for (Answer answer : answers) {
                if (answer != null && answer.getQuestionId() != null) {
                    map.put(answer.getQuestionId(), answer);
                }
            }
        }
        return map;
    }
    
    private Map<Integer, List<Question>> groupQuestionsBySection(List<Question> questions) {
        Map<Integer, List<Question>> grouped = new HashMap<>();
        if (questions != null) {
            for (Question question : questions) {
                int section = question.getSectionNumber();
                grouped.computeIfAbsent(section, k -> new java.util.ArrayList<>()).add(question);
            }
        }
        return grouped;
    }
    
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;")
            .replace("\n", "<br/>");
    }
    
    private String getStyles() {
        StringBuilder css = new StringBuilder();
        css.append("@page { size: A4; margin: 20mm; }\n");
        css.append("body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; }\n");
        css.append(".header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4CAF50; }\n");
        css.append("h1 { font-size: 24pt; font-weight: bold; color: #1a1a1a; margin-bottom: 15px; }\n");
        css.append("h2 { font-size: 16pt; font-weight: bold; color: #4CAF50; margin-bottom: 10px; }\n");
        css.append(".candidate-info { background: #f8f9fa; padding: 15px; margin-top: 15px; }\n");
        css.append(".candidate-info p { margin: 5px 0; font-size: 10pt; }\n");
        css.append(".section-header { margin-top: 40px; margin-bottom: 20px; padding: 12px 15px; background: #4CAF50; color: white; }\n");
        css.append(".section-header h2 { color: white; margin: 0; }\n");
        css.append(".question-block { margin-bottom: 30px; padding: 20px; background: #ffffff; border: 1px solid #e0e0e0; page-break-inside: avoid; }\n");
        css.append(".question-header { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0; overflow: hidden; }\n");
        css.append(".question-number { font-weight: bold; font-size: 12pt; color: #1a1a1a; display: inline-block; margin-right: 15px; }\n");
        css.append(".question-category { font-size: 9pt; color: #666; background: #f0f0f0; padding: 4px 10px; display: inline-block; float: right; }\n");
        css.append(".scenario { background: #fff9e6; padding: 12px; margin-bottom: 12px; border-left: 4px solid #ffc107; font-size: 10pt; }\n");
        css.append(".question-prompt { font-size: 11pt; font-weight: 500; margin-bottom: 15px; color: #1a1a1a; line-height: 1.7; }\n");
        css.append(".options { margin-top: 15px; }\n");
        css.append(".option { padding: 12px; margin-bottom: 10px; border: 1px solid #e0e0e0; background: #ffffff; overflow: hidden; }\n");
        css.append(".option.selected { background: #e3f2fd; border-color: #2196F3; border-width: 2px; }\n");
        css.append(".option.correct { background: #e8f5e9; border-color: #4CAF50; border-width: 2px; }\n");
        css.append(".option.selected.correct { background: #c8e6c9; border-color: #4CAF50; }\n");
        css.append(".option-label { font-weight: bold; margin-right: 10px; color: #1a1a1a; display: inline; }\n");
        css.append(".option-text { color: #1a1a1a; display: inline; }\n");
        css.append(".indicator { font-size: 8pt; padding: 3px 8px; font-weight: 600; margin-left: 10px; display: inline-block; }\n");
        css.append(".indicator.user-answer { background: #2196F3; color: white; }\n");
        css.append(".indicator.correct-answer { background: #4CAF50; color: white; }\n");
        css.append(".rationale { margin: 8px 0 8px 35px; padding: 10px; background: #f5f5f5; border-left: 3px solid #4CAF50; font-size: 9pt; color: #333; }\n");
        css.append(".trait-score { margin: 8px 0 8px 35px; padding: 8px; background: #e3f2fd; border-left: 3px solid #2196F3; font-size: 9pt; color: #1565C0; }\n");
        css.append(".not-answered { margin-top: 10px; padding: 10px; background: #ffebee; border-left: 3px solid #f44336; color: #c62828; font-size: 10pt; }\n");
        css.append("strong { font-weight: 600; }\n");
        css.append("em { font-style: italic; }\n");
        return css.toString();
    }
}

