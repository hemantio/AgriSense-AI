"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, CloudSun, Map, LayoutDashboard, Volume2, FlaskConical, ArrowRight, Sprout } from "lucide-react";
import BackgroundCanvas from "@/components/BackgroundCanvas";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: "spring" as const,
        stiffness: 80,
      },
    }),
  };

  const titleWords = ["Intelligent", "Farm", "Management", "Platform"];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030303]">
      {/* Dynamic Cursor Reactive Particles Background */}
      <BackgroundCanvas />

      {/* Premium Background Blurs */}
      <div className="absolute inset-0 -z-20 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-15%] left-[-10%] w-[900px] h-[900px] rounded-full opacity-[0.14]"
          style={{
            background: "radial-gradient(circle, var(--color-primary) 0%, transparent 75%)",
          }}
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[800px] h-[800px] rounded-full opacity-[0.1]"
          style={{
            background: "radial-gradient(circle, var(--color-accent) 0%, transparent 75%)",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-zinc-900/60 backdrop-blur-md bg-black/30 sticky top-0">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -15, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white font-bold"
          >
            <Sprout className="w-5 h-5 text-zinc-900" />
          </motion.div>
          <motion.span
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-lg font-bold tracking-tight text-white"
          >
            AgriSense <span className="text-[var(--color-primary-light)]">AI</span>
          </motion.span>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href="/login"
            className="btn btn-secondary text-xs px-4 py-2 border-zinc-800 hover:border-zinc-700 text-white shadow-lg shadow-black/25 transition-all duration-200"
          >
            Sign In
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {mounted && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 12 }}
              className="inline-flex items-center gap-2 bg-emerald-950/15 border border-emerald-500/20 text-[var(--color-primary-light)] mb-8 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary-light)] animate-pulse" />
              AI-Powered Farm Intelligence
            </motion.div>
          )}

          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[1.05] mb-6 text-white">
            {titleWords.map((word, i) => (
              <motion.span
                key={i}
                custom={i}
                initial="hidden"
                animate={mounted ? "visible" : "hidden"}
                variants={wordVariants}
                className="inline-block mr-3 md:mr-5 last:mr-0"
              >
                {i === 2 || i === 3 ? (
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-pink-300">
                    {word}
                  </span>
                ) : (
                  word
                )}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed text-zinc-400 font-normal"
          >
            Empowering small-scale farmers with AI-powered crop health analysis,
            weather intelligence, smart recommendations, and comprehensive farm
            management — all in one platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="btn btn-primary text-sm px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="btn btn-secondary text-sm px-6 py-2.5 border-zinc-800 hover:border-zinc-700 bg-white/[0.02]"
            >
              Explore Features
            </a>
          </motion.div>
        </div>

        {/* Feature Cards Grid with Scroll-Reveal & Hover Spring Scale */}
        <motion.div
          id="features"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-36"
        >
          {[
            {
              icon: <Brain className="w-5 h-5 text-emerald-400" />,
              title: "AI Crop Analysis",
              description:
                "Upload crop images for instant AI-powered health analysis with disease detection and treatment recommendations.",
              color: "var(--color-primary)",
              borderClass: "glow-border-emerald",
            },
            {
              icon: <CloudSun className="w-5 h-5 text-blue-400" />,
              title: "Weather Intelligence",
              description:
                "Real-time weather data with smart alerts for rain, heat, drought, and frost — tailored to your farm location.",
              color: "var(--color-info)",
              borderClass: "glow-border-emerald",
            },
            {
              icon: <Map className="w-5 h-5 text-teal-400" />,
              title: "Map-Based Plots",
              description:
                "Register and manage farm plots on interactive maps with GPS coordinates and area calculation.",
              color: "var(--color-success)",
              borderClass: "glow-border-emerald",
            },
            {
              icon: <LayoutDashboard className="w-5 h-5 text-pink-400" />,
              title: "Smart Dashboard",
              description:
                "Overview cards, seasonal summaries, expense tracking, and health reports at a glance.",
              color: "var(--color-accent)",
              borderClass: "glow-border-emerald",
            },
            {
              icon: <Volume2 className="w-5 h-5 text-amber-400" />,
              title: "Voice & Multilingual",
              description:
                "Text-to-speech recommendations and regional language support for accessibility.",
              color: "var(--color-warning)",
              borderClass: "glow-border-amber",
            },
            {
              icon: <FlaskConical className="w-5 h-5 text-red-400" />,
              title: "Simulation Sandbox",
              description:
                "Test with simulated weather, disease, and pest scenarios without real-world dependency.",
              color: "var(--color-danger)",
              borderClass: "glow-border-rose",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{
                y: -6,
                transition: { type: "spring", stiffness: 300, damping: 10 },
              }}
              className={`glass-card p-6 border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl group cursor-default transition-all duration-300 ${feature.borderClass}`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105"
                style={{
                  background: `${feature.color}12`,
                  border: `1px solid ${feature.color}25`,
                }}
              >
                {feature.icon}
              </div>
              <h3 className="text-base font-bold mb-2 text-white">
                {feature.title}
              </h3>
              <p className="text-xs leading-relaxed text-zinc-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-12 border-t border-zinc-900/60 text-xs text-zinc-500 bg-[#030303]/90">
        <p>AgriSense AI — Empowering Farming Communities with Technology</p>
      </footer>
    </div>
  );
}
