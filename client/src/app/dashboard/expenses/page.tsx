"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface Expense {
  id: string;
  crop_id: string;
  crop_name?: string;
  amount: number;
  category: string;
  expense_date: string;
  notes?: string;
}

interface Crop {
  id: string;
  crop_name: string;
}

interface CategorySummary {
  category: string;
  total_amount: number;
  count: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Seeds: "#2a9d8f",
  Fertilizer: "#e9c46a",
  Pesticide: "#f4a261",
  Labor: "#e76f51",
  Fuel: "#457b9d",
  Equipment: "#a8dadc",
  Water: "#1d3557",
  Other: "#6c757d",
};

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [summaries, setSummaries] = useState<CategorySummary[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cropId, setCropId] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Seeds");
  const [expenseDate, setExpenseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpensesAndCrops = async () => {
    setIsLoading(true);
    try {
      const [expRes, cropsRes] = await Promise.all([
        api.listExpenses({ page_size: 100 }),
        api.listCrops(),
      ]);

      const cropMap = new Map(cropsRes.data.crops.map((c: Crop) => [c.id, c.crop_name]));
      const mappedExpenses = expRes.data.expenses.map((e: Expense) => ({
        ...e,
        crop_name: cropMap.get(e.crop_id) || "General / Unknown",
      }));

      setExpenses(mappedExpenses);
      setCrops(cropsRes.data.crops);
      setSummaries(expRes.data.summaries || []);
      setGrandTotal(expRes.data.total_amount || 0);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndCrops();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!cropId) {
      setFormError("Please select a crop to associate this expense.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createExpense({
        crop_id: cropId,
        amount: parseFloat(amount),
        category,
        expense_date: expenseDate,
        notes: notes || undefined,
      });

      // Reset
      setCropId("");
      setAmount("");
      setCategory("Seeds");
      setExpenseDate("");
      setNotes("");
      setIsModalOpen(false);
      fetchExpensesAndCrops();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to log expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.deleteExpense(id);
      fetchExpensesAndCrops();
    } catch (error) {
      alert("Failed to delete expense");
    }
  };

  // Process data for charts
  const pieData = summaries.map((s) => ({
    name: s.category,
    value: s.total_amount,
  }));

  // Aggregate expenses per crop name
  const cropBarDataMap = new Map<string, number>();
  expenses.forEach((exp) => {
    const cName = exp.crop_name || "General";
    cropBarDataMap.set(cName, (cropBarDataMap.get(cName) || 0) + exp.amount);
  });
  const barData = Array.from(cropBarDataMap.entries()).map(([name, value]) => ({
    name,
    amount: value,
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            Expense Tracking & Analytics 💰
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track seasonal farming costs and view interactive cost-breakdown visualizations.
          </p>
        </div>
        <button
          onClick={() => {
            if (crops.length === 0) {
              alert("You must have active crops planted before recording expenses!");
              return;
            }
            setIsModalOpen(true);
          }}
          className="btn btn-primary self-start sm:self-center"
        >
          ➕ Record New Expense
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col justify-center">
          <p className="text-xs uppercase font-semibold text-[var(--text-muted)] tracking-wider">Total Season Expenses</p>
          <p className="text-3xl font-bold text-[var(--color-primary-light)] mt-2">
            ₹{grandTotal.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="glass-card p-6 flex flex-col justify-center">
          <p className="text-xs uppercase font-semibold text-[var(--text-muted)] tracking-wider">Highest Category Cost</p>
          <p className="text-lg font-semibold text-[var(--text-primary)] mt-2">
            {summaries.length > 0
              ? `${summaries.reduce((prev, curr) => (prev.total_amount > curr.total_amount ? prev : curr)).category} (₹${Math.max(...summaries.map(s => s.total_amount)).toLocaleString("en-IN")})`
              : "N/A"}
          </p>
        </div>
        <div className="glass-card p-6 flex flex-col justify-center">
          <p className="text-xs uppercase font-semibold text-[var(--text-muted)] tracking-wider">Transactions logged</p>
          <p className="text-lg font-semibold text-[var(--text-primary)] mt-2">
            {expenses.length} Records
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      {summaries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart: Expenses by Category */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">Costs by Category</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS.Other} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart: Expenses by Crop */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">Costs by Crop</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                  <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Expense ledger list */}
      <div className="glass-card p-6">
        <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Expense Ledger</h2>
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-[var(--bg-secondary)] rounded-lg" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">No expenses logged yet. Tap &apos;Record New Expense&apos; to register one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-secondary)] border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Crop</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-[var(--bg-tertiary)]/20 transition-colors">
                    <td className="py-3 px-4">{new Date(expense.expense_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{expense.crop_name}</td>
                    <td className="py-3 px-4">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other}20`,
                          color: CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other,
                          border: `1px solid ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other}40`,
                        }}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs italic text-[var(--text-muted)] truncate max-w-xs">{expense.notes || "—"}</td>
                    <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)]">
                      ₹{expense.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-xs text-[var(--color-danger-light)] hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 overflow-y-auto max-h-[90vh]" style={{ backgroundColor: "var(--bg-secondary)" }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Record Crop Expense</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-2xl text-[var(--text-secondary)] hover:text-white">&times;</button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-xs text-[var(--color-danger-light)]">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Select Crop</label>
                <select
                  required
                  value={cropId}
                  onChange={(e) => setCropId(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                >
                  <option value="">-- Choose Crop planting --</option>
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>{c.crop_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    placeholder="e.g. 5500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                  >
                    <option value="Seeds">Seeds</option>
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Pesticide">Pesticide</option>
                    <option value="Labor">Labor</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Water">Water</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Expense Date</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Receipt Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                  placeholder="e.g. Purchased 50kg Urea bags, transport charges included..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-light)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging..." : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
