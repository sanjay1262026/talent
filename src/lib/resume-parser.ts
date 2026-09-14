import { ALL_SKILLS, SKILL_SYNONYMS, normalizeSkill } from "./skills-taxonomy";

// ─── Text normalization ────────────────────────────────────────────────────────
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Name extraction ───────────────────────────────────────────────────────────
export function extractName(text: string): string {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  const ignoredLine = /(?:@|https?:\/\/|linkedin|github|resume|curriculum vitae|technical tools?|skills?|education|experience|objective|summary|projects?|certifications?|languages?|references?|phone|email|address|school|college|university|institute|academy|institution|campus|department|bachelor|master|degree|diploma)\b/i;
  const namePatterns = [
    /^[A-Z][a-z]+(?:[.'-][A-Z][a-z]+)?(?:\s+[A-Z][a-z]+(?:[.'-][A-Z][a-z]+)?){1,3}$/,
    /^[A-Z][A-Z.'-]+(?:\s+[A-Z][A-Z.'-]+){1,3}$/,
  ];

  // OCR can place a section heading before the name, so inspect the whole header
  // rather than assuming the first extracted line is the candidate's name.
  for (const line of lines.slice(0, 20)) {
    const candidate = line.split(/[|,–]/)[0].trim();
    if (
      candidate.length >= 3 &&
      candidate.length < 60 &&
      !ignoredLine.test(candidate) &&
      !/\d|:/.test(candidate) &&
      namePatterns.some(pattern => pattern.test(candidate))
    ) {
      return candidate;
    }
  }

  // Some OCR layouts omit the name but preserve the email address. Use its
  // local part rather than presenting a school or section heading as a name.
  const email = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0];
  if (email) {
    const localPart = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\d+/g, " ").trim();
    const emailName = localPart.split(/\s+/).filter(Boolean).map(part => part[0].toUpperCase() + part.slice(1).toLowerCase()).join(" ");
    if (emailName.length >= 3) return emailName;
  }

  return "Unknown Candidate";
}

// ─── Email extraction ──────────────────────────────────────────────────────────
export function extractEmail(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : "";
}

// ─── Phone extraction ──────────────────────────────────────────────────────────
export function extractPhone(text: string): string {
  const patterns = [
    /(\+?1?\s*[-.]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/,
    /(\+\d{1,3}[\s-]?\d{6,14})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0].trim();
  }
  return "";
}

// ─── Education extraction ──────────────────────────────────────────────────────
export type EducationLevel = "PhD" | "Masters" | "Bachelors" | "Associate" | "High School" | "Unknown";

const EDU_PATTERNS: Array<{ pattern: RegExp; level: EducationLevel; weight: number }> = [
  { pattern: /\b(ph\.?d|doctor(?:ate)?|d\.?phil)\b/i, level: "PhD", weight: 4 },
  { pattern: /\b(m\.?s\.?|m\.?sc\.?|m\.?eng\.?|m\.?tech\.?|master(?:s)?(?:\s+of\s+\w+)?)\b/i, level: "Masters", weight: 3 },
  { pattern: /\b(m\.?b\.?a)\b/i, level: "Masters", weight: 3 },
  { pattern: /\b(b\.?s\.?|b\.?sc\.?|b\.?e\.?|b\.?tech\.?|bachelor(?:s)?(?:\s+of\s+\w+)?|b\.?a\.?)\b/i, level: "Bachelors", weight: 2 },
  { pattern: /\b(associate(?:s)?(?:\s+degree)?|a\.?a\.?s?)\b/i, level: "Associate", weight: 1 },
  { pattern: /\b(high school|secondary|ged|hsc|ssc)\b/i, level: "High School", weight: 0 },
];

export function extractEducation(text: string): { level: EducationLevel; score: number } {
  let highestLevel: EducationLevel = "Unknown";
  let highestWeight = -1;

  for (const { pattern, level, weight } of EDU_PATTERNS) {
    if (pattern.test(text)) {
      if (weight > highestWeight) {
        highestWeight = weight;
        highestLevel = level;
      }
    }
  }

  const scoreMap: Record<EducationLevel, number> = {
    PhD: 1.0,
    Masters: 0.85,
    Bachelors: 0.7,
    Associate: 0.45,
    "High School": 0.2,
    Unknown: 0.3,
  };

  return { level: highestLevel, score: scoreMap[highestLevel] };
}

// ─── Experience extraction ─────────────────────────────────────────────────────
export function extractYearsExperience(text: string): number {
  const patterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|exp(?:erience)?|work)/i,
    /(\d+)\s*-\s*(\d+)\s*years?\s+(?:of\s+)?(?:experience|work)/i,
    /experience\s*:?\s*(\d+)\+?\s*years?/i,
    /over\s+(\d+)\s+years?\s+(?:of\s+)?(?:experience|work)/i,
  ];

  let maxYears = 0;
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const years = parseInt(m[1], 10);
      if (years > maxYears && years < 50) maxYears = years;
    }
  }

  // Estimate from date ranges
  const dateRanges = text.matchAll(/((?:19|20)\d{2})\s*[-–—to]+\s*((?:19|20)\d{2}|present|current|now)/gi);
  let totalFromDates = 0;
  const currentYear = new Date().getFullYear();
  for (const m of dateRanges) {
    const start = parseInt(m[1], 10);
    const endStr = m[2].toLowerCase();
    const end = /present|current|now/.test(endStr) ? currentYear : parseInt(m[2], 10);
    if (!isNaN(start) && !isNaN(end) && end > start && end - start < 15) {
      totalFromDates += end - start;
    }
  }

  const estimated = Math.round(totalFromDates * 0.8);
  return Math.max(maxYears, estimated, 0);
}

// ─── Skills extraction ─────────────────────────────────────────────────────────
export function extractSkills(text: string): string[] {
  const found = new Set<string>();
  const normalizedText = text.toLowerCase();

  // Build a comprehensive search list including synonyms
  const allTerms: Array<{ term: string; canonical: string }> = [];
  for (const skill of ALL_SKILLS) {
    allTerms.push({ term: skill.toLowerCase(), canonical: skill });
    // Add synonyms
    const synonyms = SKILL_SYNONYMS[skill] || [];
    for (const syn of synonyms) {
      allTerms.push({ term: syn.toLowerCase(), canonical: skill });
    }
  }

  for (const { term, canonical } of allTerms) {
    // Word boundary matching
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    const regex = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, "i");
    if (regex.test(normalizedText)) {
      found.add(normalizeSkill(canonical));
    }
  }

  return Array.from(found);
}

// ─── TF-IDF Vectorizer ────────────────────────────────────────────────────────
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function getBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return bigrams;
}

function buildVocab(documents: string[]): string[] {
  const vocab = new Set<string>();
  for (const doc of documents) {
    const tokens = tokenize(doc);
    tokens.forEach(t => vocab.add(t));
    getBigrams(tokens).forEach(b => vocab.add(b));
  }
  return Array.from(vocab);
}

function tfIdf(doc: string, vocab: string[], idf: Map<string, number>): number[] {
  const tokens = tokenize(doc);
  const bigrams = getBigrams(tokens);
  const allTokens = [...tokens, ...bigrams];
  const tf = new Map<string, number>();
  for (const t of allTokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }

  return vocab.map(term => {
    const rawTf = tf.get(term) || 0;
    // Sublinear TF scaling
    const scaledTf = rawTf > 0 ? 1 + Math.log(rawTf) : 0;
    return scaledTf * (idf.get(term) || 0);
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function computeSemanticSimilarity(jobDesc: string, resumes: string[]): number[] {
  const documents = [jobDesc, ...resumes];
  const vocab = buildVocab(documents);

  // Compute IDF
  const idf = new Map<string, number>();
  const N = documents.length;
  for (const term of vocab) {
    const df = documents.filter(doc => {
      const tokens = tokenize(doc);
      const bigrams = getBigrams(tokens);
      return [...tokens, ...bigrams].includes(term);
    }).length;
    idf.set(term, Math.log((N + 1) / (df + 1)) + 1);
  }

  const vectors = documents.map(doc => tfIdf(doc, vocab, idf));
  const jobVector = vectors[0];

  return resumes.map((_, i) => cosineSimilarity(jobVector, vectors[i + 1]));
}

// ─── Experience score ──────────────────────────────────────────────────────────
export function computeExperienceScore(candidateYears: number, requiredYears: number): number {
  if (requiredYears === 0) return 0.8;
  if (candidateYears === 0) return 0.1;
  if (candidateYears >= requiredYears) {
    // Diminishing returns for over-qualification
    const excess = candidateYears - requiredYears;
    return Math.min(1, 0.8 + (excess * 0.02));
  }
  return Math.max(0.1, (candidateYears / requiredYears) * 0.8);
}

// ─── Skill match score ────────────────────────────────────────────────────────
export function computeSkillScore(
  candidateSkills: string[],
  requiredSkills: string[]
): { score: number; matched: string[]; missing: string[] } {
  if (requiredSkills.length === 0) return { score: 0.5, matched: candidateSkills.slice(0, 5), missing: [] };
  const candidateSet = new Set(candidateSkills.map(s => s.toLowerCase()));
  const matched = requiredSkills.filter(s => candidateSet.has(s.toLowerCase()));
  const missing = requiredSkills.filter(s => !candidateSet.has(s.toLowerCase()));
  const score = matched.length / requiredSkills.length;
  return { score, matched, missing };
}

// ─── Job requirements extraction ──────────────────────────────────────────────
export interface JobRequirements {
  minYearsExperience: number;
  educationLevel: EducationLevel;
  requiredSkills: string[];
}

export function extractJobRequirements(jobDesc: string): JobRequirements {
  const skills = extractSkills(jobDesc);
  const yearsMatch = jobDesc.match(/(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|exp)/i);
  const minYears = yearsMatch ? parseInt(yearsMatch[1], 10) : 3;
  const { level } = extractEducation(jobDesc);

  return {
    minYearsExperience: minYears,
    educationLevel: level === "Unknown" ? "Bachelors" : level,
    requiredSkills: skills,
  };
}

// ─── Education score ──────────────────────────────────────────────────────────
export function computeEducationScore(
  candidateLevel: EducationLevel,
  requiredLevel: EducationLevel
): number {
  const levels: EducationLevel[] = ["High School", "Associate", "Bachelors", "Masters", "PhD"];
  const reqIdx = levels.indexOf(requiredLevel);
  const candIdx = levels.indexOf(candidateLevel);
  if (candIdx === -1 || reqIdx === -1) return 0.4;
  if (candIdx >= reqIdx) return 1.0;
  const diff = reqIdx - candIdx;
  return Math.max(0.2, 1 - diff * 0.25);
}

// ─── Interview question generator ────────────────────────────────────────────
export function generateInterviewQuestions(
  missingSkills: string[],
  candidateSkills: string[],
  jobTitle: string
): string[] {
  const questions: string[] = [];

  if (missingSkills.length > 0) {
    const skill = missingSkills[0];
    questions.push(`You don't have listed ${skill} experience — walk me through your approach to quickly ramping up on an unfamiliar technology stack like ${skill}.`);
  }

  if (missingSkills.length > 1) {
    const skill = missingSkills[1];
    questions.push(`The role requires strong ${skill} proficiency. How would you bridge the gap between your current skill set and the ${skill} requirements within the first 90 days?`);
  }

  questions.push(`Describe a technically complex project where you had to make an architectural decision under uncertainty. What was your decision-making framework?`);

  if (candidateSkills.includes("Machine Learning") || candidateSkills.includes("Python")) {
    questions.push(`Walk me through how you would design a production-grade ML pipeline from data ingestion to model deployment and monitoring.`);
  } else if (candidateSkills.includes("React") || candidateSkills.includes("Node.js")) {
    questions.push(`How do you approach performance optimization in a large-scale React application? Give a specific example from your experience.`);
  } else {
    questions.push(`Tell me about a time you disagreed with a technical decision made by leadership. How did you handle it and what was the outcome?`);
  }

  questions.push(`Given your background in ${candidateSkills.slice(0, 3).join(", ")}, how do you see yourself contributing uniquely to the ${jobTitle} role within the first 6 months?`);

  return questions.slice(0, 4);
}

// ─── Composite score calculator ───────────────────────────────────────────────
export interface Weights {
  skill: number;
  semantic: number;
  experience: number;
  education: number;
}

export function computeCompositeScore(
  skillScore: number,
  semanticScore: number,
  experienceScore: number,
  educationScore: number,
  weights: Weights
): number {
  const total = weights.skill + weights.semantic + weights.experience + weights.education;
  if (total === 0) return 0;

  return (
    (skillScore * weights.skill +
      semanticScore * weights.semantic +
      experienceScore * weights.experience +
      educationScore * weights.education) /
    total
  );
}

// ─── Recruiter feedback generator ────────────────────────────────────────────
export function generateRecruiterFeedback(
  name: string,
  compositeScore: number,
  skillScore: number,
  semanticScore: number,
  experienceScore: number,
  educationScore: number,
  matchedSkills: string[],
  missingSkills: string[],
  yearsExp: number,
  education: string
): string {
  const scorePercent = Math.round(compositeScore * 100);
  const status = compositeScore >= 0.75 ? "strong" : compositeScore >= 0.6 ? "moderate" : "limited";

  let feedback = `${name} demonstrates a ${status} overall alignment (${scorePercent}%) with the job requirements. `;

  if (matchedSkills.length > 0) {
    feedback += `Key strengths include proficiency in ${matchedSkills.slice(0, 4).join(", ")}, `;
  }

  if (yearsExp > 0) {
    feedback += `backed by ${yearsExp} years of professional experience. `;
  }

  if (education !== "Unknown") {
    feedback += `Educational background: ${education}. `;
  }

  if (missingSkills.length > 0) {
    feedback += `Notable skill gaps: ${missingSkills.slice(0, 3).join(", ")}. `;
  }

  if (compositeScore >= 0.75) {
    feedback += `Recommend for immediate technical interview and fast-track shortlisting.`;
  } else if (compositeScore >= 0.6) {
    feedback += `Potential fit — consider for a preliminary screening call to assess cultural alignment and learning agility.`;
  } else {
    feedback += `Below threshold — may benefit from additional experience or skills development before re-applying.`;
  }

  return feedback;
}
