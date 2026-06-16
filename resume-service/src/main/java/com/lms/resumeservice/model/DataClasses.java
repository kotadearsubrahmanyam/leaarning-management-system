package com.lms.resumeservice.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class DataClasses {

    public static class EducationData implements Serializable {
        private static final long serialVersionUID = 1L;
        
        private String degree;
        private String institution;
        private String university;
        private String cgpa;
        private String startYear;
        private String endYear;

        // Constructors
        public EducationData() {}

        public EducationData(String degree, String institution, String university, String cgpa, String startYear, String endYear) {
            this.degree = degree;
            this.institution = institution;
            this.university = university;
            this.cgpa = cgpa;
            this.startYear = startYear;
            this.endYear = endYear;
        }

        // Getters and Setters
        public String getDegree() { return degree; }
        public void setDegree(String degree) { this.degree = degree; }

        public String getInstitution() { return institution; }
        public void setInstitution(String institution) { this.institution = institution; }

        public String getUniversity() { return university; }
        public void setUniversity(String university) { this.university = university; }

        public String getCgpa() { return cgpa; }
        public void setCgpa(String cgpa) { this.cgpa = cgpa; }

        public String getStartYear() { return startYear; }
        public void setStartYear(String startYear) { this.startYear = startYear; }

        public String getEndYear() { return endYear; }
        public void setEndYear(String endYear) { this.endYear = endYear; }
    }

    public static class ExperienceData implements Serializable {
        private static final long serialVersionUID = 1L;

        private String companyName;
        private String role;
        private String startDate;
        private String endDate;
        private List<String> responsibilities = new ArrayList<>();

        // Constructors
        public ExperienceData() {}

        public ExperienceData(String companyName, String role, String startDate, String endDate, List<String> responsibilities) {
            this.companyName = companyName;
            this.role = role;
            this.startDate = startDate;
            this.endDate = endDate;
            this.responsibilities = responsibilities;
        }

        // Getters and Setters
        public String getCompanyName() { return companyName; }
        public void setCompanyName(String companyName) { this.companyName = companyName; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }

        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }

        public List<String> getResponsibilities() { return responsibilities; }
        public void setResponsibilities(List<String> responsibilities) { this.responsibilities = responsibilities; }
    }

    public static class ProjectData implements Serializable {
        private static final long serialVersionUID = 1L;

        private String projectTitle;
        private String description;
        private List<String> technologiesUsed = new ArrayList<>();
        private String githubLink;
        private String liveDemoLink;

        // Constructors
        public ProjectData() {}

        public ProjectData(String projectTitle, String description, List<String> technologiesUsed, String githubLink, String liveDemoLink) {
            this.projectTitle = projectTitle;
            this.description = description;
            this.technologiesUsed = technologiesUsed;
            this.githubLink = githubLink;
            this.liveDemoLink = liveDemoLink;
        }

        // Getters and Setters
        public String getProjectTitle() { return projectTitle; }
        public void setProjectTitle(String projectTitle) { this.projectTitle = projectTitle; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public List<String> getTechnologiesUsed() { return technologiesUsed; }
        public void setTechnologiesUsed(List<String> technologiesUsed) { this.technologiesUsed = technologiesUsed; }

        public String getGithubLink() { return githubLink; }
        public void setGithubLink(String githubLink) { this.githubLink = githubLink; }

        public String getLiveDemoLink() { return liveDemoLink; }
        public void setLiveDemoLink(String liveDemoLink) { this.liveDemoLink = liveDemoLink; }
    }

    public static class SkillsData implements Serializable {
        private static final long serialVersionUID = 1L;

        private List<String> languages = new ArrayList<>();
        private List<String> frontend = new ArrayList<>();
        private List<String> backend = new ArrayList<>();
        private List<String> databases = new ArrayList<>();
        private List<String> cloud = new ArrayList<>();
        private List<String> devops = new ArrayList<>();
        private List<String> aiMl = new ArrayList<>();
        private List<String> mobile = new ArrayList<>();
        private List<String> security = new ArrayList<>();
        private List<String> tools = new ArrayList<>();
        private List<String> softSkills = new ArrayList<>();

        // Constructors
        public SkillsData() {}

        public SkillsData(List<String> languages, List<String> frontend, List<String> backend, 
                          List<String> databases, List<String> cloud, List<String> devops, 
                          List<String> aiMl, List<String> mobile, List<String> security, 
                          List<String> tools, List<String> softSkills) {
            this.languages = languages;
            this.frontend = frontend;
            this.backend = backend;
            this.databases = databases;
            this.cloud = cloud;
            this.devops = devops;
            this.aiMl = aiMl;
            this.mobile = mobile;
            this.security = security;
            this.tools = tools;
            this.softSkills = softSkills;
        }

        // Getters and Setters
        public List<String> getLanguages() { return languages; }
        public void setLanguages(List<String> languages) { this.languages = languages; }

        public List<String> getFrontend() { return frontend; }
        public void setFrontend(List<String> frontend) { this.frontend = frontend; }

        public List<String> getBackend() { return backend; }
        public void setBackend(List<String> backend) { this.backend = backend; }

        public List<String> getDatabases() { return databases; }
        public void setDatabases(List<String> databases) { this.databases = databases; }

        public List<String> getCloud() { return cloud; }
        public void setCloud(List<String> cloud) { this.cloud = cloud; }

        public List<String> getDevops() { return devops; }
        public void setDevops(List<String> devops) { this.devops = devops; }

        public List<String> getAiMl() { return aiMl; }
        public void setAiMl(List<String> aiMl) { this.aiMl = aiMl; }

        public List<String> getMobile() { return mobile; }
        public void setMobile(List<String> mobile) { this.mobile = mobile; }

        public List<String> getSecurity() { return security; }
        public void setSecurity(List<String> security) { this.security = security; }

        public List<String> getTools() { return tools; }
        public void setTools(List<String> tools) { this.tools = tools; }

        public List<String> getSoftSkills() { return softSkills; }
        public void setSoftSkills(List<String> softSkills) { this.softSkills = softSkills; }
    }
}
