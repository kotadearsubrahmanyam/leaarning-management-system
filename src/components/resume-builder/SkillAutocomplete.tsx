"use client";

import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import { X, Check, Loader2, Sparkles, Plus } from "lucide-react";

interface SkillItem {
  id?: number;
  name: string;
  category: string;
}

interface SkillAutocompleteProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  categoryName: string; // "languages" | "frameworks" | "databases" | "tools" | "softSkills"
}

// Categories mapping to match database
const CATEGORIES: Record<string, string> = {
  languages: "Programming Languages",
  frontend: "Frontend Development",
  backend: "Backend Development",
  databases: "Databases",
  cloud: "Cloud Technologies",
  devops: "DevOps",
  aiMl: "Artificial Intelligence & Machine Learning",
  mobile: "Mobile Development",
  security: "Cyber Security",
  tools: "Tools & Platforms",
  softSkills: "Soft Skills"
};

// Seeding suggestions to show when search is empty
const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  languages: ["Java", "Python", "C", "C++", "C#", "JavaScript", "TypeScript", "Go", "Rust", "Kotlin", "Swift", "Dart", "PHP", "Ruby", "Scala", "R"],
  frontend: ["React", "Next.js", "Angular", "Vue.js", "Svelte", "Redux", "Redux Toolkit", "Tailwind CSS", "Bootstrap", "Material UI", "Shadcn UI", "Vite", "Remix"],
  backend: ["Spring Boot", "Spring Security", "Spring Cloud", "Hibernate", "JPA", "Node.js", "Express.js", "NestJS", "Django", "Flask", "FastAPI", "ASP.NET Core", "Laravel"],
  databases: ["MySQL", "PostgreSQL", "MongoDB", "Oracle SQL", "Redis", "Firebase", "Supabase", "Cassandra", "DynamoDB", "Elasticsearch"],
  cloud: ["AWS", "Azure", "Google Cloud Platform", "Cloudflare", "Vercel", "Netlify", "DigitalOcean"],
  devops: ["Docker", "Kubernetes", "Jenkins", "GitHub Actions", "GitLab CI/CD", "Terraform", "Ansible", "Linux", "Nginx"],
  aiMl: ["OpenAI API", "LangChain", "LangGraph", "LlamaIndex", "CrewAI", "AutoGen", "Hugging Face", "Prompt Engineering", "RAG", "Vector Databases", "TensorFlow", "PyTorch", "Scikit-Learn", "OpenCV", "Pandas", "NumPy", "XGBoost"],
  mobile: ["Flutter", "React Native", "Android Development", "iOS Development", "Kotlin", "Swift"],
  security: ["OWASP", "Burp Suite", "Wireshark", "Network Security", "Penetration Testing", "Ethical Hacking"],
  tools: ["Git", "GitHub", "GitLab", "Bitbucket", "Postman", "Jira", "Figma", "VS Code", "IntelliJ IDEA"],
  softSkills: ["Communication", "Leadership", "Problem Solving", "Critical Thinking", "Presentation Skills", "Teamwork", "Time Management", "Adaptability"]
};

export function SkillAutocomplete({
  selectedSkills = [],
  onChange,
  placeholder = "Search or type skills...",
  categoryName
}: SkillAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Default suggestions filtered by category
  const defaultCategorySkills = CATEGORY_SUGGESTIONS[categoryName] || [];

  // Load matching suggestions when user types
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/skills/search?q=${encodeURIComponent(inputValue)}&category=${encodeURIComponent(CATEGORIES[categoryName] || "")}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out already selected skills
          const filtered = data.filter((item: SkillItem) => !selectedSkills.includes(item.name));
          setSuggestions(filtered);
        }
      } catch (err) {
        console.error("Autocomplete search error:", err);
      } finally {
        setLoading(false);
        setHighlightedIndex(0);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [inputValue, selectedSkills]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSkill = (skillName: string) => {
    if (!selectedSkills.includes(skillName)) {
      onChange([...selectedSkills, skillName]);
    }
    setInputValue("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveSkill = (skillName: string) => {
    onChange(selectedSkills.filter((s) => s !== skillName));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      const itemsCount = getDropdownItemsCount();
      if (itemsCount > 0) {
        setHighlightedIndex((prev) => (prev + 1) % itemsCount);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      const itemsCount = getDropdownItemsCount();
      if (itemsCount > 0) {
        setHighlightedIndex((prev) => (prev - 1 + itemsCount) % itemsCount);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const itemsCount = getDropdownItemsCount();
      if (isOpen && itemsCount > 0 && highlightedIndex < itemsCount) {
        const selected = getDropdownItemAt(highlightedIndex);
        if (selected) {
          handleSelectSkill(selected);
        }
      } else if (inputValue.trim()) {
        handleSelectSkill(inputValue.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const getDropdownItemsCount = () => {
    if (inputValue.trim()) {
      return suggestions.length + 1; // suggestions + "Add custom"
    }
    return defaultCategorySkills.filter(s => !selectedSkills.includes(s)).length;
  };

  const getDropdownItemAt = (index: number): string | null => {
    if (inputValue.trim()) {
      if (index < suggestions.length) {
        return suggestions[index].name;
      } else if (index === suggestions.length) {
        return inputValue.trim();
      }
    } else {
      const filteredDefaults = defaultCategorySkills.filter(s => !selectedSkills.includes(s));
      if (index < filteredDefaults.length) {
        return filteredDefaults[index];
      }
    }
    return null;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-slate-500 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm"
        />
        {loading && (
          <div className="absolute right-3">
            <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
          </div>
        )}
      </div>

      {/* Dropdown Suggestions List (Directly below, scrollable) */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] shadow-2xl rounded-xl overflow-hidden max-h-60 overflow-y-auto scrollbar-thin">
          {inputValue.trim() ? (
            // Typing Search Results
            <div className="py-1">
              {suggestions.map((skill, index) => (
                <button
                  key={skill.id || index}
                  type="button"
                  onClick={() => handleSelectSkill(skill.name)}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                    highlightedIndex === index
                      ? "bg-purple-100/50 dark:bg-purple-950/30 text-[#6D28D9] dark:text-purple-300 font-bold"
                      : "text-[#0F172A] dark:text-slate-200 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40"
                  }`}
                >
                  <span className="truncate">{skill.name}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {skill.category}
                  </span>
                </button>
              ))}

              {/* Add Custom Row */}
              <button
                type="button"
                onClick={() => handleSelectSkill(inputValue.trim())}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/60 font-bold transition-colors ${
                  highlightedIndex === suggestions.length
                    ? "bg-purple-600 text-white"
                    : "text-purple-600 dark:text-purple-400 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40"
                }`}
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="truncate">Add custom skill: "{inputValue.trim()}"</span>
              </button>
            </div>
          ) : (
            // Default list recommendations
            <div className="py-1">
              <div className="px-4 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-1">
                <Sparkles size={11} className="text-purple-500" /> Predefined {CATEGORIES[categoryName] || "Suggestions"}
              </div>
              
              {defaultCategorySkills.filter((s) => !selectedSkills.includes(s)).length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-400 text-center italic">
                  All suggestions added.
                </div>
              ) : (
                defaultCategorySkills
                  .filter((skillName) => !selectedSkills.includes(skillName))
                  .map((skillName, index) => (
                    <button
                      key={skillName}
                      type="button"
                      onClick={() => handleSelectSkill(skillName)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        highlightedIndex === index
                          ? "bg-purple-100/50 dark:bg-purple-950/30 text-[#6D28D9] dark:text-purple-300 font-bold"
                          : "text-[#0F172A] dark:text-slate-200 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <span>{skillName}</span>
                    </button>
                  ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Chip display exactly matching specific styling criteria */}
      <div className="flex flex-wrap gap-2 mt-3">
        {selectedSkills.map((skill, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EDE9FE] dark:bg-purple-950/30 text-[#6D28D9] dark:text-purple-300 border border-[#C4B5FD] dark:border-purple-800/30 font-bold text-xs rounded-full transition-all duration-300 hover:bg-[#DDD6FE] dark:hover:bg-purple-900/40 shadow-sm"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={() => handleRemoveSkill(skill)}
              className="text-[#6D28D9] dark:text-purple-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full transition-all outline-none"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
