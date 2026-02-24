import { redirect } from "next/navigation";
import AuthPanel from "@/components/AuthPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export default async function HomePage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="page-center">
      <div className="auth-top">
        <ThemeToggle />
      </div>
      <AuthPanel />
    </main>
  );
}
