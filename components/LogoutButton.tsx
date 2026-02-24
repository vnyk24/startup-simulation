"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function LogoutButton() {
  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button type="button" className="ghost-btn" onClick={handleLogout}>
      Logout
    </button>
  );
}
