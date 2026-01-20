package com.profiling.template;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.profiling.model.Profile;

@Component
public class TemplateEngine {

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{[^}]+}}");

    public String render(String template, Profile profile) {
        String resolvedTemplate = applySection(template, "hasInternship", Boolean.TRUE.equals(profile.getHasInternship()));
        resolvedTemplate = applySection(resolvedTemplate, "hasExperience", Boolean.TRUE.equals(profile.getHasExperience()));

        Map<String, String> values = buildPlaceholderValues(profile);
        for (Map.Entry<String, String> entry : values.entrySet()) {
            resolvedTemplate = resolvedTemplate.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return PLACEHOLDER_PATTERN.matcher(resolvedTemplate).replaceAll("");
    }

    private Map<String, String> buildPlaceholderValues(Profile profile) {
        Map<String, String> values = new HashMap<>();

        values.put("name", valueOrDefault(profile.getName(), "[name]"));
        values.put("currentDegree", valueOrDefault(profile.getCurrentDegree(), "[degree]"));
        values.put("branch", valueOrDefault(profile.getBranch(), "[branch]"));
        values.put("institute", valueOrDefault(profile.getInstitute(), "[institute]"));
        values.put("yearOfStudy", valueOrDefault(profile.getYearOfStudy(), "[year]"));
        values.put("certifications", valueOrDefault(profile.getCertifications(), ""));
        values.put("achievements", valueOrDefault(profile.getAchievements(), ""));
        values.put("technicalSkills", valueOrDefault(profile.getTechnicalSkills(), "[technical skills]"));
        values.put("softSkills", valueOrDefault(profile.getSoftSkills(), "[soft skills]"));
        values.put("email", valueOrDefault(profile.getEmail(), "[email]"));
        values.put("phone", valueOrDefault(profile.getPhone(), "[phone number]"));
        values.put("linkedin", valueOrDefault(profile.getLinkedin(), "[LinkedIn profile]"));
        values.put("dob", valueOrDefault(profile.getDob(), "[date of birth]"));
        values.put("profileImage",
                valueOrDefault(profile.getProfileImage(), "https://via.placeholder.com/420x520.png?text=Profile"));
        values.put("hiringManagerName", valueOrDefault(profile.getHiringManagerName(), "Hiring Manager"));
        values.put("companyName", valueOrDefault(profile.getCompanyName(), "[Company Name]"));
        values.put("companyAddress", valueOrDefault(profile.getCompanyAddress(), "[Company Address]"));
        values.put("positionTitle", valueOrDefault(profile.getPositionTitle(), "[Position Title]"));
        values.put("relevantExperience", buildRelevantExperience(profile));
        values.put("keyAchievement", buildKeyAchievement(profile));
        values.put("strengths", buildStrengths(profile));
        values.put("closingNote", buildClosingNote(profile));

        values.put("internshipDetails", valueOrDefault(profile.getInternshipDetails(), "meaningful internship experiences"));
        values.put("experienceDetails", valueOrDefault(profile.getExperienceDetails(), "relevant industry exposure"));
        values.put("professionalInternshipSentence", buildProfessionalInternshipSentence(profile));
        values.put("professionalExperienceSentence", buildProfessionalExperienceSentence(profile));
        values.put("internshipClause", buildBioInternshipClause(profile));
        values.put("experienceClause", buildBioExperienceClause(profile));
        values.put("internshipNarrative", buildStoryInternshipNarrative(profile));
        values.put("experienceNarrative", buildStoryExperienceNarrative(profile));
        values.put("internshipHighlight", buildCoverInternshipHighlight(profile));
        values.put("professionalHighlight", buildCoverProfessionalHighlight(profile));
        values.put("contactLine", buildContactLine(profile));
        values.put("signatureLinkedin", buildSignatureLinkedin(profile));

        return values;
    }

    private String buildRelevantExperience(Profile profile) {
        String relevantExperience = profile.getRelevantExperience();
        if (StringUtils.hasText(relevantExperience)) {
            return relevantExperience.trim();
        }
        String degree = valueOrDefault(profile.getCurrentDegree(), "[your degree]");
        String branch = valueOrDefault(profile.getBranch(), "[specialisation]");
        return "my background in " + degree + " and " + branch;
    }

    private String buildKeyAchievement(Profile profile) {
        if (StringUtils.hasText(profile.getKeyAchievement())) {
            return profile.getKeyAchievement().trim();
        }
        return valueOrDefault(profile.getAchievements(), "a recent accomplishment");
    }

    private String buildStrengths(Profile profile) {
        if (StringUtils.hasText(profile.getStrengths())) {
            return profile.getStrengths().trim();
        }
        return valueOrDefault(profile.getSoftSkills(), "collaboration and adaptability");
    }

    private String buildClosingNote(Profile profile) {
        if (StringUtils.hasText(profile.getClosingNote())) {
            return profile.getClosingNote().trim();
        }
        String companyName = valueOrDefault(profile.getCompanyName(), "[Company Name]");
        return "Thank you for taking the time to review my application. I would welcome the opportunity to discuss how I can contribute to "
                + companyName + ".";
    }

    private String buildProfessionalInternshipSentence(Profile profile) {
        if (Boolean.TRUE.equals(profile.getHasInternship())) {
            String details = valueOrDefault(profile.getInternshipDetails(), "meaningful internship experiences");
            return " I have further strengthened my professional readiness through internships such as " + details + ".";
        }
        return "";
    }

    private String buildProfessionalExperienceSentence(Profile profile) {
        if (Boolean.TRUE.equals(profile.getHasExperience())) {
            String details = valueOrDefault(profile.getExperienceDetails(), "relevant industry exposure");
            return " Additionally, my hands-on experience includes " + details + ".";
        }
        return "";
    }

    private String buildBioInternshipClause(Profile profile) {
        if (Boolean.TRUE.equals(profile.getHasInternship())) {
            String details = valueOrDefault(profile.getInternshipDetails(), "impactful internship experiences");
            return " I've also had the chance to learn on the job through internships like " + details + ".";
        }
        return "";
    }

    private String buildBioExperienceClause(Profile profile) {
        if (Boolean.TRUE.equals(profile.getHasExperience())) {
            String details = valueOrDefault(profile.getExperienceDetails(), "real-world projects");
            return " Beyond campus life, I've built experience around " + details + ".";
        }
        return "";
    }

    private String buildStoryInternshipNarrative(Profile profile) {
        if (Boolean.TRUE.equals(profile.getHasInternship())) {
            String details = valueOrDefault(profile.getInternshipDetails(), "immersive internship experiences");
            return " During this time, internships such as " + details + " offered new perspectives and confidence.";
        }
        return "";
    }

    private String buildStoryExperienceNarrative(Profile profile) {
        if (Boolean.TRUE.equals(profile.getHasExperience())) {
            String details = valueOrDefault(profile.getExperienceDetails(), "meaningful industry exposure");
            return " Professional chapters also include experiences like " + details + ", adding depth to every lesson learned.";
        }
        return "";
    }

    private String buildCoverInternshipHighlight(Profile profile) {
        if (Boolean.TRUE.equals(profile.getHasInternship())) {
            String details = valueOrDefault(profile.getInternshipDetails(), "invaluable internship opportunities");
            return " My internship experience, including " + details + ", allowed me to translate classroom insights into real impact.";
        }
        return "";
    }

    private String buildCoverProfessionalHighlight(Profile profile) {
        if (Boolean.TRUE.equals(profile.getHasExperience())) {
            String details = valueOrDefault(profile.getExperienceDetails(), "relevant professional roles");
            return " Beyond that, I have contributed through experiences such as " + details + ".";
        }
        return "";
    }

    private String buildContactLine(Profile profile) {
        String email = valueOrDefault(profile.getEmail(), "[your.email@example.com]");
        String linkedin = profile.getLinkedin();
        if (StringUtils.hasText(linkedin)) {
            return "You can reach me at " + email + " or connect via LinkedIn: " + linkedin.trim() + ".";
        }
        return "You can reach me at " + email + ".";
    }

    private String buildSignatureLinkedin(Profile profile) {
        if (StringUtils.hasText(profile.getLinkedin())) {
            return profile.getLinkedin().trim();
        }
        return "";
    }

    private String valueOrDefault(String value, String fallback) {
        if (!StringUtils.hasText(value)) {
            return fallback;
        }
        return value.trim();
    }

    private String applySection(String template, String key, boolean include) {
        String pattern = "\\{\\{#" + key + "}}(.*?)\\{\\{/" + key + "}}";
        Pattern sectionPattern = Pattern.compile(pattern, Pattern.DOTALL);
        var matcher = sectionPattern.matcher(template);
        StringBuffer result = new StringBuffer();
        while (matcher.find()) {
            String replacement = include ? matcher.group(1) : "";
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);
        return result.toString();
    }
}

