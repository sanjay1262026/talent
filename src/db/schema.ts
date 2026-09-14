import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// Users table for recruiter authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("recruiter"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Screening sessions table
export const screeningSessions = pgTable("screening_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  jobTitle: varchar("job_title", { length: 255 }),
  jobDescription: text("job_description").notNull(),
  extractedRequirements: jsonb("extracted_requirements"),
  weights: jsonb("weights"),
  totalApplicants: integer("total_applicants").default(0),
  topMatchCount: integer("top_match_count").default(0),
  avgScore: real("avg_score").default(0),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => screeningSessions.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 100 }),
  resumeText: text("resume_text"),
  fileName: varchar("file_name", { length: 255 }),
  // Scores
  compositeScore: real("composite_score").default(0),
  skillScore: real("skill_score").default(0),
  semanticScore: real("semantic_score").default(0),
  experienceScore: real("experience_score").default(0),
  educationScore: real("education_score").default(0),
  // Extracted data
  yearsExperience: real("years_experience").default(0),
  education: varchar("education", { length: 100 }),
  matchedSkills: jsonb("matched_skills"),
  missingSkills: jsonb("missing_skills"),
  status: varchar("status", { length: 50 }).default("pending"),
  rank: integer("rank"),
  interviewQuestions: jsonb("interview_questions"),
  recruiterNotes: text("recruiter_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One-time password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ScreeningSession = typeof screeningSessions.$inferSelect;
export type InsertScreeningSession = typeof screeningSessions.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;