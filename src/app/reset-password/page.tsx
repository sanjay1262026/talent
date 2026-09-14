import { Suspense } from "react";
import type { Metadata } from "next";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "Reset password — TalentOS",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white">
          <span className="text-[11px] text-[#70747d]">Loading…</span>
        </main>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
