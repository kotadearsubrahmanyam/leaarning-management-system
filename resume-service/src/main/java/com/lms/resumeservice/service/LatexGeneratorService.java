package com.lms.resumeservice.service;

import com.lms.resumeservice.model.Resume;
import com.lms.resumeservice.model.DataClasses.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LatexGeneratorService {

    public String generateLatex(Resume resume) {
        String templateId = resume.getTemplateId();
        if (templateId == null) {
            templateId = "ats";
        }

        String template = getTemplateSource(templateId);

        // Escape standard info fields
        template = template.replace("{{FULL_NAME}}", escape(resume.getFullName()));
        template = template.replace("{{EMAIL}}", escape(resume.getEmail()));
        template = template.replace("{{PHONE}}", escape(resume.getPhone()));
        template = template.replace("{{ADDRESS}}", escape(resume.getAddress()));
        template = template.replace("{{LINKEDIN}}", escape(resume.getLinkedinUrl()));
        template = template.replace("{{GITHUB}}", escape(resume.getGithubUrl()));
        template = template.replace("{{PORTFOLIO}}", escape(resume.getPortfolioUrl()));
        template = template.replace("{{SUMMARY}}", escape(resume.getProfessionalSummary()));

        // Render dynamic sections
        template = template.replace("{{EDUCATION}}", renderEducation(resume.getEducation()));
        template = template.replace("{{SKILLS}}", renderSkills(resume.getSkills()));
        template = template.replace("{{EXPERIENCE}}", renderExperience(resume.getExperience()));
        template = template.replace("{{PROJECTS}}", renderProjects(resume.getProjects()));
        template = template.replace("{{CERTIFICATIONS}}", renderList(resume.getCertifications()));
        template = template.replace("{{ACHIEVEMENTS}}", renderList(resume.getAchievements()));
        template = template.replace("{{LANGUAGES}}", renderLanguages(resume.getLanguages()));
        template = template.replace("{{INTERESTS}}", renderList(resume.getInterests()));

        return template;
    }

    private String escape(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\textbackslash{}")
                   .replace("&", "\\&")
                   .replace("%", "\\%")
                   .replace("$", "\\$")
                   .replace("#", "\\#")
                   .replace("_", "\\_")
                   .replace("{", "\\{")
                   .replace("}", "\\}")
                   .replace("~", "\\textasciitilde{}")
                   .replace("^", "\\textasciicircum{}");
    }

    private String renderEducation(List<EducationData> educationList) {
        if (educationList == null || educationList.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (EducationData edu : educationList) {
            sb.append(String.format(
                "\\noindent \\textbf{%s} \\hfill %s -- %s \\\\\n" +
                "\\textit{%s, %s} \\hfill CGPA/Percentage: %s \\\\\n" +
                "\\vspace{4pt}\n",
                escape(edu.getDegree()),
                escape(edu.getStartYear()),
                escape(edu.getEndYear()),
                escape(edu.getInstitution()),
                escape(edu.getUniversity()),
                escape(edu.getCgpa())
            ));
        }
        return sb.toString();
    }

    private String renderSkills(SkillsData skills) {
        if (skills == null) return "";
        StringBuilder sb = new StringBuilder();
        
        appendSkillLine(sb, "Programming Languages", skills.getLanguages());
        appendSkillLine(sb, "Frontend Development", skills.getFrontend());
        appendSkillLine(sb, "Backend Development", skills.getBackend());
        appendSkillLine(sb, "Databases", skills.getDatabases());
        appendSkillLine(sb, "Cloud Technologies", skills.getCloud());
        appendSkillLine(sb, "DevOps", skills.getDevops());
        appendSkillLine(sb, "Artificial Intelligence \\& Machine Learning", skills.getAiMl());
        appendSkillLine(sb, "Mobile Development", skills.getMobile());
        appendSkillLine(sb, "Cyber Security", skills.getSecurity());
        appendSkillLine(sb, "Tools \\& Platforms", skills.getTools());
        appendSkillLine(sb, "Soft Skills", skills.getSoftSkills());

        return sb.toString();
    }

    private void appendSkillLine(StringBuilder sb, String category, List<String> list) {
        if (list != null && !list.isEmpty()) {
            String joined = list.stream().map(this::escape).collect(Collectors.joining(", "));
            sb.append(String.format("\\textbf{%s:} %s \\\\\n", category, joined));
        }
    }

    private String renderExperience(List<ExperienceData> experienceList) {
        if (experienceList == null || experienceList.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (ExperienceData exp : experienceList) {
            sb.append(String.format(
                "\\noindent \\textbf{%s} \\hfill %s -- %s \\\\\n" +
                "\\textit{%s} \\\\\n",
                escape(exp.getRole()),
                escape(exp.getStartDate()),
                escape(exp.getEndDate()),
                escape(exp.getCompanyName())
            ));

            if (exp.getResponsibilities() != null && !exp.getResponsibilities().isEmpty()) {
                sb.append("\\begin{itemize}[noitemsep,topsep=2pt,parsep=0pt,partopsep=0pt,leftmargin=*]\n");
                for (String resp : exp.getResponsibilities()) {
                    if (resp != null && !resp.trim().isEmpty()) {
                        sb.append(String.format("    \\item %s\n", escape(resp)));
                    }
                }
                sb.append("\\end{itemize}\n");
            }
            sb.append("\\vspace{6pt}\n");
        }
        return sb.toString();
    }

    private String renderProjects(List<ProjectData> projectList) {
        if (projectList == null || projectList.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (ProjectData proj : projectList) {
            String titleLine = "\\noindent \\textbf{" + escape(proj.getProjectTitle()) + "}";
            
            // Build Links
            String gitLink = proj.getGithubLink();
            String demoLink = proj.getLiveDemoLink();
            boolean hasGit = gitLink != null && !gitLink.trim().isEmpty();
            boolean hasDemo = demoLink != null && !demoLink.trim().isEmpty();
            
            if (hasGit || hasDemo) {
                titleLine += " \\hfill ";
                if (hasGit) {
                    titleLine += String.format("\\href{%s}{\\small GitHub}", escape(gitLink));
                }
                if (hasGit && hasDemo) {
                    titleLine += " | ";
                }
                if (hasDemo) {
                    titleLine += String.format("\\href{%s}{\\small Live Demo}", escape(demoLink));
                }
            }
            titleLine += " \\\\\n";
            sb.append(titleLine);

            if (proj.getTechnologiesUsed() != null && !proj.getTechnologiesUsed().isEmpty()) {
                String techs = proj.getTechnologiesUsed().stream().map(this::escape).collect(Collectors.joining(", "));
                sb.append(String.format("\\textit{Technologies: %s} \\\\\n", techs));
            }

            if (proj.getDescription() != null && !proj.getDescription().trim().isEmpty()) {
                sb.append(escape(proj.getDescription())).append("\\\\\n");
            }
            sb.append("\\vspace{6pt}\n");
        }
        return sb.toString();
    }

    private String renderList(List<String> items) {
        if (items == null || items.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        sb.append("\\begin{itemize}[noitemsep,topsep=2pt,parsep=0pt,partopsep=0pt,leftmargin=*]\n");
        for (String item : items) {
            if (item != null && !item.trim().isEmpty()) {
                sb.append(String.format("    \\item %s\n", escape(item)));
            }
        }
        sb.append("\\end{itemize}\n");
        return sb.toString();
    }

    private String renderLanguages(List<String> items) {
        if (items == null || items.isEmpty()) return "";
        String joined = items.stream().map(this::escape).collect(Collectors.joining(", "));
        return "\\noindent " + joined + "\n";
    }

    private String getTemplateSource(String templateId) {
        switch (templateId.toLowerCase()) {
            case "modern":
                return getModernTemplate();
            case "academic":
                return getAcademicTemplate();
            case "software_engineer":
            case "se":
                return getSoftwareEngineerTemplate();
            case "ats":
            default:
                return getAtsTemplate();
        }
    }

    private String getAtsTemplate() {
        return """
\\documentclass[10pt,a4paper]{article}
\\usepackage[a4paper,margin=0.6in]{geometry}
\\usepackage[hidelinks]{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{8pt}{4pt}
\\pagenumbering{gobble}

\\begin{document}

\\begin{center}
    {\\Huge \\textbf{{{FULL_NAME}}}}\\\\
    \\vspace{3pt}
    {{EMAIL}} | {{PHONE}} | {{ADDRESS}} \\\\
    \\vspace{2pt}
    \\href{{{LINKEDIN}}}{LinkedIn} | \\href{{{GITHUB}}}{GitHub} | \\href{{{PORTFOLIO}}}{Portfolio}
\\end{center}

\\vspace{4pt}

\\section*{Professional Summary}
{{SUMMARY}}

\\section*{Technical Skills}
{{SKILLS}}

\\section*{Projects}
{{PROJECTS}}

\\section*{Experience}
{{EXPERIENCE}}

\\section*{Certifications}
{{CERTIFICATIONS}}

\\section*{Achievements}
{{ACHIEVEMENTS}}

\\section*{Languages Known}
{{LANGUAGES}}

\\section*{Education}
{{EDUCATION}}

\\end{document}
""";
    }

    private String getModernTemplate() {
        return """
\\documentclass[10pt,a4paper]{article}
\\usepackage[a4paper,margin=0.6in]{geometry}
\\usepackage[hidelinks]{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}

\\definecolor{primary}{HTML}{6D28D9}
\\definecolor{darkgray}{HTML}{333333}

\\titleformat{\\section}{\\large\\bfseries\\color{primary}}{}{0em}{}[\\color{primary}\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{5pt}
\\pagenumbering{gobble}

\\begin{document}

\\begin{center}
    {\\Huge \\textbf{\\color{primary} {{FULL_NAME}}}}\\\\
    \\vspace{4pt}
    \\textcolor{darkgray}{{{EMAIL}} | {{PHONE}} | {{ADDRESS}}} \\\\
    \\vspace{2pt}
    \\href{{{LINKEDIN}}}{LinkedIn} | \\href{{{GITHUB}}}{GitHub} | \\href{{{PORTFOLIO}}}{Portfolio}
\\end{center}

\\vspace{6pt}

\\section*{Professional Summary}
{{SUMMARY}}

\\section*{Technical Skills}
{{SKILLS}}

\\section*{Projects}
{{PROJECTS}}

\\section*{Experience}
{{EXPERIENCE}}

\\section*{Certifications}
{{CERTIFICATIONS}}

\\section*{Achievements}
{{ACHIEVEMENTS}}

\\section*{Education}
{{EDUCATION}}

\\end{document}
""";
    }

    private String getAcademicTemplate() {
        return """
\\documentclass[11pt,a4paper]{article}
\\usepackage[a4paper,margin=0.75in]{geometry}
\\usepackage[hidelinks]{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}

\\titleformat{\\section}{\\large\\scshape\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{6pt}

\\begin{document}

\\begin{center}
    {\\Huge \\textsc{\\textbf{{{FULL_NAME}}}}}\\\\
    \\vspace{5pt}
    Academic Curriculum Vitae\\\\
    \\vspace{3pt}
    {{EMAIL}} | {{PHONE}} | {{ADDRESS}} \\\\
    \\href{{{LINKEDIN}}}{LinkedIn} | \\href{{{GITHUB}}}{GitHub} | \\href{{{PORTFOLIO}}}{Portfolio}
\\end{center}

\\vspace{8pt}

\\section*{Research interests \\& Summary}
{{SUMMARY}}

\\section*{Technical Skills}
{{SKILLS}}

\\section*{Academic Projects}
{{PROJECTS}}

\\section*{Research \\& Work Experience}
{{EXPERIENCE}}

\\section*{Certifications}
{{CERTIFICATIONS}}

\\section*{Honors, Awards \\& Achievements}
{{ACHIEVEMENTS}}

\\section*{Languages}
{{LANGUAGES}}

\\section*{Interests \\& Hobbies}
{{INTERESTS}}

\\section*{Education}
{{EDUCATION}}

\\end{document}
""";
    }

    private String getSoftwareEngineerTemplate() {
        return """
\\documentclass[10pt,a4paper]{article}
\\usepackage[a4paper,margin=0.5in]{geometry}
\\usepackage[hidelinks]{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{8pt}{3pt}
\\pagenumbering{gobble}

\\begin{document}

\\begin{center}
    {\\Huge \\textbf{{{FULL_NAME}}}}\\\\
    \\vspace{3pt}
    \\small {{EMAIL}} \\ | \\ {{PHONE}} \\ | \\ {{ADDRESS}} \\\\
    \\href{{{LINKEDIN}}}{linkedin.com/in/{{LINKEDIN}}} \\ | \\ \\href{{{GITHUB}}}{github.com/{{GITHUB}}} \\ | \\ \\href{{{PORTFOLIO}}}{portfolio}
\\end{center}

\\vspace{2pt}

\\section*{Technical Skills}
{{SKILLS}}

\\section*{Projects}
{{PROJECTS}}

\\section*{Experience}
{{EXPERIENCE}}

\\section*{Certifications \\& Achievements}
{{CERTIFICATIONS}}
{{ACHIEVEMENTS}}

\\section*{Education}
{{EDUCATION}}

\\end{document}
""";
    }
}
