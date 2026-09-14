import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { screeningSessions, candidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import {
  normalizeText,
  extractName,
  extractEmail,
  extractPhone,
  extractEducation,
  extractYearsExperience,
  extractSkills,
  extractJobRequirements,
  computeSemanticSimilarity,
  computeSkillScore,
  computeExperienceScore,
  computeEducationScore,
  computeCompositeScore,
  generateInterviewQuestions,
  generateRecruiterFeedback,
  type Weights,
} from "@/lib/resume-parser";
import { scoreToStatus } from "@/lib/utils";

async function parsePDF(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy();
  }
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const jobDescription = formData.get("jobDescription") as string;
    const jobTitle = formData.get("jobTitle") as string;
    const sessionName = formData.get("sessionName") as string;
    const weightsRaw = formData.get("weights") as string;
    const useSampleData = formData.get("useSampleData") === "true";

    const weights: Weights = weightsRaw
      ? JSON.parse(weightsRaw)
      : { skill: 0.4, semantic: 0.35, experience: 0.15, education: 0.1 };

    if (!jobDescription) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }

    // Extract job requirements
    const jobReqs = extractJobRequirements(jobDescription);

    // Parse resume files or use sample data
    const resumeTexts: Array<{ text: string; fileName: string }> = [];

    if (useSampleData) {
      // Inject sample resume texts
      SAMPLE_RESUMES.forEach(r => resumeTexts.push(r));
    } else {
      const files = formData.getAll("resumes") as File[];
      if (files.length > 50) {
        return NextResponse.json({ error: "A screening run supports up to 50 resumes." }, { status: 400 });
      }

      const parseErrors: string[] = [];
      for (const file of files) {
        const name = file.name.toLowerCase();
        if (!/\.(pdf|docx?|txt)$/.test(name)) {
          parseErrors.push(`${file.name}: unsupported file type`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          parseErrors.push(`${file.name}: exceeds the 10 MB limit`);
          continue;
        }

        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          let text = "";
          if (name.endsWith(".pdf")) text = await parsePDF(buffer);
          else if (name.endsWith(".docx") || name.endsWith(".doc")) text = await parseDOCX(buffer);
          else text = buffer.toString("utf-8");

          if (text.trim().length >= 40) resumeTexts.push({ text: normalizeText(text), fileName: file.name });
          else parseErrors.push(`${file.name}: no readable text layer found`);
        } catch {
          parseErrors.push(`${file.name}: document could not be parsed`);
        }
      }

      if (resumeTexts.length === 0) {
        return NextResponse.json({ error: parseErrors[0] || "No readable resume text was extracted." }, { status: 400 });
      }
    }

    if (resumeTexts.length === 0) {
      return NextResponse.json({ error: "No readable resume text was extracted." }, { status: 400 });
    }

    // Compute semantic similarities in batch
    const semanticScores = computeSemanticSimilarity(
      jobDescription,
      resumeTexts.map(r => r.text)
    );

    // Process each candidate
    const processedCandidates = resumeTexts.map((resume, i) => {
      const text = resume.text;
      const name = extractName(text);
      const email = extractEmail(text);
      const phone = extractPhone(text);
      const { level: eduLevel, score: rawEduScore } = extractEducation(text);
      const yearsExp = extractYearsExperience(text);
      const skills = extractSkills(text);

      const { score: skillScore, matched, missing } = computeSkillScore(skills, jobReqs.requiredSkills);
      const experienceScore = computeExperienceScore(yearsExp, jobReqs.minYearsExperience);
      const educationScore = computeEducationScore(eduLevel, jobReqs.educationLevel);

      // Normalize semantic score (cosine similarity can be low, scale up)
      const rawSemantic = semanticScores[i];
      const normalizedSemantic = Math.min(1, rawSemantic * 2.5);

      const compositeScore = computeCompositeScore(
        skillScore,
        normalizedSemantic,
        experienceScore,
        educationScore,
        weights
      );

      const status = scoreToStatus(compositeScore);
      const interviewQuestions = generateInterviewQuestions(missing, skills, jobTitle || "this role");
      const feedback = generateRecruiterFeedback(
        name, compositeScore, skillScore, normalizedSemantic,
        experienceScore, educationScore, matched, missing, yearsExp, eduLevel
      );

      return {
        name,
        email,
        phone,
        resumeText: text.slice(0, 5000),
        fileName: resume.fileName,
        compositeScore,
        skillScore,
        semanticScore: normalizedSemantic,
        experienceScore,
        educationScore,
        yearsExperience: yearsExp,
        education: eduLevel,
        matchedSkills: matched,
        missingSkills: missing,
        status,
        interviewQuestions,
        recruiterNotes: feedback,
      };
    });

    // Sort by composite score and assign ranks
    processedCandidates.sort((a, b) => b.compositeScore - a.compositeScore);
    const rankedCandidates = processedCandidates.map((c, i) => ({ ...c, rank: i + 1 }));

    // Create screening session
    const avgScore = rankedCandidates.reduce((sum, c) => sum + c.compositeScore, 0) / rankedCandidates.length;
    const topMatchCount = rankedCandidates.filter(c => c.compositeScore >= 0.75).length;

    const [newSession] = await db
      .insert(screeningSessions)
      .values({
        userId: session.userId,
        name: sessionName || `${jobTitle || "Screening"} - ${new Date().toLocaleDateString()}`,
        jobTitle: jobTitle || "",
        jobDescription,
        extractedRequirements: jobReqs as unknown as Record<string, unknown>,
        weights: weights as unknown as Record<string, unknown>,
        totalApplicants: rankedCandidates.length,
        topMatchCount,
        avgScore,
        status: "active",
      })
      .returning();

    // Insert candidates
    const insertedCandidates = await db
      .insert(candidates)
      .values(
        rankedCandidates.map(c => ({
          sessionId: newSession.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          resumeText: c.resumeText,
          fileName: c.fileName,
          compositeScore: c.compositeScore,
          skillScore: c.skillScore,
          semanticScore: c.semanticScore,
          experienceScore: c.experienceScore,
          educationScore: c.educationScore,
          yearsExperience: c.yearsExperience,
          education: c.education,
          matchedSkills: c.matchedSkills as unknown as Record<string, unknown>,
          missingSkills: c.missingSkills as unknown as Record<string, unknown>,
          status: c.status,
          rank: c.rank,
          interviewQuestions: c.interviewQuestions as unknown as Record<string, unknown>,
          recruiterNotes: c.recruiterNotes,
        }))
      )
      .returning();

    return NextResponse.json({
      session: newSession,
      candidates: insertedCandidates,
      requirements: jobReqs,
    });
  } catch (error) {
    console.error("Screening error:", error);
    return NextResponse.json({ error: "Screening failed: " + String(error) }, { status: 500 });
  }
}

// ─── Sample resume data ───────────────────────────────────────────────────────
const SAMPLE_RESUMES = [
  {
    fileName: "sarah_chen_resume.pdf",
    text: `Sarah Chen
sarah.chen@email.com | +1 (415) 555-0192 | LinkedIn: linkedin.com/in/sarahchen

SUMMARY
Senior AI/ML Engineer with 7 years of experience building production machine learning systems. Expert in deep learning, NLP, and MLOps. PhD in Computer Science from Stanford University.

EXPERIENCE
Senior ML Engineer — Google DeepMind (2020 - 2024)
- Led development of large-scale NLP models using PyTorch and TensorFlow
- Deployed BERT and GPT-based models serving 50M+ daily requests
- Built MLOps pipelines using Kubernetes, Docker, and Airflow
- Mentored team of 5 junior engineers in ML best practices

ML Engineer — Nvidia (2018 - 2020)
- Implemented Computer Vision models for autonomous driving
- Optimized neural networks using CUDA and TensorRT
- Reduced model inference latency by 40% using quantization techniques

Research Engineer — OpenAI (2017 - 2018)
- Contributed to reinforcement learning research projects
- Implemented custom training loops in Python and TensorFlow

EDUCATION
PhD, Computer Science — Stanford University (2017)
Dissertation: "Attention Mechanisms in Large Language Models"

SKILLS
Python, PyTorch, TensorFlow, Scikit-learn, NLP, Computer Vision, Deep Learning
Kubernetes, Docker, AWS, GCP, Airflow, Kafka, Spark
BERT, GPT, Transformers, LLMs, Hugging Face, FAISS, Pinecone
PostgreSQL, MongoDB, Redis, SQL, Pandas, NumPy
Machine Learning, Reinforcement Learning, Feature Engineering, A/B Testing
Leadership, Communication, Mentoring, Agile, Scrum`,
  },
  {
    fileName: "marcus_johnson_resume.pdf",
    text: `Marcus Johnson
marcus.j@techmail.com | +1 (312) 555-0847

PROFESSIONAL SUMMARY
Full Stack Developer with 5 years experience building scalable web applications. Strong expertise in React, Node.js, TypeScript, and cloud infrastructure. Bachelor's degree in Software Engineering from MIT.

WORK EXPERIENCE
Senior Full Stack Developer — Stripe Inc (2022 - Present)
- Built payment processing dashboard using React, Next.js, and TypeScript
- Designed RESTful APIs and GraphQL services with Node.js and Express
- Managed PostgreSQL and Redis databases for high-traffic applications
- Implemented CI/CD pipelines using GitHub Actions and Docker

Full Stack Developer — Shopify (2020 - 2022)
- Developed e-commerce features using React and Ruby on Rails
- Built microservices architecture with Docker and Kubernetes
- Integrated third-party APIs and webhooks
- Improved application performance by 35% through optimization

Junior Developer — Startup (2019 - 2020)
- Built Vue.js frontend applications
- Worked with Python Django backend

EDUCATION
Bachelor of Science, Software Engineering — MIT (2019)

TECHNICAL SKILLS
React, Next.js, TypeScript, JavaScript, Node.js, Express, Vue.js
Python, Django, Ruby on Rails
PostgreSQL, MongoDB, Redis, MySQL, SQL
AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, GitHub Actions
GraphQL, REST, Microservices
Tailwind CSS, Material UI, Styled Components
Git, Linux, Nginx, CI/CD, DevOps`,
  },
  {
    fileName: "priya_patel_resume.pdf",
    text: `Priya Patel
priya.patel@datamail.com | (650) 555-2341

Data Scientist & ML Engineer
Master's in Statistics, Columbia University — 4 years professional experience

EXPERIENCE

Data Scientist — Netflix (2022 - 2024)
• Built recommendation system models using Python, TensorFlow, and Scikit-learn
• Conducted A/B testing experiments driving 12% increase in user engagement
• Used Spark and PySpark for large-scale data processing
• Created dashboards in Tableau and Power BI for executive reporting

Data Analyst — Meta (2021 - 2022)
• SQL-heavy analysis of user behavior datasets (BigQuery, PostgreSQL)
• Statistical analysis and hypothesis testing using R and Python
• Automated ETL pipelines with Airflow and dbt
• Pandas, NumPy, Matplotlib for data manipulation and visualization

Research Assistant — Columbia University (2019 - 2021)
• Machine learning research using Python and PyTorch
• Published 2 papers on deep learning optimization techniques

EDUCATION
Master of Science, Statistics — Columbia University (2021)
Bachelor of Science, Mathematics — UC Berkeley (2019)

SKILLS
Python (Pandas, NumPy, Scikit-learn, TensorFlow, PyTorch)
SQL, PostgreSQL, MySQL, BigQuery, Snowflake, Redshift
Spark, PySpark, Airflow, dbt, Kafka, ETL
Machine Learning, Deep Learning, NLP, Statistical Analysis
Tableau, Power BI, Matplotlib, Seaborn, Plotly
R, MATLAB, Jupyter
AWS, GCP, Docker
A/B Testing, Feature Engineering, Data Engineering`,
  },
  {
    fileName: "alex_rivera_resume.pdf",
    text: `Alex Rivera
alex.rivera@gmail.com | 555-0234

DevOps / Cloud Engineer
6 years experience in cloud infrastructure and DevOps

EXPERIENCE

Senior DevOps Engineer — Amazon AWS (2021 - 2024)
- Managed large-scale Kubernetes clusters on AWS EKS
- Built infrastructure as code using Terraform and CloudFormation
- Implemented monitoring with Prometheus, Grafana, and ELK Stack
- Designed CI/CD pipelines using Jenkins and GitHub Actions
- Ensured 99.99% uptime for mission-critical services

Cloud Engineer — Microsoft Azure (2019 - 2021)
- Deployed containerized applications using Docker and AKS
- Automated infrastructure with Ansible and PowerShell
- Set up Azure DevOps pipelines and monitoring

Systems Administrator — Tech Corp (2018 - 2019)
- Linux server administration (Ubuntu, CentOS)
- Nginx, Apache web server configuration
- Basic Python and Bash scripting

EDUCATION
Bachelor of Science, Computer Science — UT Austin (2018)

SKILLS
AWS (EC2, S3, EKS, Lambda, RDS, CloudWatch), Azure, GCP
Kubernetes, Docker, Helm, Terraform, Ansible, CloudFormation
Jenkins, GitHub Actions, GitLab CI, CircleCI, CI/CD
Prometheus, Grafana, ELK Stack, Elasticsearch, Logstash, Kibana
Linux, Ubuntu, CentOS, Bash, Python, PowerShell
Nginx, Apache, Serverless, Microservices
Git, GitLab, DevOps, SRE`,
  },
  {
    fileName: "jessica_wong_resume.pdf",
    text: `Jessica Wong
jwong@career.com | (917) 555-0089

OBJECTIVE
Entry-level data analyst seeking opportunities to apply analytical skills.
Recent graduate with 1 year of experience.

EXPERIENCE

Junior Data Analyst — Local Marketing Agency (2023 - 2024)
- Created Excel reports and basic SQL queries
- Used Google Analytics for web traffic analysis
- Made PowerPoint presentations for clients

Internship — Finance Company (2022 - 2023)
- Data entry and spreadsheet management
- Basic data visualization with Excel

EDUCATION
Bachelor of Arts, Business Administration — State University (2022)

SKILLS
Microsoft Excel, PowerPoint, Word
Basic SQL
Google Analytics
Some Python knowledge (beginner)
Good communication skills
Team player`,
  },
  {
    fileName: "david_kim_resume.pdf",
    text: `David Kim
david.kim@techpro.com | +1 (206) 555-0765 | GitHub: github.com/davidkim

PROFILE
Machine Learning Engineer with 3 years of experience specializing in NLP and recommendation systems. Master's degree in Computer Science from Carnegie Mellon University.

EXPERIENCE

ML Engineer — Spotify (2022 - 2024)
- Built NLP-based music recommendation models using Python and PyTorch
- Implemented transformer-based models for audio content classification
- Used Hugging Face, BERT for text understanding features
- Deployed models on AWS using SageMaker, Lambda, and Docker
- Monitored model drift with custom Prometheus metrics and Grafana dashboards

Research ML Engineer — Carnegie Mellon University (2020 - 2022)
- Research on attention mechanisms and graph neural networks
- Published paper at NeurIPS 2021
- Python, PyTorch, TensorFlow, Scikit-learn implementations

Software Engineer Intern — Microsoft (2020)
- Built REST APIs using Python FastAPI
- SQL queries and data manipulation

EDUCATION
Master of Science, Computer Science — Carnegie Mellon University (2022)
Specialization: Machine Learning and AI
Bachelor of Science, Mathematics — University of Washington (2020)

SKILLS
Python, PyTorch, TensorFlow, Scikit-learn, Hugging Face, Transformers
NLP, Deep Learning, Machine Learning, Computer Vision, BERT, GPT
AWS (SageMaker, Lambda, EC2, S3), Docker, Kubernetes
FastAPI, REST, GraphQL, SQL, PostgreSQL, MongoDB
Pandas, NumPy, Matplotlib, Spark, Airflow
Prometheus, Grafana, Git, Linux
A/B Testing, Feature Engineering, MLOps`,
  },
  {
    fileName: "emma_scott_resume.pdf",
    text: `Emma Scott
emma.scott@webdev.io | 555-0312

Frontend Developer — 3 years experience

EXPERIENCE

Frontend Developer — SaaS Startup (2022 - 2024)
- Built React and TypeScript web applications
- Used Next.js for server-side rendering
- Styled with Tailwind CSS and Styled Components
- State management with Redux and Zustand
- Worked with REST APIs and some GraphQL
- Basic Node.js and Express for simple backends

Junior Frontend Developer — Digital Agency (2021 - 2022)
- HTML, CSS, JavaScript development
- WordPress and jQuery projects
- Responsive design with Bootstrap

EDUCATION
Bachelor of Science, Web Development — Online University (2021)

SKILLS
React, Next.js, TypeScript, JavaScript, Vue.js
Tailwind CSS, Bootstrap, Styled Components, SCSS, Sass
Redux, Zustand, MobX
Node.js, Express (basic)
REST APIs, GraphQL (basic)
Git, GitHub, Figma
HTML5, CSS3, Responsive Design`,
  },
  {
    fileName: "raj_sharma_resume.pdf",
    text: `Raj Sharma
raj.sharma@aiml.dev | +91-98765-43210 (relocated to US)

AI RESEARCH ENGINEER
PhD in Machine Learning | 8 years total experience (4 industry, 4 research)

PROFESSIONAL EXPERIENCE

Principal AI Engineer — Anthropic (2022 - Present)
- Led development of constitutional AI training pipelines
- Built large-scale LLM fine-tuning infrastructure using PyTorch and Deepspeed
- Implemented RLHF and reward modeling systems
- Designed vector database solutions using Pinecone and Weaviate
- Managed MLOps on GCP with Kubernetes and Airflow

Senior Research Scientist — Stanford AI Lab (2020 - 2022)
- Research on transformer architectures and attention mechanisms
- Contributed to open-source Hugging Face models
- Papers published: NeurIPS 2021, ICML 2022, ACL 2021

ML Engineer — Uber AI (2018 - 2020)
- Forecasting models using Python, TensorFlow, Scikit-learn
- Real-time ML serving with Kafka and Spark
- A/B testing frameworks for model evaluation

EDUCATION
PhD, Computer Science (Machine Learning) — IIT Delhi + Stanford Exchange (2018)
Dissertation: "Scalable Attention in Neural Sequence Models"

SKILLS
Python, PyTorch, TensorFlow, Keras, JAX, Scikit-learn
NLP, LLMs, Transformers, BERT, GPT, RLHF, Constitutional AI
Hugging Face, LangChain, Vector DB (Pinecone, Weaviate, FAISS, Chroma)
Kubernetes, Docker, GCP, AWS, Airflow, Spark, Kafka, MLOps
Deep Learning, Reinforcement Learning, Computer Vision, Feature Engineering
PostgreSQL, MongoDB, Redis, SQL
Leadership, Research, Mentoring, Communication, Publication`,
  },
];
