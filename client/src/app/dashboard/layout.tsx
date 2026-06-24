"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { clearTokens } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Map,
  Sprout,
  HeartPulse,
  QrCode,
  CloudSun,
  Coins,
  Cpu,
  Settings,
  LogOut,
  Menu,
  X,
  Volume2,
  Mic,
  MessageSquare
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [micActive, setMicActive] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    clearTokens();
    logout();
    router.push("/login");
  };

  const adminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/dashboard/farmers", label: "Farmers", icon: <Users className="w-4 h-4" /> },
    { href: "/dashboard/plots", label: "Farm Plots", icon: <Map className="w-4 h-4" /> },
    { href: "/dashboard/crops", label: "Crops", icon: <Sprout className="w-4 h-4" /> },
    { href: "/dashboard/health", label: "Crop Health", icon: <HeartPulse className="w-4 h-4" /> },
    { href: "/dashboard/inputs", label: "Inputs Scan", icon: <QrCode className="w-4 h-4" /> },
    { href: "/dashboard/weather", label: "Weather", icon: <CloudSun className="w-4 h-4" /> },
    { href: "/dashboard/expenses", label: "Expenses", icon: <Coins className="w-4 h-4" /> },
    { href: "/dashboard/simulation", label: "Simulation", icon: <Cpu className="w-4 h-4" /> },
    { href: "/dashboard/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  const farmerNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/dashboard/plots", label: "My Plots", icon: <Map className="w-4 h-4" /> },
    { href: "/dashboard/crops", label: "My Crops", icon: <Sprout className="w-4 h-4" /> },
    { href: "/dashboard/health", label: "Crop Health", icon: <HeartPulse className="w-4 h-4" /> },
    { href: "/dashboard/inputs", label: "Inputs Scan", icon: <QrCode className="w-4 h-4" /> },
    { href: "/dashboard/weather", label: "Weather", icon: <CloudSun className="w-4 h-4" /> },
    { href: "/dashboard/expenses", label: "Expenses", icon: <Coins className="w-4 h-4" /> },
    { href: "/dashboard/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  const navItems = user?.role === "admin" ? adminNavItems : farmerNavItems;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-[#030303]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-color)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-light)" }}
        >
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white text-base">
            <Sprout className="w-5 h-5 text-zinc-900" />
          </div>
          <span className="font-bold text-base text-[var(--text-primary)]">
            AgriSense <span className="text-[var(--color-primary-light)]">AI</span>
          </span>
        </div>

        {/* User Info */}
        <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-zinc-900"
              style={{
                background: "var(--color-primary)",
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[var(--text-primary)]">
                {user?.name}
              </p>
              <p className="text-xs capitalize text-[var(--text-muted)]">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group"
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-card)" : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--color-primary)"
                    : "3px solid transparent",
                }}
              >
                <span className={`text-base transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-[var(--color-primary-light)]" : "text-zinc-500"}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border-light)" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200 hover:bg-[var(--bg-card)] cursor-pointer"
            style={{ color: "var(--color-danger-light)" }}
          >
            <LogOut className="w-4 h-4 text-[var(--color-danger-light)]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-lg"
          style={{
            background: "rgba(10, 15, 13, 0.8)",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-card)]"
            style={{ color: "var(--text-primary)" }}
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-4">
            <span className="badge badge-success">
              {user?.role === "admin" ? "Admin Panel" : "Farmer Dashboard"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {/* Floating Voice Assistant Breathing Orb (Upgraded into full motion widget) */}
          <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            <AnimatePresence>
              {assistantOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="mb-3 w-80 p-5 rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col gap-4"
                >
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">
                      🤖 AgriSense Co-Pilot
                    </span>
                    <button
                      onClick={() => {
                        setAssistantOpen(false);
                        setMicActive(false);
                      }}
                      className="p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center py-4 bg-black/40 rounded-xl border border-zinc-900/60 min-h-24">
                    {micActive ? (
                      <div className="flex items-end justify-center gap-1 h-8">
                        {[0.2, 0.5, 0.8, 0.4, 0.7, 0.3].map((delay, index) => (
                          <div
                            key={index}
                            className="w-1 bg-[var(--color-primary-light)] rounded-full wave-bar"
                            style={{ animationDelay: `${delay}s` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <Volume2 className="w-8 h-8 text-zinc-600 animate-pulse" />
                    )}

                    <p className="text-xs font-mono mt-3 text-center text-zinc-300">
                      {micActive ? "Listening to telemetry audio..." : "AgriSense AI listening channel offline."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setMicActive(!micActive)}
                      className={`btn w-full text-xs font-semibold py-2 cursor-pointer ${
                        micActive
                          ? "btn-secondary text-zinc-300 border-zinc-800 hover:border-zinc-700 bg-red-950/10"
                          : "btn-primary text-zinc-900 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] border-0"
                      }`}
                    >
                      {micActive ? "⏹️ Mute Listening" : "🎤 Turn On Voice Mic"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              onClick={() => setAssistantOpen(!assistantOpen)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md cursor-pointer hover:border-emerald-500/30 transition-all duration-300"
            >
              <motion.div
                animate={{
                  scale: micActive ? [1, 1.3, 1] : [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                  boxShadow: micActive
                    ? [
                        "0 0 0px rgba(64, 145, 108, 0.2)",
                        "0 0 16px rgba(52, 211, 153, 0.9)",
                        "0 0 0px rgba(64, 145, 108, 0.2)"
                      ]
                    : [
                        "0 0 0px rgba(64, 145, 108, 0.2)",
                        "0 0 10px rgba(64, 145, 108, 0.6)",
                        "0 0 0px rgba(64, 145, 108, 0.2)"
                      ]
                }}
                transition={{
                  duration: micActive ? 1.2 : 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`w-3 h-3 rounded-full ${micActive ? "bg-red-400" : "bg-[var(--color-primary-light)]"}`}
              />
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {assistantOpen ? "Close Assistant" : "AgriSense AI Assistant"}
              </span>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
