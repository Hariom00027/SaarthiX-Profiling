package com.profiling.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonFormat;

@Document(collection = "profiles")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Profile {

    @Id
    private String id; // MongoDB will auto-generate ObjectId if null

    private String userId; // User who owns this profile

    private String name;
    private String email;
    private String phone;
    private String dob;
    private String linkedin;
    private String institute;
    private String currentDegree;
    private String branch;
    private String yearOfStudy;
    private String certifications;
    private String achievements;
    private String technicalSkills;
    private String softSkills;
    private String hobbies;
    private String interests;
    private String templateType; // professional, bio, story, cover
    private Boolean hasInternship;
    private String internshipDetails;
    private Boolean hasExperience;
    private String experienceDetails;
    private String workExperience; // Work experience details from experience level step
    private String designation; // Job title/designation from experience form
    private String yearsOfExperience; // Years of experience from experience form
    private String yearOfJoining; // Year of joining from experience form

    // Additional fields for cover letter template
    private String hiringManagerName;
    private String companyName;
    private String companyAddress;
    private String positionTitle;
    private String relevantExperience;
    private String keyAchievement;
    private String strengths;
    private String closingNote;
    private String profileImage; // Base64 encoded image or image URL
    private String aiEnhancedTemplateText;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private java.time.LocalDateTime createdAt; // Timestamp for sorting profiles

    // Default constructor
    public Profile() {
        // createdAt will be set when profile is saved if not already set
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    public String getLinkedin() {
        return linkedin;
    }

    public void setLinkedin(String linkedin) {
        this.linkedin = linkedin;
    }

    public String getInstitute() {
        return institute;
    }

    public void setInstitute(String institute) {
        this.institute = institute;
    }

    public String getCurrentDegree() {
        return currentDegree;
    }

    public void setCurrentDegree(String currentDegree) {
        this.currentDegree = currentDegree;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public String getYearOfStudy() {
        return yearOfStudy;
    }

    public void setYearOfStudy(String yearOfStudy) {
        this.yearOfStudy = yearOfStudy;
    }

    public String getCertifications() {
        return certifications;
    }

    public void setCertifications(String certifications) {
        this.certifications = certifications;
    }

    public String getAchievements() {
        return achievements;
    }

    public void setAchievements(String achievements) {
        this.achievements = achievements;
    }

    public String getTechnicalSkills() {
        return technicalSkills;
    }

    public void setTechnicalSkills(String technicalSkills) {
        this.technicalSkills = technicalSkills;
    }

    public String getSoftSkills() {
        return softSkills;
    }

    public void setSoftSkills(String softSkills) {
        this.softSkills = softSkills;
    }

    public String getHobbies() {
        return hobbies;
    }

    public void setHobbies(String hobbies) {
        this.hobbies = hobbies;
    }

    public String getInterests() {
        return interests;
    }

    public void setInterests(String interests) {
        this.interests = interests;
    }

    public String getTemplateType() {
        return templateType;
    }

    public void setTemplateType(String templateType) {
        this.templateType = templateType;
    }

    public Boolean getHasInternship() {
        return hasInternship;
    }

    public void setHasInternship(Boolean hasInternship) {
        this.hasInternship = hasInternship;
    }

    public String getInternshipDetails() {
        return internshipDetails;
    }

    public void setInternshipDetails(String internshipDetails) {
        this.internshipDetails = internshipDetails;
    }

    public Boolean getHasExperience() {
        return hasExperience;
    }

    public void setHasExperience(Boolean hasExperience) {
        this.hasExperience = hasExperience;
    }

    public String getExperienceDetails() {
        return experienceDetails;
    }

    public void setExperienceDetails(String experienceDetails) {
        this.experienceDetails = experienceDetails;
    }

    public String getWorkExperience() {
        return workExperience;
    }

    public void setWorkExperience(String workExperience) {
        this.workExperience = workExperience;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getYearsOfExperience() {
        return yearsOfExperience;
    }

    public void setYearsOfExperience(String yearsOfExperience) {
        this.yearsOfExperience = yearsOfExperience;
    }

    public String getYearOfJoining() {
        return yearOfJoining;
    }

    public void setYearOfJoining(String yearOfJoining) {
        this.yearOfJoining = yearOfJoining;
    }

    public String getHiringManagerName() {
        return hiringManagerName;
    }

    public void setHiringManagerName(String hiringManagerName) {
        this.hiringManagerName = hiringManagerName;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyAddress() {
        return companyAddress;
    }

    public void setCompanyAddress(String companyAddress) {
        this.companyAddress = companyAddress;
    }

    public String getPositionTitle() {
        return positionTitle;
    }

    public void setPositionTitle(String positionTitle) {
        this.positionTitle = positionTitle;
    }

    public String getRelevantExperience() {
        return relevantExperience;
    }

    public void setRelevantExperience(String relevantExperience) {
        this.relevantExperience = relevantExperience;
    }

    public String getKeyAchievement() {
        return keyAchievement;
    }

    public void setKeyAchievement(String keyAchievement) {
        this.keyAchievement = keyAchievement;
    }

    public String getStrengths() {
        return strengths;
    }

    public void setStrengths(String strengths) {
        this.strengths = strengths;
    }

    public String getClosingNote() {
        return closingNote;
    }

    public void setClosingNote(String closingNote) {
        this.closingNote = closingNote;
    }

    public String getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    public String getAiEnhancedTemplateText() {
        return aiEnhancedTemplateText;
    }

    public void setAiEnhancedTemplateText(String aiEnhancedTemplateText) {
        this.aiEnhancedTemplateText = aiEnhancedTemplateText;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

