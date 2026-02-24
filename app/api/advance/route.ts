import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { simulateQuarter, validateDecisionInput } from "@/lib/simulation";
import { QuarterDecisionInput } from "@/types/game";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<QuarterDecisionInput>;
  const input: QuarterDecisionInput = {
    price: Number(body.price),
    newEngineers: Number(body.newEngineers),
    newSales: Number(body.newSales),
    salaryPct: Number(body.salaryPct)
  };

  const validationError = validateDecisionInput(input);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  if (game.is_over) {
    return NextResponse.json({ error: "This game has already ended." }, { status: 400 });
  }

  const result = simulateQuarter(
    {
      cash: game.cash,
      engineers: game.engineers,
      salesStaff: game.sales_staff,
      quality: game.quality,
      year: game.year,
      quarter: game.quarter
    },
    input
  );

  const { data: updated, error: rpcError } = await supabase.rpc("advance_game_tx", {
    p_game_id: game.id,
    p_history_year: result.completedYear,
    p_history_quarter: result.completedQuarter,
    p_revenue: result.revenue,
    p_net_income: result.netIncome,
    p_cash: result.cash,
    p_engineers: result.engineers,
    p_sales_staff: result.salesStaff,
    p_quality: result.quality,
    p_year: result.nextYear,
    p_quarter: result.nextQuarter,
    p_is_over: result.isOver
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  return NextResponse.json({ game: updated, result }, { status: 200 });
}
