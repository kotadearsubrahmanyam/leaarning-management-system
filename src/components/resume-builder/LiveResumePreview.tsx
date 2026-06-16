"use client";

import React, { useState, useEffect, useRef } from "react";

interface Education {
  degree: string;
  institution: string;
  university: string;
  cgpa: string;
  startYear: string;
  endYear: string;
}

interface Experience {
  companyName: string;
  role: string;
  startDate: string;
  endDate: string;
  responsibilities: string[];
}

interface Project {
  projectTitle: string;
  description: string;
  technologiesUsed: string[];
  githubLink: string;
  liveDemoLink: string;
}

interface Skills {
  languages: string[];
  frontend: string[];
  backend: string[];
  databases: string[];
  cloud: string[];
  devops: string[];
  aiMl: string[];
  mobile: string[];
  security: string[];
  tools: string[];
  softSkills: string[];
}

interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  professionalSummary: string;
  templateId: string;
  skills: Skills;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: string[];
  achievements: string[];
  languages: string[];
  interests: string[];
}

interface LiveResumePreviewProps {
  data: ResumeData;
}

export function LiveResumePreview({ data }: LiveResumePreviewProps) {
  const {
    fullName = "Your Name",
    email = "email@example.com",
    phone = "+1 234 567 8900",
    address = "San Francisco, CA",
    linkedinUrl = "",
    githubUrl = "",
    portfolioUrl = "",
    professionalSummary = "Summary details...",
    templateId = "ats",
    skills = { 
      languages: [], 
      frontend: [], 
      backend: [], 
      databases: [], 
      cloud: [], 
      devops: [], 
      aiMl: [], 
      mobile: [], 
      security: [], 
      tools: [], 
      softSkills: [] 
    },
    education = [],
    experience = [],
    projects = [],
    certifications = [],
    achievements = [],
    languages = [],
    interests = []
  } = data;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Resize listener to automatically scale the A4 preview sheet (794px width) to fit containers
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.clientWidth;
        const targetWidth = 794; // Target A4 width in pixels
        if (parentWidth < targetWidth) {
          setScale(parentWidth / targetWidth);
        } else {
          setScale(1);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Trigger initial check
    
    // Simple timeout to capture accurate width after DOM mounts
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [data.templateId]);

  // Escape helpers to clean links in formatting
  const cleanLink = (url: string) => {
    if (!url) return "";
    return url.replace(/^https?:\/\/(www\.)?/, "");
  };

  // 1. ATS CLEAN TEMPLATE
  const renderAtsTemplate = () => {
    return (
      <div 
        className="bg-white text-black font-serif select-none h-full text-[10.5px] leading-normal" 
        style={{ padding: "0.6in" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-black mb-1">{fullName || "Your Name"}</h1>
          <div className="text-slate-700 text-xs flex justify-center flex-wrap gap-x-2">
            {email && <span>{email}</span>}
            {phone && <span>| {phone}</span>}
            {address && <span>| {address}</span>}
          </div>
          <div className="text-purple-700 text-xxs font-bold uppercase flex justify-center gap-3 mt-1.5">
            {linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>}
            {githubUrl && <a href={githubUrl} target="_blank" rel="noreferrer">GitHub</a>}
            {portfolioUrl && <a href={portfolioUrl} target="_blank" rel="noreferrer">Portfolio</a>}
          </div>
        </div>

        {/* Summary */}
        {professionalSummary && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 text-black">Professional Summary</h2>
            <p className="text-slate-700 text-[10.5px] leading-normal text-justify">{professionalSummary}</p>
          </div>
        )}

        {/* Skills */}
        {Object.values(skills).some(arr => arr?.length > 0) && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 text-black">Technical Skills</h2>
            <div className="space-y-1 text-slate-700">
              {skills.languages?.length > 0 && (
                <div><strong>Programming Languages:</strong> {skills.languages.join(", ")}</div>
              )}
              {skills.frontend?.length > 0 && (
                <div><strong>Frontend Development:</strong> {skills.frontend.join(", ")}</div>
              )}
              {skills.backend?.length > 0 && (
                <div><strong>Backend Development:</strong> {skills.backend.join(", ")}</div>
              )}
              {skills.databases?.length > 0 && (
                <div><strong>Databases:</strong> {skills.databases.join(", ")}</div>
              )}
              {skills.cloud?.length > 0 && (
                <div><strong>Cloud Technologies:</strong> {skills.cloud.join(", ")}</div>
              )}
              {skills.devops?.length > 0 && (
                <div><strong>DevOps:</strong> {skills.devops.join(", ")}</div>
              )}
              {skills.aiMl?.length > 0 && (
                <div><strong>AI \& Machine Learning:</strong> {skills.aiMl.join(", ")}</div>
              )}
              {skills.mobile?.length > 0 && (
                <div><strong>Mobile Development:</strong> {skills.mobile.join(", ")}</div>
              )}
              {skills.security?.length > 0 && (
                <div><strong>Cyber Security:</strong> {skills.security.join(", ")}</div>
              )}
              {skills.tools?.length > 0 && (
                <div><strong>Tools \& Platforms:</strong> {skills.tools.join(", ")}</div>
              )}
              {skills.softSkills?.length > 0 && (
                <div><strong>Soft Skills:</strong> {skills.softSkills.join(", ")}</div>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 text-black">Projects</h2>
            <div className="space-y-3">
              {projects.map((proj, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{proj.projectTitle || "Project Title"}</span>
                    <div className="flex gap-2 text-[10px] font-normal text-purple-700">
                      {proj.githubLink && <a href={proj.githubLink} target="_blank" rel="noreferrer">GitHub</a>}
                      {proj.liveDemoLink && <a href={proj.liveDemoLink} target="_blank" rel="noreferrer">Live Demo</a>}
                    </div>
                  </div>
                  {proj.technologiesUsed && proj.technologiesUsed.length > 0 && (
                    <div className="italic text-slate-500 text-[10px]">
                      Technologies: {proj.technologiesUsed.join(", ")}
                    </div>
                  )}
                  <p className="text-slate-700 mt-0.5">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 text-black">Work Experience</h2>
            <div className="space-y-3">
              {experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{exp.role || "Role"}</span>
                    <span>{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <div className="italic text-slate-600 font-medium">{exp.companyName || "Company"}</div>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-700">
                      {exp.responsibilities.map((resp, rIdx) => (
                        <li key={rIdx}>{resp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications & Achievements */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 text-black">Certifications</h2>
              <ul className="list-disc pl-5 text-slate-700 space-y-0.5">
                {certifications.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
          {achievements.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 text-black">Achievements</h2>
              <ul className="list-disc pl-5 text-slate-700 space-y-0.5">
                {achievements.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 text-black">Education</h2>
            <div className="space-y-2.5">
              {education.map((edu, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{edu.degree || "Degree"}</span>
                    <span>{edu.startYear} – {edu.endYear}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{edu.institution || "Institution"}, {edu.university}</span>
                    <span className="italic font-medium">CGPA/Marks: {edu.cgpa}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 2. MODERN PROFESSIONAL TEMPLATE
  const renderModernTemplate = () => {
    return (
      <div 
        className="bg-white text-[#2C3E50] font-sans select-none h-full text-[10.5px] leading-relaxed" 
        style={{ padding: "0.6in" }}
      >
        {/* Header */}
        <div className="border-l-4 border-purple-600 pl-4 py-1 mb-5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{fullName || "Your Name"}</h1>
          <p className="text-slate-500 font-bold text-xs mt-0.5">{address || "City, State"}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-400 mt-2 text-[10px]">
            {email && <span className="flex items-center gap-1 text-purple-600 font-bold">{email}</span>}
            {phone && <span>{phone}</span>}
            {linkedinUrl && <a href={linkedinUrl} className="hover:underline hover:text-purple-600">LinkedIn</a>}
            {githubUrl && <a href={githubUrl} className="hover:underline hover:text-purple-600">GitHub</a>}
          </div>
        </div>

        {/* Summary */}
        {professionalSummary && (
          <div className="mb-5 bg-purple-50/20 border border-purple-100 p-3 rounded-xl">
            <h2 className="text-[10px] font-black uppercase tracking-wider text-purple-700 mb-1">Executive Summary</h2>
            <p className="text-slate-700 leading-normal">{professionalSummary}</p>
          </div>
        )}

        {/* Skills */}
        {Object.values(skills).some(arr => arr.length > 0) && (
          <div className="mb-5">
            <h2 className="text-xs font-black uppercase text-purple-700 border-b-2 border-purple-100 pb-1 mb-3">Technical Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(skills).flatMap(([cat, arr]) => arr).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-150 rounded text-[9px] font-bold uppercase tracking-wider"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-black uppercase text-purple-700 border-b-2 border-purple-100 pb-1 mb-3">Projects</h2>
            <div className="space-y-3">
              {projects.map((proj, idx) => (
                <div key={idx}>
                  <h4 className="font-black text-slate-800">{proj.projectTitle}</h4>
                  {proj.technologiesUsed && proj.technologiesUsed.length > 0 && (
                    <span className="text-[9px] font-semibold text-purple-600 block mt-0.5">
                      {proj.technologiesUsed.join(" / ")}
                    </span>
                  )}
                  <p className="text-slate-600 text-[10px] mt-1 leading-snug">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-black uppercase text-purple-700 border-b-2 border-purple-100 pb-1 mb-3">Employment History</h2>
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div key={idx} className="relative pl-4 border-l border-slate-200">
                  <div className="absolute w-2 h-2 rounded-full bg-purple-500 -left-[4.5px] top-1.5" />
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-slate-800 text-[11px]">{exp.role || "Role"}</h3>
                    <span className="text-[10px] font-bold text-slate-400">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <div className="text-[10px] font-bold text-purple-600/80 mb-1">{exp.companyName}</div>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-600 leading-normal">
                      {exp.responsibilities.map((resp, rIdx) => (
                        <li key={rIdx}>{resp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications & Achievements */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          {certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-black uppercase text-purple-700 border-b-2 border-purple-100 pb-1 mb-3">Certifications</h2>
              <ul className="list-disc pl-4 text-slate-600 space-y-1 text-[10px] leading-relaxed">
                {certifications.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
          {achievements.length > 0 && (
            <div>
              <h2 className="text-xs font-black uppercase text-purple-700 border-b-2 border-purple-100 pb-1 mb-3">Achievements</h2>
              <ul className="list-disc pl-4 text-slate-600 space-y-1 text-[10px] leading-relaxed">
                {achievements.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-black uppercase text-purple-700 border-b-2 border-purple-100 pb-1 mb-3">Education</h2>
            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={idx}>
                  <h4 className="font-black text-slate-800">{edu.degree}</h4>
                  <p className="text-slate-500 font-bold">{edu.institution}</p>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>{edu.startYear} – {edu.endYear}</span>
                    <span className="italic font-bold text-purple-600/70">{edu.cgpa}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 3. ACADEMIC CV TEMPLATE
  const renderAcademicTemplate = () => {
    return (
      <div 
        className="bg-white text-[#1F2937] font-serif select-none h-full text-[10.5px] leading-relaxed" 
        style={{ padding: "0.75in" }}
      >
        {/* Title Block */}
        <div className="text-center mb-5">
          <h1 className="text-2xl font-light uppercase tracking-widest text-slate-900">{fullName}</h1>
          <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 mt-1">Academic Curriculum Vitae</p>
          <div className="h-[1px] w-20 bg-slate-300 mx-auto my-2.5" />
          <p className="text-slate-500 text-xs">
            {address} &middot; {phone} &middot; {email}
          </p>
          <div className="flex justify-center gap-3 text-purple-700 text-xxs font-bold tracking-wider mt-1.5 uppercase">
            {linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>}
            {githubUrl && <a href={githubUrl} target="_blank" rel="noreferrer">GitHub</a>}
          </div>
        </div>

        {/* Summary */}
        {professionalSummary && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2">Research Overview</h2>
            <p className="text-slate-700 text-justify italic">{professionalSummary}</p>
          </div>
        )}

        {/* Skills */}
        {Object.values(skills).some(arr => arr?.length > 0) && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2">Technical Skills</h2>
            <div className="space-y-1 text-slate-700 text-xs">
              {skills.languages?.length > 0 && (
                <div><strong>Programming Languages:</strong> {skills.languages.join(", ")}</div>
              )}
              {skills.frontend?.length > 0 && (
                <div><strong>Frontend Development:</strong> {skills.frontend.join(", ")}</div>
              )}
              {skills.backend?.length > 0 && (
                <div><strong>Backend Development:</strong> {skills.backend.join(", ")}</div>
              )}
              {skills.databases?.length > 0 && (
                <div><strong>Databases:</strong> {skills.databases.join(", ")}</div>
              )}
              {skills.cloud?.length > 0 && (
                <div><strong>Cloud Technologies:</strong> {skills.cloud.join(", ")}</div>
              )}
              {skills.devops?.length > 0 && (
                <div><strong>DevOps:</strong> {skills.devops.join(", ")}</div>
              )}
              {skills.aiMl?.length > 0 && (
                <div><strong>AI \& Machine Learning:</strong> {skills.aiMl.join(", ")}</div>
              )}
              {skills.mobile?.length > 0 && (
                <div><strong>Mobile Development:</strong> {skills.mobile.join(", ")}</div>
              )}
              {skills.security?.length > 0 && (
                <div><strong>Cyber Security:</strong> {skills.security.join(", ")}</div>
              )}
              {skills.tools?.length > 0 && (
                <div><strong>Tools \& Platforms:</strong> {skills.tools.join(", ")}</div>
              )}
              {skills.softSkills?.length > 0 && (
                <div><strong>Soft Skills:</strong> {skills.softSkills.join(", ")}</div>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2">Projects & Publications</h2>
            <div className="space-y-3">
              {projects.map((proj, idx) => (
                <div key={idx}>
                  <h3 className="font-bold text-slate-800">{proj.projectTitle}</h3>
                  {proj.technologiesUsed && proj.technologiesUsed.length > 0 && (
                    <p className="text-[10px] text-purple-700 font-semibold mb-1">Stack: {proj.technologiesUsed.join(", ")}</p>
                  )}
                  <p className="text-slate-600 text-justify">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2">Experience & Appointments</h2>
            <div className="space-y-3">
              {experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{exp.role}</span>
                    <span>{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <div className="text-xs italic text-slate-500 mb-1">{exp.companyName}</div>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="list-disc pl-5 text-slate-600 space-y-1 text-xs">
                      {exp.responsibilities.map((resp, rIdx) => (
                        <li key={rIdx}>{resp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications & Achievements */}
        <div className="grid grid-cols-2 gap-5 mb-4">
          {certifications.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2">Certifications</h2>
              <ul className="list-disc pl-5 text-slate-600 space-y-0.5 text-xs">
                {certifications.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
          {achievements.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2">Honors & Achievements</h2>
              <ul className="list-disc pl-5 text-slate-600 space-y-0.5 text-xs">
                {achievements.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Languages & Interests */}
        <div className="grid grid-cols-2 gap-5 mb-4">
          {languages.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2">Languages</h2>
              <p className="text-slate-600 text-xs">{languages.join(", ")}</p>
            </div>
          )}
          {interests.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2">Interests & Hobbies</h2>
              <ul className="list-disc pl-5 text-slate-600 space-y-0.5 text-xs">
                {interests.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2">Education</h2>
            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">{edu.degree}</h3>
                    <p className="text-slate-600 text-xs italic">{edu.institution}, {edu.university}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-bold block">{edu.startYear} – {edu.endYear}</span>
                    <span className="text-xs text-purple-700 font-bold">Marks: {edu.cgpa}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 4. SOFTWARE ENGINEER TEMPLATE
  const renderSoftwareEngineerTemplate = () => {
    return (
      <div 
        className="bg-white text-[#1E293B] font-mono select-none h-full text-[10px] leading-relaxed" 
        style={{ padding: "0.5in" }}
      >
        {/* Terminal Header */}
        <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 mb-5">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">&lt;{fullName || "Developer"}&gt;</h1>
          <p className="text-[10px] text-slate-500 mt-1">// {address} | {phone} | {email}</p>
          <div className="flex gap-3 text-purple-700 font-bold text-[10px] mt-2">
            {linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noreferrer">ln://{cleanLink(linkedinUrl)}</a>}
            {githubUrl && <a href={githubUrl} target="_blank" rel="noreferrer">gh://{cleanLink(githubUrl)}</a>}
          </div>
        </div>

        {/* Skills */}
        {Object.values(skills).some(arr => arr?.length > 0) && (
          <div className="mb-4">
            <h2 className="text-[10.5px] font-bold uppercase text-slate-900 bg-slate-200 px-2 py-0.5 rounded mb-2">0x01. Technical Skills Matrix</h2>
            <div className="space-y-1 pl-2 text-slate-700 text-xs">
              {skills.languages?.length > 0 && (
                <div><span className="text-purple-600 font-bold">Languages:</span> {skills.languages.join(", ")}</div>
              )}
              {skills.frontend?.length > 0 && (
                <div><span className="text-purple-600 font-bold">Frontend:</span> {skills.frontend.join(", ")}</div>
              )}
              {skills.backend?.length > 0 && (
                <div><span className="text-purple-600 font-bold">Backend:</span> {skills.backend.join(", ")}</div>
              )}
              {skills.databases?.length > 0 && (
                <div><span className="text-purple-600 font-bold">Databases:</span> {skills.databases.join(", ")}</div>
              )}
              {skills.cloud?.length > 0 && (
                <div><span className="text-purple-600 font-bold">Cloud:</span> {skills.cloud.join(", ")}</div>
              )}
              {skills.devops?.length > 0 && (
                <div><span className="text-purple-600 font-bold">DevOps:</span> {skills.devops.join(", ")}</div>
              )}
              {skills.aiMl?.length > 0 && (
                <div><span className="text-purple-600 font-bold">AI \& ML:</span> {skills.aiMl.join(", ")}</div>
              )}
              {skills.mobile?.length > 0 && (
                <div><span className="text-purple-600 font-bold">Mobile:</span> {skills.mobile.join(", ")}</div>
              )}
              {skills.security?.length > 0 && (
                <div><span className="text-purple-600 font-bold">Cyber Security:</span> {skills.security.join(", ")}</div>
              )}
              {skills.tools?.length > 0 && (
                <div><span className="text-purple-600 font-bold">Tools:</span> {skills.tools.join(", ")}</div>
              )}
              {skills.softSkills?.length > 0 && (
                <div><span className="text-purple-600 font-bold">Soft Skills:</span> {skills.softSkills.join(", ")}</div>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10.5px] font-bold uppercase text-slate-900 bg-slate-200 px-2 py-0.5 rounded mb-2">0x02. Selected Repositories</h2>
            <div className="space-y-3 pl-2">
              {projects.map((proj, idx) => (
                <div key={idx} className="border-l-2 border-purple-500 pl-3">
                  <div className="flex justify-between font-bold">
                    <span>{proj.projectTitle}</span>
                    <span className="text-[9px] text-purple-600">{proj.githubLink ? "[src]" : ""}</span>
                  </div>
                  {proj.technologiesUsed && proj.technologiesUsed.length > 0 && (
                    <div className="text-[9px] text-slate-500 font-bold mt-0.5">
                      Stack: [{proj.technologiesUsed.join(", ")}]
                    </div>
                  )}
                  <p className="text-slate-600 mt-1 leading-snug text-xxs">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10.5px] font-bold uppercase text-slate-900 bg-slate-200 px-2 py-0.5 rounded mb-2">0x03. Employment Log</h2>
            <div className="space-y-3 pl-2">
              {experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold">
                    <span>{exp.role} @ {exp.companyName}</span>
                    <span className="text-slate-500">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-xxs text-slate-600">
                      {exp.responsibilities.map((resp, rIdx) => (
                        <li key={rIdx}>{resp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications & Achievements */}
        {(certifications.length > 0 || achievements.length > 0) && (
          <div className="mb-4">
            <h2 className="text-[10.5px] font-bold uppercase text-slate-900 bg-slate-200 px-2 py-0.5 rounded mb-2">0x04. Certifications & Achievements</h2>
            <div className="pl-2 space-y-2 text-xs">
              {certifications.length > 0 && (
                <div>
                  <span className="text-purple-600 font-bold">// Certifications</span>
                  <ul className="list-disc pl-4 text-slate-600 space-y-0.5 mt-0.5">
                    {certifications.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              )}
              {achievements.length > 0 && (
                <div>
                  <span className="text-purple-600 font-bold">// Achievements</span>
                  <ul className="list-disc pl-4 text-slate-600 space-y-0.5 mt-0.5">
                    {achievements.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10.5px] font-bold uppercase text-slate-900 bg-slate-200 px-2 py-0.5 rounded mb-2">0x05. Education</h2>
            <div className="space-y-2 pl-2">
              {education.map((edu, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between font-bold">
                    <span>{edu.degree}</span>
                    <span className="text-slate-500">{edu.startYear} - {edu.endYear}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{edu.institution}, {edu.university}</span>
                    <span>CGPA/Marks: {edu.cgpa}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTemplate = () => {
    switch (templateId) {
      case "modern": return renderModernTemplate();
      case "academic": return renderAcademicTemplate();
      case "se": return renderSoftwareEngineerTemplate();
      default: return renderAtsTemplate();
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Sticky scale responsive card wrapper */}
      <div 
        ref={containerRef} 
        className="w-full relative flex justify-center overflow-hidden"
        style={{ height: `${1123 * scale + 10}px` }}
      >
        {/* A4 Paper mockup with custom width, height, and shadows */}
        <div 
          id="resume-preview-content"
          className="absolute bg-white shadow-[0_15px_40px_rgba(0,0,0,0.18)] border border-slate-200/80 rounded"
          style={{
            width: "794px",
            height: "1123px",
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
}
