import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ShareGrant, ShareLink } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { CopyLinkButton } from "@/components/copy-link-button";
import { createShareLink, grantAccess, revokeGrant, revokeShareLink } from "@/app/dashboard/actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function SharingPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/dashboard");

  const [linksRes, grantsRes] = await Promise.all([
    supabase
      .from("share_links")
      .select("id, token, label, expires_at, revoked_at, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("share_grants")
      .select("id, grantee_email, revoked_at, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const links = (linksRes.data ?? []) as ShareLink[];
  const grants = (grantsRes.data ?? []) as ShareGrant[];
  const origin = await siteOrigin();

  const activeLinks = links.filter((l) => !l.revoked_at);
  const activeGrants = grants.filter((g) => !g.revoked_at);

  return (
    <main className="max-w-2xl mx-auto px-6 py-8 pb-20">
      <AppHeader />
      <h1 className="font-display text-sm tracking-wide text-[var(--accent-ink)] mt-6 mb-4">
        SHARING &amp; ACCESS
      </h1>

      <article className="lb-card mb-4">
        <h2 className="lb-card-title mb-3">Share links</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Anyone with a link can view a read-only summary — no sign-in needed. Good for handing to a
          doctor on the spot.
        </p>

        {activeLinks.length > 0 && (
          <ul className="space-y-3 mb-4">
            {activeLinks.map((link) => {
              const url = `${origin}/share/${link.token}`;
              return (
                <li
                  key={link.id}
                  className="flex justify-between items-center gap-3 flex-wrap border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0"
                >
                  <div>
                    <div className="text-sm font-semibold">{link.label || "Untitled link"}</div>
                    <div className="text-xs text-[var(--muted)]">
                      Created {formatDate(link.created_at)}
                      {link.expires_at ? ` · expires ${formatDate(link.expires_at)}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CopyLinkButton url={url} />
                    <form action={revokeShareLink.bind(null, link.id)}>
                      <button type="submit" className="lb-btn lb-btn-danger text-xs">
                        Revoke
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form action={createShareLink} className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="lb-label" htmlFor="label">
              Label (optional)
            </label>
            <input className="lb-input" id="label" name="label" placeholder="For Dr. Chen" />
          </div>
          <div>
            <label className="lb-label" htmlFor="expires_in_days">
              Expires
            </label>
            <select className="lb-select" id="expires_in_days" name="expires_in_days" defaultValue="">
              <option value="">Never</option>
              <option value="1">1 day</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
            </select>
          </div>
          <button type="submit" className="lb-btn lb-btn-primary">
            Create link
          </button>
        </form>
      </article>

      <article className="lb-card">
        <h2 className="lb-card-title mb-3">People with access</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Grant ongoing access to a specific Google account — a family doctor or family member. They
          sign in with that Google account to view your record; you can revoke anytime.
        </p>

        {activeGrants.length > 0 && (
          <ul className="space-y-3 mb-4">
            {activeGrants.map((grant) => (
              <li
                key={grant.id}
                className="flex justify-between items-center gap-3 flex-wrap border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0"
              >
                <div>
                  <div className="text-sm font-semibold">{grant.grantee_email}</div>
                  <div className="text-xs text-[var(--muted)]">Since {formatDate(grant.created_at)}</div>
                </div>
                <form action={revokeGrant.bind(null, grant.id)}>
                  <button type="submit" className="lb-btn lb-btn-danger text-xs">
                    Revoke
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={grantAccess} className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="lb-label" htmlFor="email">
              Google account email
            </label>
            <input
              className="lb-input"
              type="email"
              id="email"
              name="email"
              placeholder="doctor@clinic.com"
              required
            />
          </div>
          <button type="submit" className="lb-btn lb-btn-primary">
            Grant access
          </button>
        </form>
      </article>
    </main>
  );
}
