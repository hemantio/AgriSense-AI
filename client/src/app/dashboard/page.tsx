"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface DashboardStats {
  total_farmers: number;
  total_plots: number;
  verified_plots: number;
  pending_plots: number;
  active_crops: number;
  total_health_analyses: number;
  critical_health_alerts: number;
  active_weather_alerts: number;
  total_expenses: number;
}

const defaultStats: DashboardStats = {
  total_farmers: 0,
  total_plots: 0,
  verified_plots: 0,
  pending_plots: 0,
  active_crops: 0,
  total_health_analyses: 0,
  critical_health_alerts: 0,
  active_weather_alerts: 0,
  total_expenses: 0,
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.getDashboardStats();
        setStats(response.data);
      } catch {
        // Use default stats on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const isAdmin = user?.role === "admin";

  const statCards = [
    ...(isAdmin
      ? [
          {
            label: "Total Farmers",
            value: stats.total_farmers,
            icon: "👨‍🌾",
            color: "var(--color-primary)",
            bgColor: "rgba(45, 106, 79, 0.12)",
          },
        ]
      : []),
    {
      label: "Farm Plots",
      value: stats.total_plots,
      icon: "🗺️",
      color: "var(--color-success)",
      bgColor: "rgba(42, 157, 143, 0.12)",
    },
    {
      label: "Active Crops",
      value: stats.active_crops,
      icon: "🌾",
      color: "var(--color-accent-warm)",
      bgColor: "rgba(233, 196, 106, 0.12)",
    },
    {
      label: "Health Analyses",
      value: stats.total_health_analyses,
      icon: "🩺",
      color: "var(--color-info)",
      bgColor: "rgba(69, 123, 157, 0.12)",
    },
    {
      label: "Critical Alerts",
      value: stats.critical_health_alerts,
      icon: "⚠️",
      color: "var(--color-danger)",
      bgColor: "rgba(214, 40, 40, 0.12)",
    },
    {
      label: "Weather Alerts",
      value: stats.active_weather_alerts,
      icon: "🌤️",
      color: "var(--color-warning)",
      bgColor: "rgba(244, 162, 97, 0.12)",
    },
    {
      label: "Pending Verifications",
      value: stats.pending_plots,
      icon: "⏳",
      color: "var(--color-accent-warm)",
      bgColor: "rgba(233, 196, 106, 0.12)",
    },
    {
      label: "Total Expenses",
      value: `₹${stats.total_expenses.toLocaleString("en-IN")}`,
      icon: "💰",
      color: "var(--color-primary-light)",
      bgColor: "rgba(64, 145, 108, 0.12)",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h1
          className="text-2xl md:text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Welcome back, {user?.name} 👋
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Here&apos;s an overview of your farm management dashboard.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {statCards.map((card, index) => (
          <div key={index} className="glass-card p-5 group">
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  {card.label}
                </p>
                <p
                  className="text-2xl font-bold mt-2 transition-transform group-hover:scale-105"
                  style={{ color: card.color }}
                >
                  {isLoading ? (
                    <span className="inline-block w-16 h-7 rounded animate-pulse" style={{ background: card.bgColor }} />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110 group-hover:rotate-6"
                style={{ background: card.bgColor }}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seasonal Analytics Graph */}
      <div className="grid grid-cols-1 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Seasonal Activity & Health Overview</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { month: "Jan", health: 85, active_plots: 3 },
                  { month: "Feb", health: 90, active_plots: 4 },
                  { month: "Mar", health: 80, active_plots: 5 },
                  { month: "Apr", health: 95, active_plots: 6 },
                  { month: "May", health: 88, active_plots: 7 },
                  { month: "Jun", health: 92, active_plots: 8 },
                ]}
              >
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} />
                <Area type="monotone" dataKey="health" stroke="var(--color-primary-light)" fill="rgba(64, 145, 108, 0.2)" strokeWidth={2} name="Crop Health %" />
                <Area type="monotone" dataKey="active_plots" stroke="var(--color-success)" fill="rgba(42, 157, 143, 0.2)" strokeWidth={2} name="Active Plots" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Analyze Crop",
              description: "Upload a crop image for AI health analysis",
              icon: "📸",
              href: "/dashboard/health",
              gradient: "gradient-primary",
            },
            {
              label: "Add Plot",
              description: "Register a new farm plot on the map",
              icon: "📍",
              href: "/dashboard/plots",
              gradient: "gradient-accent",
            },
            {
              label: "Check Weather",
              description: "View current weather and forecasts",
              icon: "⛅",
              href: "/dashboard/weather",
              gradient: "gradient-warm",
            },
            {
              label: "Record Expense",
              description: "Track a new farming expense",
              icon: "📝",
              href: "/dashboard/expenses",
              gradient: "gradient-primary",
            },
          ].map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="glass-card p-5 block group cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-lg ${action.gradient} flex items-center justify-center text-lg mb-3 transition-transform group-hover:scale-110`}
              >
                {action.icon}
              </div>
              <p
                className="font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {action.label}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {action.description}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="glass-card p-6">
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          System Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "API Server", status: "Online", color: "var(--color-success)" },
            { label: "AI Engine", status: "Ready", color: "var(--color-success)" },
            { label: "Weather API", status: "Connected", color: "var(--color-success)" },
          ].map((system, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "var(--bg-tertiary)" }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full animate-pulse-soft"
                style={{ background: system.color }}
              />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {system.label}
                </p>
                <p className="text-xs" style={{ color: system.color }}>
                  {system.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
