import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { Game, QuarterlyHistory } from "@/types/game";

const INITIAL_GAME = {
  cash: 1_000_000,
  engineers: 4,
  sales_staff: 2,
  quality: 50,
  competitors: 2,
  year: 1,
  quarter: 1,
  is_over: false
};

export async function requireAuthedUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return { user };
}

export async function getOrCreateGameForUser(userId: string): Promise<Game> {
  const supabase = await getSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("games")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing) {
    return existing as Game;
  }

  const { data: created, error: createError } = await supabase
    .from("games")
    .insert({ user_id: userId, ...INITIAL_GAME })
    .select("*")
    .single();

  if (createError) {
    throw createError;
  }

  return created as Game;
}

export async function getLastFourQuarters(gameId: string): Promise<QuarterlyHistory[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("quarterly_history")
    .select("*")
    .eq("game_id", gameId)
    .order("year", { ascending: false })
    .order("quarter", { ascending: false })
    .limit(4);

  if (error) {
    throw error;
  }

  return (data ?? []) as QuarterlyHistory[];
}

export async function getCumulativeProfit(gameId: string): Promise<number> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("quarterly_history")
    .select("net_income")
    .eq("game_id", gameId);

  if (error) {
    throw error;
  }

  return (data ?? []).reduce((sum, row) => sum + Number(row.net_income), 0);
}
