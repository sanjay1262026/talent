import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function findValidToken(token: string) {
  if (!token || token.length < 32 || token.length > 128) return null;
  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hashToken(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  return record || null;
}

// GET /api/auth/reset-password?token=... — used by the page to verify the link
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    const record = await findValidToken(token);
    return NextResponse.json({ valid: Boolean(record) });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/auth/reset-password — applies the new password
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Your new password must be at least 8 characters long." },
        { status: 400 }
      );
    }
    if (password.length > 128) {
      return NextResponse.json({ error: "Password is too long." }, { status: 400 });
    }

    const record = await findValidToken(token);
    if (!record) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, record.userId));

    // Mark this token used and invalidate every other outstanding token for the user.
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.userId, record.userId));

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
