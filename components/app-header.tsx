import Link from "next/link";
import { signOut } from "@/app/dashboard/actions";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export function AppHeader({ greeting, authed = true }: { greeting?: string; authed?: boolean }) {
  return (
    <div className="flex items-center gap-3.5 flex-wrap mb-1.5">
      <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
        <span className="flex items-end gap-[2px]" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="block w-[6px] h-[15px] rounded-[1px]"
              style={{ background: i < 4 ? "var(--accent)" : "var(--line)" }}
            />
          ))}
        </span>
        <span className="font-display text-[17px] tracking-wide text-[var(--ink)]">
          LIFEBAR
        </span>
      </Link>
      {greeting && <span className="text-sm text-[var(--muted)] mr-auto">{greeting}</span>}

      {authed ? (
        <>
          <Link href="/dashboard/sharing" className="lb-btn lb-btn-primary text-sm">
            Share ⤴
          </Link>
          <form action={signOut}>
            <button type="submit" className="lb-btn lb-btn-ghost text-sm">
              Sign out
            </button>
          </form>
        </>
      ) : (
        <div className="flex items-center gap-2 ml-auto text-right">
          <span className="text-xs text-[var(--muted)] max-w-[220px]">
            Saved in this browser only — sign in to keep it permanently.
          </span>
          <GoogleSignInButton className="lb-btn lb-btn-primary text-sm" />
        </div>
      )}
    </div>
  );
}
