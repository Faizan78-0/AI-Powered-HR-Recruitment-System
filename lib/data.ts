import type {
    Candidate,
    PipelineStage,

    Step,
    Metric,
    Testimonial,
    
  } from "../types";
  
  // export const CANDIDATES: Candidate[] = [
  //   {
  //     initials: "SR", name: "Sarah Rodriguez", role: "Senior Engineer", score: 97, color: "#6366f1",
  //     id: "",
  //     email: "",
  //     phone: "",
  //     jobId: "",
  //     jobTitle: "",
  //     status: "Applied",
  //     experience: "",
  //     rating: 0,
  //     notes: "",
  //     appliedDate: ""
  //   },
  //   {
  //     initials: "LK", name: "Liam Kowalski", role: "Full-Stack Dev", score: 93, color: "#0d9e75",
  //     id: "",
  //     email: "",
  //     phone: "",
  //     jobId: "",
  //     jobTitle: "",
  //     status: "Applied",
  //     experience: "",
  //     rating: 0,
  //     notes: "",
  //     appliedDate: ""
  //   },
  //   {
  //     initials: "AP", name: "Aisha Patel", role: "DevOps Lead", score: 91, color: "#d97a0e",
  //     id: "",
  //     email: "",
  //     phone: "",
  //     jobId: "",
  //     jobTitle: "",
  //     status: "Applied",
  //     experience: "",
  //     rating: 0,
  //     notes: "",
  //     appliedDate: ""
  //   },
  //   {
  //     initials: "MJ", name: "Marco Jensen", role: "Backend Engineer", score: 88, color: "#e04a28",
  //     id: "",
  //     email: "",
  //     phone: "",
  //     jobId: "",
  //     jobTitle: "",
  //     status: "Applied",
  //     experience: "",
  //     rating: 0,
  //     notes: "",
  //     appliedDate: ""
  //   },
  //   {
  //     initials: "NH", name: "Nina Hassan", role: "ML Engineer", score: 86, color: "#7c3aed",
  //     id: "",
  //     email: "",
  //     phone: "",
  //     jobId: "",
  //     jobTitle: "",
  //     status: "Applied",
  //     experience: "",
  //     rating: 0,
  //     notes: "",
  //     appliedDate: ""
  //   },
  // ];
  
  // export const PIPELINE_STAGES: PipelineStage[] = [
  //   { label: "Applied",   count: 1482, color: "#6366f1", heightPercent: 100 },
  //   { label: "Screened",  count: 612,  color: "#818cf8", heightPercent: 41  },
  //   { label: "Shortlist", count: 189,  color: "#0d9e75", heightPercent: 13  },
  //   { label: "Interview", count: 47,   color: "#d97a0e", heightPercent: 4   },
  //   { label: "Offer",     count: 12,   color: "#22c55e", heightPercent: 1   },
  // ];
  
  // export const STAT_CARDS: StatCard[] = [
  //   { label: "Applications", value: "1,482", change: "↑ 24% this week", positive: true  },
  //   { label: "AI Screened",  value: "1,248", change: "↑ 84% auto",      positive: true  },
  //   { label: "Interviews Set", value: "47",  change: "↓ 2 cancelled",   positive: false },
  // ];
  
  export const STEPS: Step[] = [
    {
      number: "01",
      title: "Create your job post",
      description:
        "Describe the role in plain language. AI auto-generates structured requirements and screening criteria, then publishes to 80+ job boards in one click.",
    },
    {
      number: "02",
      title: "AI screens all applicants",
      description:
        "Every resume is scored, ranked, and tagged within seconds. AI reads growth trajectories and hidden skills, delivering a prioritised shortlist instantly.",
    },
    {
      number: "03",
      title: "Automated outreach & scheduling",
      description:
        "TalentAI sends personalised emails, collects assessments, and books interviews based on live calendar availability — no manual work required.",
    },
    {
      number: "04",
      title: "Collaborative review",
      description:
        "Your team reviews AI scorecards, watches recorded interviews, and leaves structured feedback in a shared hiring room built for fast consensus.",
    },
    {
      number: "05",
      title: "Extend offer & onboard",
      description:
        "Generate and send offer letters in one click. AI triggers onboarding sequences, collects paperwork, and hands off to your HRIS automatically.",
    },
  ];
  
  export const METRICS: Metric[] = [
    { prefix: "↓", value: "68",  suffix: "%", label: "Reduction in time-to-hire",     color: "#818cf8" },
    { prefix: "↑", value: "3.8", suffix: "×", label: "Increase in quality hires",     color: "#34d399" },
    { prefix: "$", value: "14",  suffix: "k", label: "Average cost saved per hire",   color: "#fbbf24" },
    { prefix: "↑", value: "92",  suffix: "%", label: "Hiring manager satisfaction",   color: "#fb923c" },
  ];
  
  export const TESTIMONIALS: Testimonial[] = [
    {
      quote:
        "TalentAI cut our engineering hiring cycle from 6 weeks to 9 days. The AI screening is eerily accurate — it flagged a candidate our ATS would've missed who's now one of our best engineers.",
      author: "James Kirchner",
      role: "VP Engineering",
      company: "Stripe",
      initials: "JK",
      avatarColor: "#6366f1",
    },
    {
      quote:
        "We were drowning in resumes. TalentAI now handles 90% of our screening automatically. Our HR team finally focuses on the parts of recruitment that need a human touch.",
      author: " Chen",
      role: "Chief People Officer",
      company: "Figma",
      initials: "SC",
      avatarColor: "#0d9e75",
    },
    {
      quote:
        "The bias detection feature alone is worth the investment. Our diversity metrics improved by 40% in one quarter. TalentAI is the infrastructure our hiring was missing.",
      author: "Rachel Morgan",
      role: "Head of Talent",
      company: "Linear",
      initials: "RM",
      avatarColor: "#e04a28",
    },
  ];
  
  // export const PRICING_PLANS: PricingPlan[] = [
  //   {
  //     name: "Starter",
  //     price: "$0",
  //     period: "Free forever · No credit card",
  //     description: "Perfect for small teams hiring occasionally.",
  //     cta: "Get Started Free",
  //     features: [
  //       "3 active job posts",
  //       "100 AI-screened resumes/mo",
  //       "Basic scheduling",
  //       "1 team member",
  //       "Email support",
  //     ],
  //   },
  //   {
  //     name: "Pro",
  //     price: "$149",
  //     period: "per month · billed annually",
  //     description: "For growing companies with active pipelines and multiple open roles.",
  //     cta: "Start Pro Trial",
  //     featured: true,
  //     features: [
  //       "Unlimited job posts",
  //       "5,000 AI-screened resumes/mo",
  //       "Smart scheduling + video",
  //       "10 team members",
  //       "Hiring room collaboration",
  //       "Bias detection & DEI reports",
  //       "Priority support",
  //     ],
  //   },
  //   {
  //     name: "Enterprise",
  //     price: "Custom",
  //     period: "Volume pricing · dedicated success",
  //     description: "For large organisations with complex workflows and high-volume hiring.",
  //     cta: "Talk to Sales",
  //     features: [
  //       "Unlimited everything",
  //       "Custom AI model fine-tuning",
  //       "HRIS integrations (Workday, SAP)",
  //       "SSO / SAML",
  //       "SOC 2 Type II / GDPR",
  //       "Dedicated account manager",
  //       "SLA guarantees",
  //     ],
  //   },
  // ];
  
  export const LOGOS: string[] = ["Stripe", "Notion", "Linear", "Vercel", "Figma", "Loom", "Retool"];