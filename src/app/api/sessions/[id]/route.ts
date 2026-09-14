import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { screeningSessions, candidates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sessionId = parseInt(id, 10);

  const [screeningSession] = await db
    .select()
    .from(screeningSessions)
    .where(
      and(
        eq(screeningSessions.id, sessionId),
        eq(screeningSessions.userId, session.userId)
      )
    )
    .limit(1);

  if (!screeningSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const sessionCandidates = await db
    .select()
    .from(candidates)
    .where(eq(candidates.sessionId, sessionId));

  return NextResponse.json({ session: screeningSession, candidates: sessionCandidates });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sessionId = parseInt(id, 10);

  await db.delete(candidates).where(eq(candidates.sessionId, sessionId));
  await db.delete(screeningSessions).where(
    and(
      eq(screeningSessions.id, sessionId),
      eq(screeningSessions.userId, session.userId)
    )
  );

  return NextResponse.json({ success: true });
}
