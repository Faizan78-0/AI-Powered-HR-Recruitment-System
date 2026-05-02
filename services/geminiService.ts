"use client";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

const MODELS = {
  FAST: 'gemini-2.5-flash',
  SMART: 'gemini-2.5-flash',
  VISION: 'gemini-2.5-flash'
};

const cleanJsonString = (str: string) => {
  // Remove markdown code blocks like ```json ... ```
  return str.replace(/```json\n?|```/g, '').trim();
};

export const generateJobDescription = async (title: string, keywords: string): Promise<string> => {
  try {
    const prompt = `Write a professional, engaging job description for a "${title}". 
    Include the following keywords/skills: ${keywords}.
    Structure it with: 
    1. About the Role
    2. Key Responsibilities
    3. Requirements
    4. Why Join Us
    Format as Markdown. Keep it concise but professional.`;

    const response = await ai.models.generateContent({
      model: MODELS.FAST,
      contents: prompt,
    });
    
    if (!response.text) {
      throw new Error("Received empty response from AI service.");
    }
    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate description. Please check your API key.");
  }
};

export const analyzeCandidateMatch = async (jobDescription: string, candidateResume: string): Promise<{ score: number; analysis: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: MODELS.SMART,
      contents: `You are an expert HR recruiter. Compare the following candidate resume summary against the job description.
      
      Job Description:
      ${jobDescription.substring(0, 1000)}...

      Candidate Resume Summary:
      ${candidateResume}

      Provide a JSON response with:
      - score: A number between 0 and 100 representing the fit.
      - analysis: A 1-2 sentence explanation of why.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            analysis: { type: Type.STRING }
          }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("No response content from AI");
    
    return JSON.parse(cleanJsonString(jsonStr));
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw new Error(error.message || "Failed to analyze candidate match.");
  }
};

export const generateInterviewQuestions = async (jobTitle: string, candidateSkills: string[]): Promise<Array<{question: string, category: string}>> => {
  try {
    const response = await ai.models.generateContent({
      model: MODELS.FAST,
      contents: `Generate 5 interview questions for a ${jobTitle} candidate with skills: ${candidateSkills.join(', ')}.
      Return a JSON array of objects with 'question' and 'category' (Technical, Behavioral, Situational).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              category: { type: Type.STRING }
            }
          }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("No response content from AI");
    return JSON.parse(cleanJsonString(jsonStr));
  } catch (error: any) {
    console.error("Gemini Questions Error:", error);
    throw new Error(error.message || "Failed to generate interview questions.");
  }
};

export const analyzeResume = async (fileData: string, mimeType: string): Promise<any> => {
  try {
    const parts = [];
    
    // For PDFs, we send the base64 data. For text, we send the string directly.
    if (mimeType === 'application/pdf') {
       parts.push({
         inlineData: {
           data: fileData,
           mimeType: 'application/pdf'
         }
       });
       parts.push({
         text: "Analyze this resume PDF."
       });
    } else {
       // Assume text for txt or parsed content
       parts.push({
         text: `Analyze this resume text:\n\n${fileData}`
       });
    }

    const prompt = `
    You are an expert ATS (Applicant Tracking System) and Resume Consultant.
    1. Extract the candidate's name, email, inferred years of experience, and list of skills.
    2. Identify 3 critical mistakes or areas for improvement (e.g., typos, weak verbs, vague descriptions, formatting issues). Assign a severity (High/Medium/Low).
    3. Provide 3 specific, actionable suggestions to improve the resume's impact.
    4. REWRITE the 'Professional Summary' to be more punchy, executive, and results-oriented.
    5. REWRITE the most recent (or implied most recent) 'Work Experience' entry to use strong action verbs and quantified results.
    6. GENERATE A COMPLETE REWRITTEN RESUME in Markdown format. This should be a full version of the resume that incorporates all fixes, uses professional formatting, and improves the language throughout.
    7. ANALYZE FIT FOR DIFFERENT ROLES: Identify 3 distinct job titles this candidate is suited for. For each, explain how to tailor the resume (e.g., "For Product Manager: Highlight cross-functional leadership..."). Return this as a Markdown string.

    Return JSON format:
    {
      "candidateInfo": { 
        "name": "string", 
        "email": "string", 
        "skills": ["string"], 
        "experienceYears": "string" 
      },
      "critique": [ 
        { "issue": "string", "severity": "High/Medium/Low", "fix": "string" } 
      ],
      "suggestions": ["string"],
      "tailoringAdvice": "string (markdown)",
      "rewrittenSections": { 
        "summary": "string", 
        "experience": "string" 
      },
      "fullRewrittenResume": "string"
    }
    `;
    
    // Append the instruction prompt
    parts[parts.length - 1].text += "\n" + prompt;

    const response = await ai.models.generateContent({
      model: MODELS.VISION,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("No response content from AI");
    
    return JSON.parse(cleanJsonString(jsonStr));

  } catch (error: any) {
    console.error("Gemini Resume Analysis Error:", error);
    throw new Error(error.message || "Failed to analyze resume.");
  }
};

export const createHRChatSession = () => {
  return ai.chats.create({
    model: MODELS.FAST,
    config: {
      systemInstruction: "You are  expert HR Assistant. Help users with recruitment processes, HR policies, drafting emails to candidates, and interview tips. Be concise, professional, and helpful.",
    }
  });
};