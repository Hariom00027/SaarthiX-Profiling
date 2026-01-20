package com.profiling.template;

import java.time.Instant;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class TemplateDataInitializer implements ApplicationRunner {

    private final TemplateRepository templateRepository;

    public TemplateDataInitializer(TemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        Instant now = Instant.now();
        String defaultCss = getDefaultCss();

        List<String> deprecatedTemplateIds = List.of("formal-letter", "portfolio");
        for (String deprecatedId : deprecatedTemplateIds) {
            templateRepository.findByIdAndUserIdIsNull(deprecatedId)
                    .ifPresent(templateRepository::delete);
        }

        List<TemplateEntity> defaults = List.of(
                createTemplateEntity("professional", "Professional", "Extremely professional with fluent English",
                        "\uD83D\uDCBC", professionalTemplate(), defaultCss, now, now),
                createTemplateEntity("bio", "Bio", "Casual and friendly bio style", "\u2728", bioTemplate(), defaultCss, now, now),
                createTemplateEntity("story", "Story", "Simple story-like narrative", "\uD83D\uDCD6", storyTemplate(),
                        defaultCss, now, now),
                createTemplateEntity("cover", "Cover Letter", "Generate a tailored cover letter after providing company details",
                        "\u2709\uFE0F", coverLetterTemplate(), coverLetterCss(), now, now),
                createTemplateEntity("modern-professional", "Modern Professional", "Ambitious tone with modern professional presence",
                        "\uD83E\uDDD1\u200D\uD83D\uDCBC", modernProfessionalTemplate(), defaultCss, now, now),
                createTemplateEntity("industry", "Industry Ready", "Balanced, employer-facing tone with practical highlights",
                        "\uD83C\uDFED", industryTemplate(), defaultCss, now, now),
                createTemplateEntity("executive", "Executive Professional Template",
                        "A confident and achievement-oriented profile template highlighting education, skills, and professional goals.",
                        "\uD83C\uDFC6", executiveTemplate(), defaultCss, now, now),
                createTemplateEntity("professional-profile", "Professional Profile with Photo",
                        "Visual professional profile with headshot, structured sections for education, skills, and certifications.",
                        "\uD83D\uDCF7", professionalProfileTemplate(), professionalProfileCss(), now, now),
                createTemplateEntity("designer-portrait", "Designer Portrait Showcase",
                        "Magazine-style profile with vertical name stack, photo, and quick portfolio highlights.",
                        "\uD83C\uDFA8", designerPortraitTemplate(), designerPortraitCss(), now, now));
        for (TemplateEntity template : defaults) {
            // Set userId to null for global templates
            template.setUserId(null);
            template.setIsUserCustomTemplate(false);
            
            // Check if global template exists (userId is null)
            if (!templateRepository.findByIdAndUserIdIsNull(template.getId()).isPresent()) {
                templateRepository.save(template);
                } else {
                    // Update existing template with appropriate CSS (user can customize later via API)
                    TemplateEntity existing = templateRepository.findByIdAndUserIdIsNull(template.getId()).orElse(null);
                    if (existing != null) {
                        boolean updated = false;
                        // Always update CSS for cover letter and professional-profile templates to get latest styling
                        // For other templates, only update if CSS is empty to preserve custom CSS
                        if ("cover".equals(template.getId()) || "professional-profile".equals(template.getId())
                                || "designer-portrait".equals(template.getId())
                                || existing.getCss() == null || existing.getCss().trim().isEmpty()) {
                            // Use the CSS from the template object (which has the correct CSS for each type)
                            existing.setCss(template.getCss());
                            updated = true;
                        }
                        if (existing.getEnabled() == null) {
                            existing.setEnabled(true);
                            updated = true;
                        }
                        if (updated) {
                            existing.setUpdatedAt(Instant.now());
                            templateRepository.save(existing);
                        }
                    }
                }
        }
    }

    private TemplateEntity createTemplateEntity(String id, String name, String description, String icon,
            String content, String css, Instant createdAt, Instant updatedAt) {
        TemplateEntity template = new TemplateEntity();
        template.setId(id);
        template.setName(name);
        template.setDescription(description);
        template.setIcon(icon);
        template.setContent(content);
        template.setCss(css);
        template.setCreatedAt(createdAt);
        template.setUpdatedAt(updatedAt);
        return template;
    }

    private String getDefaultCss() {
        return """
                /* Overall container */
                .profile-container {
                  max-width: 800px;
                  margin: 40px auto;
                  padding: 20px;
                  font-family: 'Inter', 'Poppins', sans-serif;
                  color: #1a1a1a;
                }

                /* Title */
                .profile-container h2 {
                  font-size: 2rem;
                  font-weight: 700;
                  color: #222;
                  margin-bottom: 24px;
                  text-align: center;
                  letter-spacing: 0.5px;
                }

                /* Profile card */
                .profile-card {
                  background: #ffffff;
                  border-radius: 16px;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                  padding: 30px 35px;
                  line-height: 1.8;
                  font-size: 1rem;
                  transition: all 0.3s ease;
                }

                .profile-card:hover {
                  transform: translateY(-4px);
                  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
                }

                /* Profile title inside card */
                .profile-card h3 {
                  font-weight: 600;
                  color: #2c3e50;
                  margin-bottom: 16px;
                }

                /* Paragraph text */
                .profile-card p {
                  text-align: justify;
                  color: #444;
                  margin-bottom: 0.75rem;
                  line-height: 1.6;
                }

                .profile-card p:last-child {
                  margin-bottom: 0;
                }

                /* Buttons section */
                .profile-actions {
                  margin-top: 30px;
                  display: flex;
                  justify-content: center;
                  gap: 20px;
                }

                /* Common button style */
                .profile-btn {
                  padding: 12px 20px;
                  border: none;
                  border-radius: 8px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  font-size: 0.95rem;
                }

                /* Specific buttons */
                .btn-pdf {
                  background-color: #2563eb;
                  color: white;
                }

                .btn-json {
                  background-color: #16a34a;
                  color: white;
                }

                .btn-edit {
                  background-color: #374151;
                  color: white;
                }

                /* Hover effects */
                .profile-btn:hover {
                  transform: translateY(-2px);
                  opacity: 0.9;
                }

                /* Responsive */
                @media (max-width: 600px) {
                  .profile-card {
                    padding: 20px;
                  }
                  .profile-actions {
                    flex-direction: column;
                    gap: 12px;
                  }
                }
                """;
    }

    private String professionalTemplate() {
        return """
                I am {{name}}, a dedicated and accomplished student currently pursuing a {{currentDegree}} degree with a specialization in {{branch}} at {{institute}}. Presently in my {{yearOfStudy}} year of academic tenure, I have demonstrated exceptional commitment to professional development through the successful completion of distinguished certifications including {{certifications}}. Throughout my educational journey, I have achieved notable recognition for {{achievements}}, which underscores my unwavering dedication to excellence. My technical proficiencies encompass {{technicalSkills}}, complemented by refined soft skills such as {{softSkills}}, which collectively position me as a well-rounded professional.{{professionalInternshipSentence}}{{professionalExperienceSentence}} For professional correspondence, I can be reached at {{email}}, and I invite you to explore my comprehensive professional profile at {{linkedin}}. Date of Birth: {{dob}}.
                """;
    }

    private String bioTemplate() {
        return """
                Hey there! I'm {{name}} 👋 I'm a {{yearOfStudy}} year student studying {{branch}} in {{currentDegree}} at {{institute}}. I've picked up some cool certifications along the way like {{certifications}}, and I'm pretty proud of {{achievements}}! I love working with {{technicalSkills}}, and people tell me I'm good at {{softSkills}}. Want to connect? Drop me a line at {{email}} or check out my LinkedIn: {{linkedin}}.{{internshipClause}}{{experienceClause}} Let's chat!
                """;
    }

    private String storyTemplate() {
        return """
                This is the story of {{name}}, born on {{dob}}. From a young age, there was always a passion for learning and growth. Today, that journey has led to pursuing a {{currentDegree}} degree in {{branch}} at {{institute}}, now in the {{yearOfStudy}} year. Along this path, several milestones were reached - certifications earned in {{certifications}}, and memorable achievements like {{achievements}}. The skills developed include {{technicalSkills}}, paired with personal strengths in {{softSkills}}.{{internshipNarrative}}{{experienceNarrative}} This journey continues to unfold, and new chapters are being written every day. To be part of this story, reach out at {{email}} or connect through {{linkedin}}.
                """;
    }

    private String coverLetterTemplate() {
        return """
                {{companyName}}
                {{companyAddress}}

                Dear {{hiringManagerName}},

                I am writing to express my enthusiasm for the {{positionTitle}} role at {{companyName}}. With {{relevantExperience}}, I am eager to bring my dedication and passion to your team.

                During my journey, I have accomplished {{keyAchievement}}, demonstrating my ability to deliver meaningful results.{{internshipHighlight}}{{professionalHighlight}} I pride myself on strengths such as {{strengths}}, which I believe would be valuable at {{companyName}}.

                {{closingNote}} {{contactLine}}

                Best regards,
                {{name}}
                {{email}}
                {{signatureLinkedin}}
                """;
    }

    private String coverLetterCss() {
        return """
                /* Cover Letter Container */
                .profile-container {
                  max-width: 800px;
                  margin: 40px auto;
                  padding: 20px;
                  font-family: 'Inter', 'Poppins', 'Georgia', serif;
                  color: #1a1a1a;
                }

                /* Cover Letter Card with Pink Wavy Design */
                .profile-card {
                  background: #ffffff;
                  border-radius: 0;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                  padding: 60px 50px;
                  line-height: 1.8;
                  font-size: 1rem;
                  position: relative;
                  min-height: 600px;
                  overflow: hidden;
                }

                /* Pink Wavy Design Element - Top Edge */
                .profile-card::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 120px;
                  background: linear-gradient(135deg, rgba(255, 182, 193, 0.4) 0%, rgba(255, 192, 203, 0.3) 50%, rgba(255, 228, 225, 0.2) 100%);
                  clip-path: ellipse(120% 60px at 50% 0%);
                  z-index: 0;
                }

                /* Pink Wavy Design Element - Left Edge */
                .profile-card::after {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  bottom: 0;
                  width: 120px;
                  background: linear-gradient(180deg, rgba(255, 182, 193, 0.4) 0%, rgba(255, 192, 203, 0.3) 50%, rgba(255, 228, 225, 0.2) 100%);
                  clip-path: ellipse(60px 120% at 0% 50%);
                  z-index: 0;
                }

                /* Content above decorative elements */
                .profile-card > * {
                  position: relative;
                  z-index: 1;
                }

                /* Hide template title for cover letters */
                .profile-card h3 {
                  display: none;
                }

                /* Cover Letter Content Container */
                .cover-letter-content {
                  position: relative;
                  z-index: 1;
                }

                /* Header Banner - Dark Blue */
                .cover-letter-header-banner {
                  background: #1e3a5f;
                  border-radius: 50px;
                  padding: 30px 40px;
                  margin-bottom: 40px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  color: white;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                /* Name on Left Side */
                .cover-letter-header-name {
                  font-size: 1.8rem;
                  font-weight: bold;
                  line-height: 1.2;
                  color: white;
                }

                /* Contact Info on Right Side */
                .cover-letter-header-contact {
                  text-align: right;
                  font-size: 0.9rem;
                  line-height: 1.6;
                  color: white;
                }

                /* Date - Below Address */
                .cover-letter-date {
                  text-align: left;
                  margin-top: 20px;
                  margin-bottom: 0;
                  font-weight: 600;
                }

                /* Company Information */
                .cover-letter-company {
                  margin-bottom: 20px;
                  font-size: 0.95rem;
                }

                /* Salutation */
                .cover-letter-salutation {
                  margin-bottom: 20px;
                  font-size: 1rem;
                }

                /* Main Body */
                .cover-letter-body {
                  margin-bottom: 20px;
                  text-align: justify;
                  font-size: 1rem;
                  line-height: 1.8;
                  color: #333;
                }

                .cover-letter-body p {
                  margin-bottom: 16px;
                  line-height: 1.8;
                }

                /* Closing */
                .cover-letter-closing {
                  margin-top: 30px;
                  margin-bottom: 10px;
                  font-size: 1rem;
                }

                /* Signature */
                .cover-letter-signature {
                  margin-top: 40px;
                  font-style: italic;
                  font-family: 'Brush Script MT', 'Lucida Handwriting', cursive, serif;
                  font-size: 1.1rem;
                }

                /* Title styling */
                .profile-container h2 {
                  font-size: 2rem;
                  font-weight: 700;
                  color: #222;
                  margin-bottom: 24px;
                  text-align: center;
                  letter-spacing: 0.5px;
                }

                /* Buttons section */
                .profile-actions {
                  margin-top: 30px;
                  display: flex;
                  justify-content: center;
                  gap: 20px;
                  flex-wrap: wrap;
                }

                /* Common button style */
                .profile-btn {
                  padding: 12px 20px;
                  border: none;
                  border-radius: 8px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  font-size: 0.95rem;
                }

                /* Specific buttons */
                .btn-pdf {
                  background-color: #2563eb;
                  color: white;
                }

                .btn-edit {
                  background-color: #374151;
                  color: white;
                }

                /* Hover effects */
                .profile-btn:hover {
                  transform: translateY(-2px);
                  opacity: 0.9;
                }

                /* Responsive */
                @media (max-width: 600px) {
                  .profile-card {
                    padding: 40px 30px;
                  }
                  .cover-letter-header-banner {
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 20px 25px;
                    border-radius: 30px;
                  }
                  .cover-letter-header-name {
                    font-size: 1.5rem;
                    margin-bottom: 15px;
                  }
                  .cover-letter-header-contact {
                    text-align: left;
                    width: 100%;
                  }
                }
                """;
    }

    private String industryTemplate() {
        return """
                {{name}} is a dedicated and growth-oriented student currently pursuing a {{currentDegree}} degree in {{branch}} at {{institute}}.

                With academic experience spanning {{yearOfStudy}} year(s), {{name}} has continuously built a strong foundation in modern technical concepts and practical skills.

                Key technical strengths include {{technicalSkills}}, supported by essential soft skills such as {{softSkills}}, which enable effective teamwork, adaptability, and problem-solving in diverse environments.

                {{name}} has earned certifications such as {{certifications}}, demonstrating a commitment to continuous learning and professional development. Notable achievements include {{achievements}}, reflecting consistent effort and excellence.

                {{#hasInternship}}
                Practical exposure through internships like {{internshipDetails}} has strengthened industry readiness and improved hands-on competence.
                {{/hasInternship}}

                {{#hasExperience}}
                Additionally, meaningful experience in {{experienceDetails}} has contributed to a broader understanding of real-world challenges and project workflows.
                {{/hasExperience}}

                For communication or professional opportunities, {{name}} can be reached at {{email}}.
                LinkedIn: {{linkedin}}
                Date of Birth: {{dob}}
                """;
    }

    private String modernProfessionalTemplate() {
        return """
                {{name}} is an ambitious and dedicated student currently pursuing a {{currentDegree}} degree in {{branch}} at {{institute}}. With a strong academic foundation and {{yearOfStudy}} year(s) of experience in structured learning, {{name}} consistently demonstrates curiosity, discipline, and an eagerness to master new concepts.

                A key strength of {{name}} lies in technical competency across {{technicalSkills}}, supported by essential soft skills such as {{softSkills}}. This balanced skill set enables effective collaboration, problem-solving, communication, and adaptability in both academic and project-driven environments.

                {{name}} has earned certifications including {{certifications}}, showcasing a commitment to continuous learning and professional growth. Additionally, achievements such as {{achievements}} highlight {{name}}'s ability to deliver results, take initiative, and excel in competitive or challenging situations.

                {{#hasInternship}}
                Real-world exposure through internships like {{internshipDetails}} has further empowered {{name}} with hands-on experience, practical understanding of industry expectations, and enhanced confidence in applying theoretical knowledge.
                {{/hasInternship}}

                {{#hasExperience}}
                Beyond academics, {{name}} has gained meaningful experience in {{experienceDetails}}, contributing to broader insights into professional workflows, project execution, and team communication.
                {{/hasExperience}}

                Driven, focused, and ready to embrace new opportunities, {{name}} aims to apply these skills in impactful real-world roles while continuing to grow personally and professionally.

                For communication or collaborations, {{name}} can be reached at {{email}}.
                LinkedIn: {{linkedin}}
                Date of Birth: {{dob}}
                """;
    }

    private String executiveTemplate() {
        return """
                My name is {{name}}, a results-driven and ambitious student currently pursuing a {{currentDegree}} in {{branch}} at {{institute}}. As a {{yearOfStudy}} year student, I have consistently demonstrated excellence in academics and practical learning. I hold certifications in {{certifications}}, which have strengthened my technical foundation and problem-solving capabilities. Recognized for {{achievements}}, I continue to seek opportunities to expand my expertise and make meaningful contributions. My core technical skills include {{technicalSkills}}, complemented by strong interpersonal and organizational abilities such as {{softSkills}}.{{internshipDetails}}{{experienceDetails}} I am eager to collaborate in dynamic environments where innovation meets execution. For any professional inquiries, please contact me at {{email}} or connect with me on LinkedIn: {{linkedin}}. Date of Birth: {{dob}}.
                """;
    }

    private String professionalProfileTemplate() {
        return """
                {{name}} is a dedicated and accomplished student currently pursuing a {{currentDegree}} degree with a specialization in {{branch}} at {{institute}}. Presently in my {{yearOfStudy}} year of academic tenure, I have demonstrated exceptional commitment to professional development through the successful completion of distinguished certifications including {{certifications}}. Throughout my educational journey, I have achieved notable recognition for {{achievements}}, which underscores my unwavering dedication to excellence. My technical proficiencies encompass {{technicalSkills}}, complemented by refined soft skills such as {{softSkills}}, which collectively position me as a well-rounded professional.{{internshipDetails}}{{experienceDetails}} For professional correspondence, I can be reached at {{email}}, and I invite you to explore my comprehensive professional profile at {{linkedin}}. Date of Birth: {{dob}}.
                """;
    }

    private String professionalProfileCss() {
        return """
                /* Professional Profile Template Container */
                .profile-container {
                  max-width: 1000px;
                  margin: 40px auto;
                  padding: 20px;
                  font-family: 'Inter', 'Poppins', sans-serif;
                  color: #1a1a1a;
                }

                /* Profile Card */
                .profile-card {
                  background: #ffffff;
                  border-radius: 0;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                  padding: 0;
                  line-height: 1.8;
                  font-size: 1rem;
                  position: relative;
                  overflow: hidden;
                }

                /* Professional Profile Layout */
                .professional-profile-layout {
                  display: flex;
                  min-height: 500px;
                }

                /* Left Content Section */
                .professional-profile-content {
                  flex: 1;
                  padding: 40px;
                }

                /* Right Sidebar with Image */
                .professional-profile-sidebar {
                  width: 350px;
                  background: #8B4513;
                  color: white;
                  padding: 40px 30px;
                  display: flex;
                  flex-direction: column;
                  position: relative;
                }

                /* Professional Profile Title */
                .professional-profile-title {
                  font-size: 1.2rem;
                  font-weight: 600;
                  margin-bottom: 30px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }

                /* Profile Image Container */
                .professional-profile-image {
                  width: 200px;
                  height: 200px;
                  border-radius: 50%;
                  object-fit: cover;
                  border: 4px solid white;
                  margin: 0 auto 30px;
                  display: block;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }

                /* Name in Sidebar */
                .professional-profile-name {
                  font-size: 2rem;
                  font-weight: bold;
                  margin-bottom: 10px;
                  text-align: center;
                  line-height: 1.2;
                }

                /* Title/Position in Sidebar */
                .professional-profile-position {
                  font-size: 1.1rem;
                  font-style: italic;
                  text-align: center;
                  margin-bottom: 40px;
                  opacity: 0.95;
                }

                /* Summary Section */
                .professional-profile-summary {
                  margin-bottom: 40px;
                  font-size: 1rem;
                  line-height: 1.8;
                  text-align: justify;
                  color: #333;
                }

                /* Section Headers */
                .professional-profile-section {
                  margin-bottom: 30px;
                }

                .professional-profile-section-title {
                  font-size: 1.4rem;
                  font-weight: 700;
                  color: #2c3e50;
                  margin-bottom: 15px;
                  padding-bottom: 8px;
                  border-bottom: 2px solid #8B4513;
                }

                /* Section Content */
                .professional-profile-section-content {
                  font-size: 1rem;
                  line-height: 1.8;
                  color: #444;
                }

                .professional-profile-section-content ul {
                  list-style-type: disc;
                  padding-left: 20px;
                  margin-top: 10px;
                }

                .professional-profile-section-content li {
                  margin-bottom: 8px;
                }

                /* Title styling */
                .profile-container h2 {
                  font-size: 2rem;
                  font-weight: 700;
                  color: #222;
                  margin-bottom: 24px;
                  text-align: center;
                  letter-spacing: 0.5px;
                }

                /* Buttons section */
                .profile-actions {
                  margin-top: 30px;
                  display: flex;
                  justify-content: center;
                  gap: 20px;
                  flex-wrap: wrap;
                }

                /* Common button style */
                .profile-btn {
                  padding: 12px 20px;
                  border: none;
                  border-radius: 8px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  font-size: 0.95rem;
                }

                /* Specific buttons */
                .btn-pdf {
                  background-color: #2563eb;
                  color: white;
                }

                .btn-edit {
                  background-color: #374151;
                  color: white;
                }

                /* Hover effects */
                .profile-btn:hover {
                  transform: translateY(-2px);
                  opacity: 0.9;
                }

                /* Responsive */
                @media (max-width: 768px) {
                  .professional-profile-layout {
                    flex-direction: column;
                  }
                  .professional-profile-sidebar {
                    width: 100%;
                    padding: 30px 20px;
                  }
                  .professional-profile-content {
                    padding: 30px 20px;
                  }
                  .professional-profile-image {
                    width: 150px;
                    height: 150px;
                  }
                }
                """;
    }

    private String designerPortraitTemplate() {
        return """
                Welcome! I am {{name}}, currently pursuing a {{currentDegree}} focused on {{branch}} at {{institute}}. In my {{yearOfStudy}} year, I balance research-driven learning with hands-on studio projects to translate ideas into elegant, functional outcomes. My creative toolkit spans {{technicalSkills}} while I rely on strengths such as {{softSkills}} to guide collaborations from concept to delivery. Recent highlights include {{achievements}} and certifications like {{certifications}} that keep me curious and industry-ready.{{professionalInternshipSentence}}{{professionalExperienceSentence}} Let’s connect via {{email}} or {{phone}} to explore new projects together.
                """;
    }

    private String designerPortraitCss() {
        return """
                .profile-container {
                  max-width: 960px;
                  margin: 40px auto;
                  padding: 24px;
                  background: #f3f4fb;
                  font-family: 'Playfair Display', 'Inter', serif;
                  color: #1e1e1e;
                }

                .profile-card {
                  background: #f6f4ec;
                  border-radius: 18px;
                  padding: 48px;
                  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.08);
                  border: 1px solid rgba(0, 0, 0, 0.05);
                }

                .portrait-template-card {
                  display: grid;
                  grid-template-columns: 1.35fr 0.85fr;
                  gap: 48px;
                }

                .portrait-left-panel {
                  display: flex;
                  flex-direction: column;
                  gap: 28px;
                  color: #2f2f2f;
                }

                .portrait-name-stack {
                  font-size: clamp(2.6rem, 4vw, 3.6rem);
                  letter-spacing: 0.12rem;
                  text-transform: uppercase;
                  font-weight: 600;
                  line-height: 1.1;
                  color: #2c2c2c;
                }

                .portrait-tagline {
                  font-size: 1rem;
                  letter-spacing: 0.25rem;
                  text-transform: uppercase;
                  color: #8c8b83;
                }

                .portrait-summary-block {
                  font-size: 1rem;
                  line-height: 1.9;
                  color: #4c4c4c;
                }

                .portrait-summary-block p {
                  margin-bottom: 1rem;
                }

                .portrait-section {
                  display: flex;
                  flex-direction: column;
                  gap: 0.5rem;
                }

                .portrait-section h4 {
                  font-size: 1rem;
                  letter-spacing: 0.3rem;
                  text-transform: uppercase;
                  color: #7b7a70;
                  margin-bottom: 0.4rem;
                }

                .portrait-contact-panel {
                  background: #2f2f2f;
                  color: #fff;
                  border-radius: 12px;
                  padding: 28px;
                  margin-top: 8px;
                }

                .portrait-contact-panel h4 {
                  color: rgba(255, 255, 255, 0.85);
                  letter-spacing: 0.4rem;
                }

                .portrait-contact-list {
                  margin-top: 16px;
                  display: grid;
                  gap: 10px;
                  font-size: 0.95rem;
                  letter-spacing: 0.05rem;
                }

                .portrait-contact-list span {
                  display: block;
                  color: rgba(255, 255, 255, 0.75);
                  font-size: 0.8rem;
                }

                .portrait-right-panel {
                  background: #fdfdfb;
                  padding: 32px;
                  border-radius: 16px;
                  display: flex;
                  flex-direction: column;
                  gap: 32px;
                  border: 1px solid rgba(0, 0, 0, 0.05);
                }

                .portrait-photo-wrap {
                  width: 100%;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 20px 30px rgba(0, 0, 0, 0.12);
                }

                .portrait-photo-wrap img {
                  width: 100%;
                  height: auto;
                  display: block;
                  object-fit: cover;
                }

                .portrait-right-section h4 {
                  font-size: 0.95rem;
                  letter-spacing: 0.3rem;
                  text-transform: uppercase;
                  color: #7b7a70;
                  margin-bottom: 0.4rem;
                }

                .portrait-right-section p {
                  font-size: 0.95rem;
                  line-height: 1.8;
                  color: #4a4a4a;
                }

                @media (max-width: 900px) {
                  .portrait-template-card {
                    grid-template-columns: 1fr;
                  }
                  .portrait-right-panel {
                    order: -1;
                  }
                }
                """;
    }
}



