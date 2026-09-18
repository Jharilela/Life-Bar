"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton({ className }: { className?: string }) {
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
    <div>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={pending}
        className={className ?? "lb-btn lb-btn-primary text-sm"}
      >
        {pending ? "Redirecting…" : "Sign in with Google"}
      </button>
      {error && (
        <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
