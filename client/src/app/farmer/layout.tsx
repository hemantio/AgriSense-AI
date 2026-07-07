"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { clearTokens } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { Home, Camera, MapPin, ClipboardList, LogOut, Sprout } from "lucide-react";

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth Guard
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router, mounted]);

  const handleLogout = () => {
    clearTokens();
    logout();
    router.push("/login");
  };

  const navItems = [
    { href: "/farmer", label: "Home", icon: <Home className="w-5 h-5" /> },
    { href: "/farmer/scan", label: "Scan", icon: <Camera className="w-5 h-5" /> },
    { href: "/farmer/plots", label: "Plots", icon: <MapPin className="w-5 h-5" /> },
    { href: "/farmer/logs", label: "Logs", icon: <ClipboardList className="w-5 h-5" /> },
  ];

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center text-zinc-500 font-mono text-xs">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile-focused container frame */}
      <div className="max-w-md mx-auto min-h-screen bg-[#030303] border-x border-zinc-900 flex flex-col pb-20 relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#09090b]/80 border-b border-zinc-900 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#10b981] flex items-center justify-center text-zinc-950">
              <Sprout className="w-4 h-4" />
            </div>
            <span className="text-sm font-black tracking-tight text-white">
              AgriSense <span className="text-[#34d399]">Farmer</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
              {user?.preferred_language || "en"}
            </span>
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Mobile Route Pages */}
        <main className="flex-1 px-5 py-6 overflow-y-auto">
          {children}
        </main>

        {/* Bottom Tab Bar Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto bg-[#09090b]/90 border-t border-zinc-900 backdrop-blur-md grid grid-cols-4 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 transition-colors cursor-pointer ${
                  isActive ? "text-[#10b981]" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
