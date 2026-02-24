export type Game = {
  id: string;
  user_id: string;
  cash: number;
  engineers: number;
  sales_staff: number;
  quality: number;
  competitors: number;
  year: number;
  quarter: number;
  is_over: boolean;
  created_at: string;
  updated_at: string;
};

export type QuarterlyHistory = {
  id: string;
  game_id: string;
  year: number;
  quarter: number;
  revenue: number;
  net_income: number;
  cash: number;
  engineers: number;
  sales_staff: number;
  created_at: string;
};

export type QuarterDecisionInput = {
  price: number;
  newEngineers: number;
  newSales: number;
  salaryPct: number;
};

export type SimulationResult = {
  revenue: number;
  netIncome: number;
  cash: number;
  engineers: number;
  salesStaff: number;
  quality: number;
  completedYear: number;
  completedQuarter: number;
  nextYear: number;
  nextQuarter: number;
  isOver: boolean;
  status: "ongoing" | "won" | "lost";
};
