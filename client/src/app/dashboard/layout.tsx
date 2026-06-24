"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { clearTokens } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/farmers", label: "Farmers", icon: "👨‍🌾" },
  { href: "/dashboard/plots", label: "Farm Plots", icon: "🗺️" },
  { href: "/dashboard/crops", label: "Crops", icon: "🌾" },
  { href: "/dashboard/health", label: "Crop Health", icon: "🩺" },
  { href: "/dashboard/inputs", label: "Inputs Scan", icon: "🧴" },
  { href: "/dashboard/weather", label: "Weather", icon: "🌤️" },
  { href: "/dashboard/expenses", label: "Expenses", icon: "💰" },
  { href: "/dashboard/simulation", label: "Simulation", icon: "🎭" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

const farmerNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/plots", label: "My Plots", icon: "🗺️" },
  { href: "/dashboard/crops", label: "My Crops", icon: "🌾" },
  { href: "/dashboard/health", label: "Crop Health", icon: "🩺" },
  { href: "/dashboard/inputs", label: "Inputs Scan", icon: "🧴" },
  { href: "/dashboard/weather", label: "Weather", icon: "🌤️" },
  { href: "/dashboard/expenses", label: "Expenses", icon: "💰" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const navItems = user?.role === "admin" ? adminNavItems : farmerNavItems;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${
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
            🌱
          </div>
          <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            AgriSense <span style={{ color: "var(--color-primary-light)" }}>AI</span>
          </span>
        </div>

        {/* User Info */}
        <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{
                background: "var(--color-primary)",
                color: "white",
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.name}
              </p>
              <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-card)" : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--color-primary)"
                    : "3px solid transparent",
                }}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border-light)" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200 hover:bg-[var(--bg-card)]"
            style={{ color: "var(--color-danger-light)" }}
          >
            <span className="text-base">🚪</span>
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
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
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

          {/* Floating Voice Assistant Breathing Orb */}
          <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md">
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.7, 1, 0.7],
                boxShadow: [
                  "0 0 0px rgba(64, 145, 108, 0.2)",
                  "0 0 14px rgba(64, 145, 108, 0.8)",
                  "0 0 0px rgba(64, 145, 108, 0.2)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-3 h-3 rounded-full bg-[var(--color-primary-light)]"
            />
            <span className="text-xs font-semibold text-[var(--text-primary)]">AgriSense AI Assistant</span>
          </div>
        </main>
      </div>
    </div>
  );
}
