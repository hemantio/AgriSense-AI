"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brain, CloudSun, Map, LayoutDashboard, Volume2, FlaskConical, ArrowRight, Sprout } from "lucide-react";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030303]">
      {/* Premium Background Grid & Glowing Blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full opacity-[0.18]"
          style={{
            background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
            animation: "pulse-soft 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.12]"
          style={{
            background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)",
            animation: "pulse-soft 8s ease-in-out infinite 1s",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-[rgba(255,255,255,0.06)] backdrop-blur-md bg-[rgba(3,3,3,0.7)] sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white font-bold">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            AgriSense <span style={{ color: "var(--color-primary-light)" }}>AI</span>
          </span>
        </div>
        <Link
          href="/login"
          className="btn btn-secondary text-xs px-4 py-2 border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] text-white"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <main
        className={`relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.2)] text-[var(--color-primary-light)] mb-6 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide">
            <span className="animate-pulse-soft text-[10px]">●</span>
            AI-Powered Farm Intelligence
          </div>

          <h1
            className="text-5xl md:text-8xl font-black tracking-tight leading-[1.05] mb-6 text-white"
          >
            Intelligent Farm
            <br />
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-pink-300"
            >
              Management Platform
            </span>
          </h1>

          <p
            className="text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed text-zinc-400 font-normal"
          >
            Empowering small-scale farmers with AI-powered crop health analysis,
            weather intelligence, smart recommendations, and comprehensive farm
            management — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn btn-primary text-sm px-6 py-2.5 flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="btn btn-secondary text-sm px-6 py-2.5 border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.03)]"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Feature Cards */}
        <div
          id="features"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-32 stagger-children"
        >
          {[
            {
              icon: <Brain className="w-5 h-5 text-emerald-400" />,
              title: "AI Crop Analysis",
              description:
                "Upload crop images for instant AI-powered health analysis with disease detection and treatment recommendations.",
              color: "var(--color-primary)",
            },
            {
              icon: <CloudSun className="w-5 h-5 text-blue-400" />,
              title: "Weather Intelligence",
              description:
                "Real-time weather data with smart alerts for rain, heat, drought, and frost — tailored to your farm location.",
              color: "var(--color-info)",
            },
            {
              icon: <Map className="w-5 h-5 text-teal-400" />,
              title: "Map-Based Plots",
              description:
                "Register and manage farm plots on interactive maps with GPS coordinates and area calculation.",
              color: "var(--color-success)",
            },
            {
              icon: <LayoutDashboard className="w-5 h-5 text-pink-400" />,
              title: "Smart Dashboard",
              description:
                "Overview cards, seasonal summaries, expense tracking, and health reports at a glance.",
              color: "var(--color-accent)",
            },
            {
              icon: <Volume2 className="w-5 h-5 text-amber-400" />,
              title: "Voice & Multilingual",
              description:
                "Text-to-speech recommendations and regional language support for accessibility.",
              color: "var(--color-warning)",
            },
            {
              icon: <FlaskConical className="w-5 h-5 text-red-400" />,
              title: "Simulation Sandbox",
              description:
                "Test with simulated weather, disease, and pest scenarios without real-world dependency.",
              color: "var(--color-danger)",
            },
          ].map((feature, index) => (
            <div key={index} className="glass-card p-6 group cursor-default">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}33` }}
              >
                {feature.icon}
              </div>
              <h3
                className="text-base font-semibold mb-2 text-white"
              >
                {feature.title}
              </h3>
              <p className="text-xs leading-relaxed text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 text-center py-12 border-t border-[rgba(255,255,255,0.06)] text-xs text-zinc-500 bg-[#030303]"
      >
        <p>
          AgriSense AI — Empowering Farming Communities with Technology
        </p>
      </footer>
    </div>
  );
}
