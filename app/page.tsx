import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignInScreen } from "@/components/sign-in-screen";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return <SignInScreen />;
}
