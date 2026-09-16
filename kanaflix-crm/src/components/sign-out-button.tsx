"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/entrar");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="grid size-11 place-items-center rounded-full bg-foreground text-surface transition-colors hover:bg-foreground/85"
      aria-label="Sair da conta"
      title="Sair"
    >
      <LogOut size={18} aria-hidden="true" />
    </button>
  );
}
