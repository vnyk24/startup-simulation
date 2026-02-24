"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SALARY_PCT_MAX, SALARY_PCT_MIN } from "@/lib/simulation";

type Props = {
  isGameOver: boolean;
};

export default function DecisionPanel({ isGameOver }: Props) {
  const router = useRouter();
  const [price, setPrice] = useState(1000);
  const [newEngineers, setNewEngineers] = useState(0);
  const [newSales, setNewSales] = useState(0);
  const [salaryPct, setSalaryPct] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Unit price must be greater than 0.");
      return;
    }
    if (!Number.isInteger(newEngineers) || newEngineers < 0) {
      setError("Engineers to hire must be a non-negative integer.");
      return;
    }
    if (!Number.isInteger(newSales) || newSales < 0) {
      setError("Sales staff to hire must be a non-negative integer.");
      return;
    }
    if (!Number.isFinite(salaryPct) || salaryPct < SALARY_PCT_MIN || salaryPct > SALARY_PCT_MAX) {
      setError(`Salary percentage must be between ${SALARY_PCT_MIN} and ${SALARY_PCT_MAX}.`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price, newEngineers, newSales, salaryPct })
      });

      if (!response.ok) {
        const payload = await response.json();
        setError(payload.error ?? "Failed to advance quarter.");
        setLoading(false);
        return;
      }

      setSuccess("Quarter advanced successfully.");
      router.refresh();
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="db-card">
      <div className="db-card-head">
        <h2>Quarterly Decisions</h2>
      </div>
      <form className="decision-form" onSubmit={handleSubmit}>
        <label>
          Unit price ($)
          <input
            type="number"
            min={1}
            step={1}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            disabled={loading || isGameOver}
          />
        </label>
        <label>
          Salary % of industry avg
          <input
            type="number"
            min={SALARY_PCT_MIN}
            max={SALARY_PCT_MAX}
            step={1}
            value={salaryPct}
            onChange={(e) => setSalaryPct(Number(e.target.value))}
            disabled={loading || isGameOver}
          />
        </label>
        <label>
          Engineers to hire
          <input
            type="number"
            min={0}
            step={1}
            value={newEngineers}
            onChange={(e) => setNewEngineers(Number(e.target.value))}
            disabled={loading || isGameOver}
          />
        </label>
        <label>
          Sales staff to hire
          <input
            type="number"
            min={0}
            step={1}
            value={newSales}
            onChange={(e) => setNewSales(Number(e.target.value))}
            disabled={loading || isGameOver}
          />
        </label>
        <div className="decision-form-footer">
          <button type="submit" className="advance-btn" disabled={loading || isGameOver}>
            {loading ? "Advancing..." : "Advance Turn"}
          </button>
          <div>
            {error ? <p className="error">{error}</p> : null}
            {success ? <p className="hint">{success}</p> : null}
          </div>
        </div>
      </form>
    </div>
  );
}
