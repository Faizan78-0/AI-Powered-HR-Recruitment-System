// src/lib/nlp/resumeAnalyzer.ts
// Pure TypeScript NLP resume analysis engine — no external ML deps needed

// ─── Skill Taxonomy ───────────────────────────────────────────────────────────
const SKILL_TAXONOMY: Record<string, string[]> = {
  // Frontend
  "React": ["react.js", "reactjs", "react js", "react native"],
  "Vue": ["vue.js", "vuejs", "vue js", "nuxt", "nuxtjs"],
  "Angular": ["angular.js", "angularjs", "angular js"],
  "TypeScript": ["typescript", "ts"],
  "JavaScript": ["javascript", "js", "es6", "es2015", "ecmascript"],
  "HTML": ["html5", "html 5"],
  "CSS": ["css3", "css 3", "scss", "sass", "less", "styled-components", "tailwind", "tailwindcss"],
  "Next.js": ["nextjs", "next js"],
  "GraphQL": ["graphql", "apollo", "apollo client"],
  "Redux": ["redux", "zustand", "mobx", "recoil", "jotai"],
  // Backend
  "Node.js": ["nodejs", "node js", "express", "expressjs", "express.js", "fastify", "koa"],
  "Python": ["python", "django", "flask", "fastapi", "pandas", "numpy", "scipy"],
  "Java": ["java", "spring", "spring boot", "hibernate", "maven", "gradle"],
  "Go": ["golang", "go lang"],
  "Rust": ["rust", "cargo"],
  "C#": ["c#", ".net", "dotnet", "asp.net"],
  "PHP": ["php", "laravel", "symfony", "wordpress"],
  "Ruby": ["ruby", "rails", "ruby on rails"],
  // Database
  "PostgreSQL": ["postgresql", "postgres", "psql"],
  "MySQL": ["mysql", "mariadb"],
  "MongoDB": ["mongodb", "mongoose", "atlas"],
  "Redis": ["redis", "memcached"],
  "Elasticsearch": ["elasticsearch", "elastic", "kibana", "logstash"],
  "SQLite": ["sqlite"],
  "DynamoDB": ["dynamodb", "dynamo"],
  "Cassandra": ["cassandra"],
  // Cloud & DevOps
  "AWS": ["amazon web services", "ec2", "s3", "lambda", "rds", "ecs", "eks", "cloudfront", "sqs", "sns", "route53"],
  "GCP": ["google cloud", "gcp", "bigquery", "cloud run", "gke"],
  "Azure": ["microsoft azure", "azure devops"],
  "Docker": ["docker", "dockerfile", "docker-compose"],
  "Kubernetes": ["kubernetes", "k8s", "kubectl", "helm", "eks", "gke", "aks"],
  "Terraform": ["terraform", "infrastructure as code", "iac"],
  "CI/CD": ["ci/cd", "github actions", "gitlab ci", "jenkins", "circle ci", "travis", "bamboo", "drone"],
  "Linux": ["linux", "ubuntu", "debian", "centos", "bash", "shell scripting", "unix"],
  // Data & ML
  "Machine Learning": ["machine learning", "ml", "artificial intelligence", "ai", "deep learning", "neural network"],
  "TensorFlow": ["tensorflow", "keras"],
  "PyTorch": ["pytorch"],
  "Data Science": ["data science", "data analysis", "data analytics", "tableau", "power bi", "looker"],
  "Spark": ["apache spark", "pyspark", "databricks"],
  "Kafka": ["apache kafka", "kafka"],
  // Testing
  "Jest": ["jest", "jasmine", "mocha", "chai", "vitest"],
  "Cypress": ["cypress", "playwright", "selenium", "puppeteer"],
  "TDD": ["tdd", "test driven development", "bdd", "behavior driven"],
  // Mobile
  "React Native": ["react native", "expo"],
  "iOS": ["ios", "swift", "xcode", "objective-c"],
  "Android": ["android", "kotlin", "java android"],
  "Flutter": ["flutter", "dart"],
  // Soft Skills
  "Leadership": ["leadership", "team lead", "tech lead", "engineering manager", "managed team", "led team", "mentoring", "mentorship", "coached"],
  "Communication": ["communication", "presentation", "stakeholder", "collaborated", "cross-functional"],
  "Problem Solving": ["problem solving", "analytical", "troubleshooting", "debugging", "optimized", "improved"],
  "Agile": ["agile", "scrum", "kanban", "sprint", "jira", "confluence", "trello"],
  "System Design": ["system design", "architecture", "microservices", "distributed systems", "scalability", "high availability"],
  // Security
  "Security": ["cybersecurity", "security", "owasp", "penetration testing", "oauth", "jwt", "ssl", "tls", "encryption"],
};

// ─── Education Keywords ───────────────────────────────────────────────────────
const DEGREES = [
  { pattern: /\b(ph\.?d\.?|doctor(?:ate)?)\b/gi, level: "PhD", weight: 5 },
  { pattern: /\b(m\.?s\.?|m\.?eng\.?|master(?:'s)?|mba|m\.?b\.?a\.?)\b/gi, level: "Masters", weight: 4 },
  { pattern: /\b(b\.?s\.?|b\.?e\.?|b\.?tech\.?|bachelor(?:'s)?|undergraduate)\b/gi, level: "Bachelors", weight: 3 },
  { pattern: /\b(associate(?:'s)?|a\.?s\.?|a\.?a\.?)\b/gi, level: "Associates", weight: 2 },
  { pattern: /\b(bootcamp|boot camp|certificate|certification|nanodegree)\b/gi, level: "Certificate", weight: 1 },
];

const TOP_UNIVERSITIES = [
  "mit", "stanford", "harvard", "caltech", "carnegie mellon", "cmu",
  "berkeley", "ucla", "uc berkeley", "columbia", "cornell", "yale",
  "princeton", "oxford", "cambridge", "imperial", "eth zurich",
  "gatech", "georgia tech", "michigan", "illinois", "purdue",
  "waterloo", "toronto", "ubc", "iit", "ntu", "nus",
];

// ─── Experience Patterns ──────────────────────────────────────────────────────
const EXPERIENCE_PATTERNS = [
  /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp|work)/gi,
  /(?:experience|exp)\s*(?:of\s*)?(\d+)\+?\s*years?/gi,
  /(\d+)\+?\s*yrs?\s*(?:of\s*)?(?:experience|exp)/gi,
];

const SENIORITY_KEYWORDS: Record<string, number> = {
  "intern": 0, "junior": 1, "associate": 2, "mid-level": 3, "mid level": 3,
  "senior": 4, "staff": 5, "principal": 6, "lead": 5, "tech lead": 5,
  "engineering manager": 6, "director": 7, "vp": 8, "cto": 9, "head of": 6,
};

// ─── Achievement Patterns (quantifiable impact) ───────────────────────────────
const ACHIEVEMENT_PATTERNS = [
  /(?:increased?|improved?|boost(?:ed)?|grew?|raised?|enhanced?)\s+[\w\s]+(?:by|to)\s+\d+[\d,.]*\s*%/gi,
  /(?:reduced?|decreased?|cut|lowered?|minimized?)\s+[\w\s]+(?:by|to)\s+\d+[\d,.]*\s*%/gi,
  /(?:saved?|generated?|drove?)\s+\$[\d,.]+\s*(?:million|billion|thousand|k|m|b)?/gi,
  /(?:led|managed|built|architected|designed|launched|shipped|deployed|created)\s+[\w\s,]+(?:serving|used by|processing|handling)\s+[\d,.]+\s*(?:users?|customers?|requests?|transactions?)/gi,
  /[\d,.]+\s*(?:million|billion|thousand)[\s+](?:users?|customers?|requests?|records?)/gi,
  /\$[\d,.]+(?:\s*(?:million|billion|thousand|k|m))?(?:\s+(?:revenue|arr|mrr|contract|deal|savings?))/gi,
];

// ─── Red Flags ────────────────────────────────────────────────────────────────
const RED_FLAGS = [
  { pattern: /\b(responsible for|helped with|assisted in|worked on|involved in)\b/gi, msg: "Weak action verbs — prefer impact-driven language (built, led, architected, delivered)" },
  { pattern: /\b(detail[- ]oriented|team player|hard[- ]working|self[- ]starter|go[- ]getter|passionate about)\b/gi, msg: "Overused buzzwords that add little signal" },
  { pattern: /\b(proficient|familiar|exposure|knowledge of|understanding of)\b/gi, msg: "Vague skill claims — prefer demonstrated experience with specific examples" },
];

// ─── Section Detection ────────────────────────────────────────────────────────
const SECTIONS: Record<string, RegExp> = {
  experience: /\b(work experience|professional experience|employment|experience|career history|work history)\b/gi,
  education: /\b(education|academic|qualifications?|degrees?|university|college)\b/gi,
  skills: /\b(skills?|technical skills?|competenc(?:ies|y)|technologies?|tools?|tech stack)\b/gi,
  projects: /\b(projects?|portfolio|personal projects?|side projects?|open source)\b/gi,
  achievements: /\b(achievements?|accomplishments?|awards?|honors?|recognition)\b/gi,
  certifications: /\b(certifications?|credentials?|licenses?|certificates?)\b/gi,
  summary: /\b(summary|objective|profile|about|overview|bio)\b/gi,
};

// ─── Main Analyzer ────────────────────────────────────────────────────────────
export interface ResumeAnalysis {
  overallScore: number;                        // 0–100
  grade: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";
  scores: {
    skills: number;
    experience: number;
    education: number;
    achievements: number;
    formatting: number;
    keywords: number;
  };
  detectedSkills: { name: string; category: string }[];
  skillCategories: { category: string; skills: string[]; count: number }[];
  yearsExperience: number | null;
  seniorityLevel: string;
  educationLevel: string;
  topUniversity: boolean;
  sections: { name: string; found: boolean }[];
  achievements: string[];
  redFlags: string[];
  strengths: string[];
  improvements: string[];
  keywordDensity: number;
  wordCount: number;
  atsScore: number;                            // Applicant Tracking System friendliness
  jobMatchScore: number | null;               // if job description provided
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
}

function scoreToGrade(score: number): ResumeAnalysis["grade"] {
  if (score >= 95) return "A+";
  if (score >= 88) return "A";
  if (score >= 82) return "B+";
  if (score >= 75) return "B";
  if (score >= 68) return "C+";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s.+#@]/g, " ").replace(/\s+/g, " ").trim();
}

function detectSkills(text: string): { name: string; category: string }[] {
  const norm = normalizeText(text);
  const found = new Set<string>();
  const results: { name: string; category: string }[] = [];

  // Categorise skills
  const CATEGORIES: Record<string, string[]> = {
    "Frontend": ["React", "Vue", "Angular", "TypeScript", "JavaScript", "HTML", "CSS", "Next.js", "GraphQL", "Redux"],
    "Backend": ["Node.js", "Python", "Java", "Go", "Rust", "C#", "PHP", "Ruby"],
    "Database": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQLite", "DynamoDB", "Cassandra"],
    "Cloud & DevOps": ["AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux"],
    "Data & ML": ["Machine Learning", "TensorFlow", "PyTorch", "Data Science", "Spark", "Kafka"],
    "Testing": ["Jest", "Cypress", "TDD"],
    "Mobile": ["React Native", "iOS", "Android", "Flutter"],
    "Soft Skills": ["Leadership", "Communication", "Problem Solving", "Agile", "System Design"],
    "Security": ["Security"],
  };

  const skillToCategory = new Map<string, string>();
  for (const [cat, skills] of Object.entries(CATEGORIES)) {
    for (const s of skills) skillToCategory.set(s, cat);
  }

  for (const [skill, aliases] of Object.entries(SKILL_TAXONOMY)) {
    if (found.has(skill)) continue;
    const allTerms = [skill.toLowerCase(), ...aliases];
    for (const term of allTerms) {
      if (norm.includes(term)) {
        found.add(skill);
        results.push({ name: skill, category: skillToCategory.get(skill) || "Other" });
        break;
      }
    }
  }

  return results;
}

function detectExperience(text: string): number | null {
  for (const pat of EXPERIENCE_PATTERNS) {
    pat.lastIndex = 0;
    const m = pat.exec(text);
    if (m) return parseInt(m[1]);
  }
  // Estimate from year ranges like "2018 – 2024"
  const yearRanges = text.matchAll(/\b(20\d{2}|19\d{2})\s*[-–—to]+\s*(20\d{2}|present|current|now)\b/gi);
  let totalYears = 0;
  const currentYear = new Date().getFullYear();
  for (const match of yearRanges) {
    const start = parseInt(match[1]);
    const end = match[2].match(/present|current|now/i) ? currentYear : parseInt(match[2]);
    if (end >= start && end - start < 50) totalYears += end - start;
  }
  return totalYears > 0 ? Math.min(totalYears, 40) : null;
}

function detectSeniority(text: string): string {
  const norm = normalizeText(text);
  let best = { label: "Mid Level", weight: -1 };
  for (const [kw, weight] of Object.entries(SENIORITY_KEYWORDS)) {
    if (norm.includes(kw) && weight > best.weight) {
      best = { label: kw.charAt(0).toUpperCase() + kw.slice(1), weight };
    }
  }
  return best.label;
}

function detectEducation(text: string): { level: string; topUni: boolean } {
  const norm = normalizeText(text);
  let level = "Unknown";
  let maxWeight = -1;
  for (const { pattern, level: lvl, weight } of DEGREES) {
    pattern.lastIndex = 0;
    if (pattern.test(norm) && weight > maxWeight) {
      level = lvl; maxWeight = weight;
    }
  }
  const topUni = TOP_UNIVERSITIES.some(u => norm.includes(u));
  return { level, topUni };
}

function detectAchievements(text: string): string[] {
  const found: string[] = [];
  for (const pat of ACHIEVEMENT_PATTERNS) {
    pat.lastIndex = 0;
    const matches = [...text.matchAll(pat)];
    for (const m of matches) {
      const clean = m[0].trim().replace(/\s+/g, " ");
      if (clean.length > 10 && clean.length < 200) found.push(clean);
    }
  }
  return [...new Set(found)].slice(0, 8);
}

function detectRedFlags(text: string): string[] {
  const found = new Set<string>();
  for (const { pattern, msg } of RED_FLAGS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) found.add(msg);
  }
  return [...found];
}

function detectSections(text: string): { name: string; found: boolean }[] {
  return Object.entries(SECTIONS).map(([name, pat]) => {
    pat.lastIndex = 0;
    return { name: name.charAt(0).toUpperCase() + name.slice(1), found: pat.test(text) };
  });
}

function calcATSScore(text: string, skills: { name: string }[], sections: { name: string; found: boolean }[]): number {
  let score = 50;
  // Has key sections
  const foundSections = sections.filter(s => s.found).length;
  score += Math.min(20, foundSections * 4);
  // Not too many special characters (ATS unfriendly)
  const specialCharRatio = (text.match(/[|■▪◆→✓✗★]/g) || []).length / text.length;
  if (specialCharRatio > 0.01) score -= 10;
  // Skill count
  score += Math.min(20, skills.length * 1.5);
  // Has contact info signals
  if (/\b[\w.+-]+@[\w-]+\.\w+\b/.test(text)) score += 5;
  if (/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text)) score += 3;
  if (/linkedin\.com/i.test(text)) score += 2;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function jobMatchAnalysis(resumeText: string, jobDescription: string, resumeSkills: { name: string }[]): { score: number; matched: string[]; missing: string[] } {
  if (!jobDescription.trim()) return { score: 0, matched: [], missing: [] };
  const jobSkills = detectSkills(jobDescription);
  const resumeSkillNames = new Set(resumeSkills.map(s => s.name.toLowerCase()));
  const matched: string[] = [];
  const missing: string[] = [];
  for (const { name } of jobSkills) {
    if (resumeSkillNames.has(name.toLowerCase())) matched.push(name);
    else missing.push(name);
  }
  const score = jobSkills.length > 0 ? Math.round((matched.length / jobSkills.length) * 100) : 0;
  return { score, matched, missing };
}

export function analyzeResume(resumeText: string, jobDescription = ""): ResumeAnalysis {
  const text = resumeText;
  const wordCount = text.trim().split(/\s+/).length;

  // Detect everything
  const detectedSkills = detectSkills(text);
  const yearsExperience = detectExperience(text);
  const seniorityLevel = detectSeniority(text);
  const { level: educationLevel, topUni } = detectEducation(text);
  const achievements = detectAchievements(text);
  const redFlags = detectRedFlags(text);
  const sections = detectSections(text);

  // Group skills by category
  const catMap = new Map<string, string[]>();
  for (const { name, category } of detectedSkills) {
    if (!catMap.has(category)) catMap.set(category, []);
    catMap.get(category)!.push(name);
  }
  const skillCategories = [...catMap.entries()].map(([category, skills]) => ({ category, skills, count: skills.length })).sort((a, b) => b.count - a.count);

  // Component scores
  const skillScore = Math.min(100, Math.round(detectedSkills.length * 4.5));

  const expScore = (() => {
    if (yearsExperience === null) return 30;
    if (yearsExperience >= 10) return 100;
    if (yearsExperience >= 7) return 88;
    if (yearsExperience >= 5) return 78;
    if (yearsExperience >= 3) return 65;
    if (yearsExperience >= 1) return 50;
    return 35;
  })();

  const eduScore = (() => {
    const base = { "PhD": 100, "Masters": 88, "Bachelors": 75, "Associates": 55, "Certificate": 50, "Unknown": 40 }[educationLevel] ?? 40;
    return Math.min(100, base + (topUni ? 10 : 0));
  })();

  const achievementScore = Math.min(100, achievements.length * 18);
  const foundSectionCount = sections.filter(s => s.found).length;
  const formattingScore = Math.min(100, Math.round(
    (foundSectionCount / sections.length) * 60 +
    (wordCount >= 300 && wordCount <= 1000 ? 25 : wordCount >= 200 ? 15 : 5) +
    (redFlags.length === 0 ? 15 : Math.max(0, 15 - redFlags.length * 5))
  ));

  const keywordDensity = wordCount > 0 ? Math.round((detectedSkills.length / wordCount) * 1000) / 10 : 0;
  const keywordScore = Math.min(100, Math.round(keywordDensity * 15));

  // Overall weighted score
  const overallScore = Math.min(100, Math.round(
    skillScore * 0.25 +
    expScore * 0.25 +
    eduScore * 0.15 +
    achievementScore * 0.20 +
    formattingScore * 0.10 +
    keywordScore * 0.05
  ));

  const atsScore = calcATSScore(text, detectedSkills, sections);
  const { score: jobMatchScore, matched: matchedKeywords, missing: missingKeywords } = jobMatchAnalysis(text, jobDescription, detectedSkills);

  // Strengths
  const strengths: string[] = [];
  if (detectedSkills.length >= 10) strengths.push(`Strong technical breadth — ${detectedSkills.length} skills detected across ${skillCategories.length} categories`);
  if (achievements.length >= 3) strengths.push(`${achievements.length} quantifiable achievements demonstrate real impact`);
  if (yearsExperience !== null && yearsExperience >= 5) strengths.push(`${yearsExperience}+ years of experience signals deep expertise`);
  if (topUni) strengths.push("Degree from a top-tier university");
  if (educationLevel === "PhD" || educationLevel === "Masters") strengths.push(`${educationLevel} degree shows advanced academic commitment`);
  if (foundSectionCount >= 5) strengths.push("Well-structured resume with all key sections present");
  if (redFlags.length === 0) strengths.push("Clean, professional language — no weak buzzwords detected");
  if (detectedSkills.some(s => s.category === "Cloud & DevOps")) strengths.push("Cloud and DevOps skills are highly valued in the market");
  if (atsScore >= 80) strengths.push("ATS-friendly format — will parse well through applicant tracking systems");

  // Improvements
  const improvements: string[] = [];
  if (detectedSkills.length < 8) improvements.push("List more specific technical skills — recruiters scan for keywords");
  if (achievements.length < 2) improvements.push("Add 3–5 quantified achievements (e.g. 'Reduced load time by 40%', 'Grew ARR by $2M')");
  if (yearsExperience === null) improvements.push("Clarify total years of experience — include explicit date ranges for each role");
  if (!sections.find(s => s.name === "Summary")?.found) improvements.push("Add a 2–3 sentence professional summary at the top");
  if (!sections.find(s => s.name === "Projects")?.found) improvements.push("Include a Projects section — especially valuable for engineers");
  if (wordCount < 300) improvements.push("Resume feels thin — aim for 400–700 words for most roles");
  if (wordCount > 1200) improvements.push("Resume is long — trim to 1 page (≤700 words) for under 10 years experience");
  if (redFlags.length > 0) improvements.push("Replace weak phrases like 'responsible for' with strong action verbs (built, delivered, architected)");
  if (missingKeywords.length > 3 && jobDescription) improvements.push(`Add ${missingKeywords.slice(0, 3).join(", ")} to better match this job's requirements`);
  if (!(/linkedin\.com/i.test(text))) improvements.push("Add your LinkedIn URL for social proof");

  // Summary text
  const summary = `This resume scores ${overallScore}/100 (${scoreToGrade(overallScore)}). ` +
    `${detectedSkills.length} skills detected, ${yearsExperience !== null ? yearsExperience + " years experience estimated" : "experience unclear"}. ` +
    `${achievements.length} quantifiable achievements found. ` +
    (jobDescription ? `Job match: ${jobMatchScore}%. ` : "") +
    `ATS compatibility: ${atsScore}%.`;

  return {
    overallScore,
    grade: scoreToGrade(overallScore),
    scores: {
      skills: skillScore,
      experience: expScore,
      education: eduScore,
      achievements: achievementScore,
      formatting: formattingScore,
      keywords: keywordScore,
    },
    detectedSkills,
    skillCategories,
    yearsExperience,
    seniorityLevel,
    educationLevel,
    topUniversity: topUni,
    sections,
    achievements,
    redFlags,
    strengths: strengths.slice(0, 6),
    improvements: improvements.slice(0, 6),
    keywordDensity,
    wordCount,
    atsScore,
    jobMatchScore: jobDescription ? jobMatchScore : null,
    matchedKeywords,
    missingKeywords,
    summary,
  };
}
