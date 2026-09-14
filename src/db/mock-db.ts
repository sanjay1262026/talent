import { getTableName } from "drizzle-orm";

interface StoreData {
  users: any[];
  screening_sessions: any[];
  candidates: any[];
  password_reset_tokens: any[];
  nextId: { [table: string]: number };
}

const globalForMock = globalThis as unknown as {
  __talentOsMockStore?: StoreData;
};

function initStore(): StoreData {
  const defaultUser = {
    id: 1,
    name: "Demo Recruiter",
    email: "admin@talentai.com",
    passwordHash: "$2b$10$lNbZ0.vk2wO6e2D91743ke02NQfY48QAxNL360p43wZYJHCycb.Qu", // demo1234
    role: "recruiter",
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleSession = {
    id: 1,
    userId: 1,
    name: "Senior ML Engineer Screening",
    jobTitle: "Senior Machine Learning Engineer",
    jobDescription: "We are seeking a Senior ML Engineer with 5+ years of experience in Python, PyTorch, LLMs, NLP, and MLOps. Strong background in deploying transformers and building scalable ML systems.",
    extractedRequirements: {
      minYearsExperience: 5,
      educationLevel: "Master's Degree",
      requiredSkills: ["Python", "PyTorch", "NLP", "Machine Learning", "Kubernetes", "Docker", "AWS", "Transformers"],
    },
    weights: { skill: 0.4, semantic: 0.35, experience: 0.15, education: 0.1 },
    totalApplicants: 4,
    topMatchCount: 2,
    avgScore: 0.81,
    status: "active",
    createdAt: new Date(Date.now() - 3600000 * 48),
    updatedAt: new Date(Date.now() - 3600000 * 48),
  };

  const sampleCandidates = [
    {
      id: 1,
      sessionId: 1,
      name: "Dr. Sarah Chen",
      email: "sarah.chen@email.com",
      phone: "+1 (415) 555-0192",
      resumeText: "Senior AI/ML Engineer with 7 years of experience building production machine learning systems. Expert in deep learning, NLP, and MLOps. PhD in Computer Science from Stanford University.",
      fileName: "sarah_chen_resume.pdf",
      compositeScore: 0.93,
      skillScore: 0.95,
      semanticScore: 0.92,
      experienceScore: 1.0,
      educationScore: 1.0,
      yearsExperience: 7,
      education: "PhD",
      matchedSkills: ["Python", "PyTorch", "TensorFlow", "NLP", "Machine Learning", "Kubernetes", "Docker", "AWS", "GCP"],
      missingSkills: [],
      status: "top_match",
      rank: 1,
      interviewQuestions: [
        "Can you discuss your approach to quantizing large transformer models to reduce latency?",
        "How do you establish continuous integration pipelines for model drift in production?",
        "Describe a challenge you faced when scaling BERT/GPT workloads to 50M+ daily requests.",
      ],
      recruiterNotes: "Exceptional match across all dimensions. Stanford PhD with 7 years production ML experience at Google DeepMind and Nvidia. Strong leadership and MLOps architecture credentials.",
      createdAt: new Date(Date.now() - 3600000 * 48),
    },
    {
      id: 2,
      sessionId: 1,
      name: "Raj Sharma",
      email: "raj.sharma@aiml.dev",
      phone: "+1 (650) 555-8812",
      resumeText: "AI Research Engineer with PhD in Machine Learning and 8 years total experience. Led LLM training pipelines, RLHF, and constitutional AI.",
      fileName: "raj_sharma_resume.pdf",
      compositeScore: 0.89,
      skillScore: 0.91,
      semanticScore: 0.88,
      experienceScore: 1.0,
      educationScore: 1.0,
      yearsExperience: 8,
      education: "PhD",
      matchedSkills: ["Python", "PyTorch", "NLP", "Machine Learning", "Transformers", "Kubernetes", "Docker", "GCP"],
      missingSkills: ["AWS"],
      status: "top_match",
      rank: 2,
      interviewQuestions: [
        "What strategies do you use for distributing fine-tuning runs across multi-node clusters?",
        "How do you evaluate reward model robustness against reward hacking in RLHF?",
      ],
      recruiterNotes: "High-tier candidate with direct research and production LLM scaling experience. Authored papers at NeurIPS and ICML. Excellent fit for core ML architecture.",
      createdAt: new Date(Date.now() - 3600000 * 48),
    },
    {
      id: 3,
      sessionId: 1,
      name: "David Kim",
      email: "david.kim@techpro.com",
      phone: "+1 (206) 555-0765",
      resumeText: "Machine Learning Engineer with 3 years of experience specializing in NLP and recommendation systems. Master's in CS from Carnegie Mellon University.",
      fileName: "david_kim_resume.pdf",
      compositeScore: 0.76,
      skillScore: 0.82,
      semanticScore: 0.78,
      experienceScore: 0.65,
      educationScore: 0.85,
      yearsExperience: 3,
      education: "Master's Degree",
      matchedSkills: ["Python", "PyTorch", "NLP", "Machine Learning", "Docker", "AWS", "Transformers"],
      missingSkills: ["Kubernetes", "MLOps Lead"],
      status: "potential_fit",
      rank: 3,
      interviewQuestions: [
        "How did you implement drift monitoring on your recommendation models at Spotify?",
        "Describe your experience transitioning models from research notebooks to microservices.",
      ],
      recruiterNotes: "Solid technical background with Carnegie Mellon Master's degree and hands-on Spotify NLP experience. Slightly below the 5-year seniority threshold but strong potential.",
      createdAt: new Date(Date.now() - 3600000 * 48),
    },
    {
      id: 4,
      sessionId: 1,
      name: "Priya Patel",
      email: "priya.patel@datamail.com",
      phone: "+1 (650) 555-2341",
      resumeText: "Data Scientist & ML Engineer with Master's in Statistics from Columbia University. 4 years experience with recommendation systems and ETL.",
      fileName: "priya_patel_resume.pdf",
      compositeScore: 0.68,
      skillScore: 0.70,
      semanticScore: 0.72,
      experienceScore: 0.75,
      educationScore: 0.85,
      yearsExperience: 4,
      education: "Master's Degree",
      matchedSkills: ["Python", "Machine Learning", "Docker", "SQL", "Airflow", "Spark"],
      missingSkills: ["PyTorch", "Kubernetes", "Transformers"],
      status: "potential_fit",
      rank: 4,
      interviewQuestions: [
        "Can you discuss a project where you bridged data science experimentation and production engineering?",
      ],
      recruiterNotes: "Strong statistical foundations and production data pipeline skills from Netflix and Meta. Lacks deep transformer and deep learning specialization.",
      createdAt: new Date(Date.now() - 3600000 * 48),
    },
  ];

  return {
    users: [defaultUser],
    screening_sessions: [sampleSession],
    candidates: sampleCandidates,
    password_reset_tokens: [],
    nextId: {
      users: 2,
      screening_sessions: 2,
      candidates: 5,
      password_reset_tokens: 1,
    },
  };
}

if (!globalForMock.__talentOsMockStore) {
  globalForMock.__talentOsMockStore = initStore();
}

const store = globalForMock.__talentOsMockStore;

function resolveTableName(table: any): string {
  try {
    const name = getTableName(table);
    if (name) return name;
  } catch {
    // fallback
  }
  return (table as any)?._?.name || (table as any)?.[Symbol.for("drizzle:Name")] || "users";
}

function getRecordValue(record: any, colName: string): any {
  if (record == null) return undefined;
  if (colName in record) return record[colName];
  const camel = colName.replace(/_([a-z0-9])/g, (_, g) => g.toUpperCase());
  if (camel in record) return record[camel];
  const snake = colName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  if (snake in record) return record[snake];
  return undefined;
}

function evalSimpleChunks(record: any, chunks: any[]): boolean {
  const colChunk = chunks.find(c => c && typeof c === "object" && typeof c.name === "string");
  if (!colChunk) return true;
  const colName = colChunk.name;
  const recVal = getRecordValue(record, colName);

  const strChunk = chunks.find(
    c => c && c.value && Array.isArray(c.value) && c.value.some((v: string) => v.includes("=") || v.includes("null") || v.includes(">") || v.includes("<"))
  );
  const opStr = strChunk ? strChunk.value.join("").trim().toLowerCase() : "=";

  if (opStr.includes("is null")) {
    return recVal === null || recVal === undefined;
  }
  if (opStr.includes("is not null")) {
    return recVal !== null && recVal !== undefined;
  }

  const colIdx = chunks.indexOf(colChunk);
  const valChunk = chunks.find((c, i) => i > colIdx && (!c || !c.value || !Array.isArray(c.value)));
  const targetVal = valChunk;

  if (opStr.includes(">")) {
    const d1 = new Date(recVal).getTime();
    const d2 = new Date(targetVal).getTime();
    if (!isNaN(d1) && !isNaN(d2)) return d1 > d2;
    return recVal > targetVal;
  }
  if (opStr.includes("<")) {
    const d1 = new Date(recVal).getTime();
    const d2 = new Date(targetVal).getTime();
    if (!isNaN(d1) && !isNaN(d2)) return d1 < d2;
    return recVal < targetVal;
  }

  return recVal === targetVal || String(recVal) === String(targetVal);
}

function evalSql(record: any, sql: any): boolean {
  if (!sql) return true;
  if (!sql.queryChunks || !Array.isArray(sql.queryChunks)) return true;
  const chunks = sql.queryChunks;

  if (chunks.length === 3 && chunks[0]?.value?.[0] === "(" && chunks[2]?.value?.[0] === ")") {
    return evalSql(record, chunks[1]);
  }

  const andChunks: any[][] = [];
  let currentGroup: any[] = [];
  for (const c of chunks) {
    const strVal = c?.value?.[0];
    if (typeof strVal === "string" && strVal.trim().toLowerCase() === "and") {
      andChunks.push(currentGroup);
      currentGroup = [];
    } else {
      currentGroup.push(c);
    }
  }

  if (andChunks.length > 0) {
    andChunks.push(currentGroup);
    return andChunks.every(g => {
      if (g.length === 1 && g[0]?.queryChunks) return evalSql(record, g[0]);
      return evalSimpleChunks(record, g);
    });
  }

  return evalSimpleChunks(record, chunks);
}

function projectRecord(row: any, selection?: Record<string, any>): any {
  if (!selection || Object.keys(selection).length === 0) {
    return { ...row };
  }
  const projected: Record<string, any> = {};
  for (const [key, colDef] of Object.entries(selection)) {
    const colName = (colDef && typeof colDef === "object" && "name" in colDef) ? (colDef as any).name : key;
    projected[key] = getRecordValue(row, colName) ?? getRecordValue(row, key);
  }
  return projected;
}

function sortRows(rows: any[], orderExprs: any[]): any[] {
  if (!orderExprs || orderExprs.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const expr of orderExprs) {
      let colName = "createdAt";
      let isDesc = true;
      if (expr?.queryChunks) {
        const chunks = expr.queryChunks;
        const colChunk = chunks.find((c: any) => c && typeof c === "object" && typeof c.name === "string");
        if (colChunk) colName = colChunk.name;
        const strChunk = chunks.find((c: any) => c && c.value && Array.isArray(c.value));
        if (strChunk && strChunk.value.join("").toLowerCase().includes("asc")) isDesc = false;
      }
      const valA = getRecordValue(a, colName);
      const valB = getRecordValue(b, colName);
      const timeA = new Date(valA).getTime();
      const timeB = new Date(valB).getTime();
      const comp = (!isNaN(timeA) && !isNaN(timeB)) ? timeA - timeB : String(valA ?? "").localeCompare(String(valB ?? ""));
      if (comp !== 0) return isDesc ? -comp : comp;
    }
    return 0;
  });
}

export function createMockDb(): any {
  return {
    select: (selection?: Record<string, any>) => {
      let selectedTable = "";
      let whereCond: any = null;
      let orderExprs: any[] = [];
      let limitCount: number | null = null;

      const queryBuilder = {
        from: (table: any) => {
          selectedTable = resolveTableName(table);
          return queryBuilder;
        },
        where: (cond: any) => {
          whereCond = cond;
          return queryBuilder;
        },
        orderBy: (...exprs: any[]) => {
          orderExprs = exprs;
          return queryBuilder;
        },
        limit: (n: number) => {
          limitCount = n;
          return queryBuilder;
        },
        then: (resolve: (data: any) => void, reject?: (err: any) => void) => {
          try {
            const tableData = (store as any)[selectedTable] || [];
            let results = tableData.filter((row: any) => evalSql(row, whereCond));
            results = sortRows(results, orderExprs);
            if (limitCount != null) {
              results = results.slice(0, limitCount);
            }
            const mapped = results.map((row: any) => projectRecord(row, selection));
            resolve(mapped);
          } catch (error) {
            if (reject) reject(error);
            else throw error;
          }
        },
      };

      return queryBuilder;
    },

    insert: (table: any) => {
      const tableName = resolveTableName(table);
      let valuesToInsert: any = null;

      const insertBuilder = {
        values: (val: any) => {
          valuesToInsert = val;
          return insertBuilder;
        },
        returning: () => insertBuilder,
        then: (resolve: (data: any) => void, reject?: (err: any) => void) => {
          try {
            if (!store[tableName as keyof StoreData]) {
              (store as any)[tableName] = [];
            }
            const tableList = (store as any)[tableName] as any[];
            if (!store.nextId[tableName]) {
              store.nextId[tableName] = 1;
            }

            const items = Array.isArray(valuesToInsert) ? valuesToInsert : [valuesToInsert];
            const inserted: any[] = [];

            for (const item of items) {
              const id = item.id ?? store.nextId[tableName]++;
              const record = {
                id,
                createdAt: new Date(),
                updatedAt: new Date(),
                ...item,
              };
              tableList.push(record);
              inserted.push(record);
            }

            resolve(Array.isArray(valuesToInsert) ? inserted : inserted);
          } catch (error) {
            if (reject) reject(error);
            else throw error;
          }
        },
      };

      return insertBuilder;
    },

    update: (table: any) => {
      const tableName = resolveTableName(table);
      let updateValues: any = {};
      let whereCond: any = null;

      const updateBuilder = {
        set: (vals: any) => {
          updateValues = vals;
          return updateBuilder;
        },
        where: (cond: any) => {
          whereCond = cond;
          return updateBuilder;
        },
        returning: () => updateBuilder,
        then: (resolve: (data: any) => void, reject?: (err: any) => void) => {
          try {
            const tableList = (store as any)[tableName] || [];
            const updated: any[] = [];
            for (const row of tableList) {
              if (evalSql(row, whereCond)) {
                Object.assign(row, updateValues, { updatedAt: new Date() });
                updated.push({ ...row });
              }
            }
            resolve(updated);
          } catch (error) {
            if (reject) reject(error);
            else throw error;
          }
        },
      };

      return updateBuilder;
    },

    delete: (table: any) => {
      const tableName = resolveTableName(table);
      let whereCond: any = null;

      const deleteBuilder = {
        where: (cond: any) => {
          whereCond = cond;
          return deleteBuilder;
        },
        then: (resolve: (data: any) => void, reject?: (err: any) => void) => {
          try {
            const tableList = (store as any)[tableName] || [];
            const initialLen = tableList.length;
            (store as any)[tableName] = tableList.filter((row: any) => !evalSql(row, whereCond));
            const deletedCount = initialLen - (store as any)[tableName].length;
            resolve({ count: deletedCount });
          } catch (error) {
            if (reject) reject(error);
            else throw error;
          }
        },
      };

      return deleteBuilder;
    },

    execute: async (_query: any) => {
      return { rows: [] };
    },
  };
}
