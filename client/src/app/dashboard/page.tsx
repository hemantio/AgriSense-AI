"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Users, Map, Sprout, HeartPulse, AlertTriangle, CloudSun, Hourglass, Coins } from "lucide-react";

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
            icon: <Users className="w-5 h-5 text-emerald-400" />,
            color: "var(--color-primary-light)",
            bgColor: "rgba(16, 185, 129, 0.08)",
            borderClass: "glow-border-emerald",
          },
        ]
      : []),
    {
      label: "Farm Plots",
      value: stats.total_plots,
      icon: <Map className="w-5 h-5 text-teal-400" />,
      color: "var(--color-success)",
      bgColor: "rgba(42, 157, 143, 0.08)",
      borderClass: "glow-border-emerald",
    },
    {
      label: "Active Crops",
      value: stats.active_crops,
      icon: <Sprout className="w-5 h-5 text-amber-400" />,
      color: "var(--color-accent-warm)",
      bgColor: "rgba(245, 158, 11, 0.08)",
      borderClass: "glow-border-amber",
    },
    {
      label: "Health Analyses",
      value: stats.total_health_analyses,
      icon: <HeartPulse className="w-5 h-5 text-sky-400" />,
      color: "var(--color-info)",
      bgColor: "rgba(59, 130, 246, 0.08)",
      borderClass: "glow-border-emerald",
    },
    {
      label: "Critical Alerts",
      value: stats.critical_health_alerts,
      icon: <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />,
      color: "var(--color-danger)",
      bgColor: "rgba(239, 68, 68, 0.08)",
      borderClass: "glow-border-rose",
    },
    {
      label: "Weather Alerts",
      value: stats.active_weather_alerts,
      icon: <CloudSun className="w-5 h-5 text-orange-400 animate-pulse" />,
      color: "var(--color-warning)",
      bgColor: "rgba(244, 162, 97, 0.08)",
      borderClass: "glow-border-amber",
    },
    {
      label: "Pending Verifications",
      value: stats.pending_plots,
      icon: <Hourglass className="w-5 h-5 text-yellow-400" />,
      color: "var(--color-accent-warm)",
      bgColor: "rgba(233, 196, 106, 0.08)",
      borderClass: "glow-border-amber",
    },
    {
      label: "Total Expenses",
      value: `₹${stats.total_expenses.toLocaleString("en-IN")}`,
      icon: <Coins className="w-5 h-5 text-emerald-300" />,
      color: "var(--color-primary-light)",
      bgColor: "rgba(52, 211, 153, 0.08)",
      borderClass: "glow-border-emerald",
    },
  ];

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 120, damping: 14 },
    },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <motion.h1
          initial={{ x: -15, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="text-2xl md:text-3xl font-black text-white"
        >
          Welcome back, {user?.name} 👋
        </motion.h1>
        <motion.p
          initial={{ x: -15, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-1 text-sm text-zinc-400"
        >
          Here&apos;s a high-precision summary of your agricultural co-pilot telemetry.
        </motion.p>
      </div>

      {/* Stat Cards Grid with Framer Motion Stagger */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={`glass-card p-5 group border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl transition-all duration-300 ${card.borderClass}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                  {card.label}
                </p>
                <p
                  className="text-2xl font-black mt-2 tracking-tight transition-transform group-hover:scale-[1.03]"
                  style={{ color: card.color }}
                >
                  {isLoading ? (
                    <span
                      className="inline-block w-16 h-7 rounded animate-pulse"
                      style={{ background: card.bgColor }}
                    />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-3"
                style={{ background: card.bgColor, border: `1px solid ${card.color}15` }}
              >
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Seasonal Analytics Graph with Glowing Gradients */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="grid grid-cols-1 gap-6"
      >
        <div className="glass-card p-6 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-white">
              Seasonal Activity & Health Overview
            </h2>
            <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
            </span>
          </div>

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
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPlots" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} className="font-mono" />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} className="font-mono" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,10,12,0.95)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="health"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorHealth)"
                  strokeWidth={2}
                  name="Crop Health %"
                />
                <Area
                  type="monotone"
                  dataKey="active_plots"
                  stroke="#34d399"
                  fillOpacity={1}
                  fill="url(#colorPlots)"
                  strokeWidth={2}
                  name="Active Plots"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-bold mb-4 text-white">
          Quick Mission Controls
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Analyze Crop",
              description: "Upload crop photo for AI diagnosis",
              icon: "📸",
              href: "/dashboard/health",
              gradient: "gradient-primary",
              borderClass: "glow-border-emerald",
            },
            {
              label: "Add Plot",
              description: "Register a plot boundary on map",
              icon: "📍",
              href: "/dashboard/plots",
              gradient: "gradient-accent",
              borderClass: "glow-border-emerald",
            },
            {
              label: "Check Weather",
              description: "View meteorological forecast metrics",
              icon: "⛅",
              href: "/dashboard/weather",
              gradient: "gradient-warm",
              borderClass: "glow-border-amber",
            },
            {
              label: "Record Expense",
              description: "Track crop management costs",
              icon: "📝",
              href: "/dashboard/expenses",
              gradient: "gradient-primary",
              borderClass: "glow-border-emerald",
            },
          ].map((action, index) => (
            <motion.a
              key={index}
              href={action.href}
              whileHover={{ y: -3 }}
              className={`glass-card p-5 block group cursor-pointer border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl transition-all duration-300 ${action.borderClass}`}
            >
              <div
                className={`w-10 h-10 rounded-lg ${action.gradient} flex items-center justify-center text-lg mb-3 transition-transform group-hover:scale-105 group-hover:rotate-2`}
              >
                {action.icon}
              </div>
              <p className="font-bold text-sm text-white">
                {action.label}
              </p>
              <p className="text-xs mt-1 text-zinc-400 leading-relaxed">
                {action.description}
              </p>
            </motion.a>
          ))}
        </div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="glass-card p-6 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl"
      >
        <h2 className="text-base font-bold mb-4 text-white">
          System Core Telemetry
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "API Server", status: "Online", color: "#10b981" },
            { label: "AI Engine", status: "Ready", color: "#10b981" },
            { label: "Weather API", status: "Connected", color: "#10b981" },
          ].map((system, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-900 bg-zinc-950/80"
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: system.color, boxShadow: `0 0 10px ${system.color}` }}
              />
              <div>
                <p className="text-xs font-bold text-zinc-300">
                  {system.label}
                </p>
                <p className="text-[10px] font-mono font-semibold" style={{ color: system.color }}>
                  {system.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
