import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 60 minutes
const GENERIC_MESSAGE =
  "If an account exists for that email address, a password reset link has been sent.";

function buildBaseUrl(req: NextRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    let body: { email?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return the same message so accounts cannot be enumerated.
    if (!user) {
      return NextResponse.json({ message: GENERIC_MESSAGE, emailConfigured: isEmailConfigured() });
    }

    // Invalidate any outstanding tokens for this user.
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.userId, user.id));

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${buildBaseUrl(req)}/reset-password?token=${token}`;

    let emailSent = false;
    if (isEmailConfigured()) {
      try {
        await sendPasswordResetEmail(email, user.name, resetUrl);
        emailSent = true;
      } catch (error) {
        console.error("Failed to send password reset email:", error);
      }
    }

    if (!emailSent) {
      // Helpful in development / preview environments without an SMTP server —
      // the link is only ever written to the server console, never to the client.
      console.info(
        `[TalentOS] No SMTP configured. Password reset link for ${email}:\n  ${resetUrl}\n  Configure SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM to email users instead.`
      );
    }

    const allowPreviewLink = process.env.NODE_ENV !== "production";
    return NextResponse.json({
      message: emailSent
        ? GENERIC_MESSAGE
        : "Email delivery is not configured on this server. The reset link has been written to the server logs, or configure SMTP to enable email delivery.",
      emailConfigured: emailSent,
      ...(allowPreviewLink && !emailSent ? { devResetUrl: resetUrl } : {}),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
