import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { screeningSessions, candidates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await db
    .select()
    .from(screeningSessions)
    .where(eq(screeningSessions.userId, session.userId))
    .orderBy(desc(screeningSessions.createdAt))
    .limit(20);

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, jobTitle, jobDescription, extractedRequirements, weights } = body;

  const [newSession] = await db
    .insert(screeningSessions)
    .values({
      userId: session.userId,
      name: name || `Screening ${new Date().toLocaleDateString()}`,
      jobTitle: jobTitle || "",
      jobDescription,
      extractedRequirements,
      weights,
    })
    .returning();

  return NextResponse.json({ session: newSession });
}
