# AI-POWERED-HR-RECRUITMENT-SYSTEM

The AI-Powered HR Recruitment System automates resume screening, candidate ranking, and job matching using advanced NLP and smart algorithms. It provides real-time insights through interactive dashboards and enhances communication with automated updates. Overall, it helps organizations hire faster, smarter, and more efficiently.

---

## 🧠 NLP Engine Logic

The system analyzes resumes across 6 key dimensions:

1. **Technical Skills:** Matched against a taxonomy of 200+ industry skills.
2. **Experience:** Calculation of total years based on date-pattern extraction.
3. **Education:** Detection of degrees and university prestige.
4. **Achievements:** NLP-based detection of action verbs and metrics.
5. **Formatting:** Checks for section headers and contact information.
6. **Job Match:** Semantic similarity between the resume and job description.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

This is a comprehensive, professional `README.md` designed for a modern AI-powered HR Recruitment System (like the one we’ve been building). It covers the tech stack, AI capabilities, and system architecture.

---

````markdown
# 🤖 AI-HR Recruitment & NLP Resume Analyzer

An intelligent, full-stack recruitment platform designed to automate the screening process using Natural Language Processing (NLP). This system allows recruiters to upload candidate resumes (PDF/DOCX), extract deep insights, and match them against job descriptions with AI-driven scoring.

---

## 🚀 Key Features

### 🔍 AI Resume Analysis

- **NLP Extraction:** Automatically parses PDF and DOCX files to extract skills, experience years, and education levels.
- **ATS Scoring:** Rates resumes based on industry-standard Applicant Tracking System (ATS) readability.
- **Achievement Detection:** Uses pattern matching to identify quantifiable achievements (e.g., "Increased revenue by 20%").

### 👔 Dual-Role Dashboards

- **Recruiters:** Access to the Resume Analyzer, job posting tools, and candidate ranking history.
- **Job Seekers:** Profile management, resume optimization tips, and application tracking.

### 🌓 Advanced UI/UX

- **System-Aware Theme:** Automatic switching between Dark and Light modes based on OS settings.
- **Premium Interactions:** Framer Motion animations and glassmorphic UI components.
- **Responsive Design:** Fully optimized for mobile, tablet, and desktop.

### 🛡️ Security & Auth

- **JWT-in-Cookie:** Secure, `httpOnly` cookie-based authentication.
- **Role-Based Access Control (RBAC):** Middleware-level protection to keep Job Seekers out of Recruiter dashboards.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Database:** MongoDB with Mongoose
- **File Processing:** `pdf-parse`, `mammoth` (DOCX), `jsonwebtoken`
- **Animations:** Framer Motion / Lucide React

---

## 📦 Installation & Setup

1. **Clone the repository**

   bash
   git clone https://github.com/MAZHARFA/hr-recruitment-system.git
   cd hr-recruitment-system
   

2.**Install dependencies**

    npm install

    npm run dev


