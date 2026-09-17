"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignInScreen() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="lb-card max-w-sm w-full text-center">
        <div className="flex justify-center gap-[2px] mb-4" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="block w-2 h-4 rounded-[1px]"
              style={{ background: i < 4 ? "var(--accent)" : "var(--line)" }}
            />
          ))}
        </div>
        <h1 className="font-display text-lg tracking-wide mb-2">LIFEBAR</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          Your visits, medications, and vitals — kept by you, shown to whoever
          you choose.
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={pending}
          className="lb-btn lb-btn-primary w-full"
        >
          {pending ? "Redirecting…" : "Continue with Google"}
        </button>
        {error && (
          <p className="mt-3 text-sm" style={{ color: "var(--critical)" }}>
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
