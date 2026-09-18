"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SHARING_PATH = "/dashboard/sharing";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/dashboard");
}

export async function createShareLink(formData: FormData) {
  const label = str(formData, "label");
  const expiresInDays = str(formData, "expires_in_days");

  const token = randomBytes(24).toString("base64url");
  const expiresAt = expiresInDays
    ? new Date(Date.now() + Number(expiresInDays) * 86_400_000).toISOString()
    : null;

  const supabase = await createClient();
  const { error } = await supabase.from("share_links").insert({
    token,
    label: label || null,
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);

  revalidatePath(SHARING_PATH);
}

export async function revokeShareLink(linkId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", linkId);
  if (error) throw new Error(error.message);

  revalidatePath(SHARING_PATH);
}

const EmailSchema = z.email();

export async function grantAccess(formData: FormData) {
  const email = EmailSchema.parse(str(formData, "email").toLowerCase());

  const supabase = await createClient();
  const { error } = await supabase
    .from("share_grants")
    .upsert(
      { grantee_email: email, revoked_at: null },
      { onConflict: "owner_id,grantee_email" }
    );
  if (error) throw new Error(error.message);

  revalidatePath(SHARING_PATH);
}

export async function revokeGrant(grantId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("share_grants")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", grantId);
  if (error) throw new Error(error.message);

  revalidatePath(SHARING_PATH);
}
