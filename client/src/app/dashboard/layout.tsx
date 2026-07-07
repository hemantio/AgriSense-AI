"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { clearTokens, api } from "@/lib/api-client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, VolumeX, Search } from "lucide-react";
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
import { CommandBar } from "@/components/CommandBar";
import { ConfirmationCard } from "@/components/ConfirmationCard";
import { MessageFeedback } from "@/components/MessageFeedback";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // CIE Command Bar state
  const [commandBarOpen, setCommandBarOpen] = useState(false);
  
  // CIE Chat and Speech states
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id?: string;
    role: string;
    content: string;
    suggestions?: string[];
    needs_confirmation?: boolean;
    confirmation_data?: any;
    tool_used?: string;
  }>>([
    { role: "assistant", content: "नमस्ते! मैं कृषि मित्र (Krishi Mitra) हूँ। मैं आपकी खेती-बाड़ी, मौसम, खाद और खर्चों को मैनेज करने में मदद कर सकता हूँ। पूछिए!" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [ttsMuted, setTtsMuted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Global hotkeys for Command Bar (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandBarOpen((prev) => !prev);
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setCommandBarOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Speech Recognition initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.lang = "hi-IN"; // Default to Hindi
        rec.interimResults = false;

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          handleSend(transcript);
        };

        rec.onerror = (event: any) => {
          console.warn("Speech recognition warning/error:", event.error);
          setMicActive(false);
          if (event.error === "not-allowed") {
            toast.error("Microphone access denied. Please allow microphone permission in your browser settings.");
          } else if (event.error === "no-speech") {
            toast.warning("No speech detected. Please try again.");
          } else {
            toast.error(`Speech recognition failed: ${event.error}`);
          }
        };

        rec.onend = () => {
          setMicActive(false);
        };

        setRecognition(rec);
      }
    }
  }, []);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, assistantOpen]);

  const toggleMic = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }
    if (micActive) {
      recognition.stop();
    } else {
      try {
        recognition.start();
        setMicActive(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSend = async (textOverride?: string) => {
    const text = textOverride !== undefined ? textOverride : inputValue;
    if (!text.trim()) return;

    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    try {
      // Add empty assistant message that we will stream into
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      await api.sendChatStream(
        {
          message: text,
          session_id: sessionId,
          page_context: pathname
        },
        (event) => {
          if (event.type === "token") {
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === "assistant") {
                last.content += event.data.text;
              }
              return updated;
            });
          } else if (event.type === "done") {
            const data = event.data;
            if (data.session_id) {
              setSessionId(data.session_id);
            }
            
            let finalContent = "";
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === "assistant") {
                last.id = data.message_id;
                last.suggestions = data.suggestions || [];
                last.needs_confirmation = data.needs_confirmation;
                last.confirmation_data = data.confirmation_data;
                last.tool_used = data.tool_used;
                finalContent = last.content;
              }
              return updated;
            });

            // TTS audio response read aloud if not muted
            if (finalContent && !ttsMuted && "speechSynthesis" in window) {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(finalContent);
              const voices = window.speechSynthesis.getVoices();
              const hiVoice = voices.find(v => v.lang.startsWith("hi"));
              if (hiVoice) utterance.voice = hiVoice;
              utterance.lang = "hi-IN";
              window.speechSynthesis.speak(utterance);
            }

            // Handle Client Navigation Actions
            if (data.tool_used === "navigation_tool" && data.action_result?.navigate) {
              const target = data.action_result.target_page;
              const qps = data.action_result.query_params || {};
              let routePath = `/dashboard/${target}`;
              if (target === "dashboard") routePath = "/dashboard";
              if (qps.plot_id) routePath += `?plot_id=${qps.plot_id}`;
              router.push(routePath);
            }
          }
        }
      );

    } catch (err) {
      console.error("CIE Chat error:", err);
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant" && !last.content) {
          last.content = "नेटवर्क एरर। कृपया फिर से प्रयास करें।";
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
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
            <button
              onClick={() => setCommandBarOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all text-xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search or ask Krishi Mitra...</span>
              <kbd className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[10px] font-mono ml-2">⌘K</kbd>
            </button>

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
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="mb-3 w-96 max-h-[500px] rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-zinc-900 px-4 py-3 bg-zinc-950/40">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold tracking-wider text-zinc-300 font-mono">
                        कृषि मित्र — Krishi Mitra AI
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setTtsMuted(!ttsMuted);
                          if (!ttsMuted && "speechSynthesis" in window) {
                            window.speechSynthesis.cancel();
                          }
                        }}
                        title={ttsMuted ? "Unmute Assistant Voice" : "Mute Assistant Voice"}
                        className={`p-1.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer ${
                          ttsMuted ? "text-zinc-500" : "text-emerald-400"
                        }`}
                      >
                        {ttsMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          setAssistantOpen(false);
                          setMicActive(false);
                          if (recognition) recognition.stop();
                        }}
                        className="p-1.5 rounded hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[220px] max-h-[300px]">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} w-full`}
                      >
                        {msg.content && (
                          <div
                            className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                              msg.role === "user"
                                ? "bg-emerald-900/40 text-emerald-100 border border-emerald-800/30 rounded-tr-none"
                                : "bg-zinc-900/60 text-zinc-200 border border-zinc-800/40 rounded-tl-none"
                            }`}
                          >
                            <p className="whitespace-pre-line">{msg.content}</p>
                          </div>
                        )}

                        {/* Confirmation Card Inline */}
                        {msg.role === "assistant" && msg.needs_confirmation && msg.confirmation_data && (
                          <div className="w-80 mt-1 max-w-[90%]">
                            <ConfirmationCard
                              tool={msg.confirmation_data.tool}
                              params={msg.confirmation_data.params}
                              onConfirm={() => handleSend("Haan")}
                              onCancel={() => handleSend("Cancel")}
                            />
                          </div>
                        )}

                        {/* Message Feedback Loop */}
                        {msg.role === "assistant" && msg.id && (
                          <MessageFeedback messageId={msg.id} />
                        )}

                        {/* Suggestion Chips */}
                        {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                            {msg.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSend(suggestion)}
                                className="text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Loader */}
                    {isLoading && (
                      <div className="flex items-center gap-2 text-zinc-500 font-mono text-[10px] pl-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Krishi Mitra is thinking...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Box */}
                  <div className="p-3 border-t border-zinc-900 bg-zinc-950/60 flex items-center gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                      }}
                      placeholder="पूछिए... (e.g. आज बारिश होगी?)"
                      className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                      disabled={isLoading}
                    />

                    {/* Microphone Pulse Animation while listening */}
                    <button
                      onClick={toggleMic}
                      className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center relative overflow-hidden ${
                        micActive
                          ? "bg-red-950/40 border-red-500/50 text-red-400"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                      title={micActive ? "Stop listening" : "Start voice command"}
                    >
                      {micActive && (
                        <span className="absolute inset-0 bg-red-500/10 animate-ping rounded-xl" />
                      )}
                      <Mic className={`w-4 h-4 ${micActive ? "animate-pulse text-red-400" : ""}`} />
                    </button>

                    <button
                      onClick={() => handleSend()}
                      disabled={isLoading || !inputValue.trim()}
                      className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-900 disabled:opacity-40 disabled:hover:bg-emerald-500 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
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
                className={`w-3 h-3 rounded-full ${micActive ? "bg-red-400 animate-pulse" : "bg-[var(--color-primary-light)]"}`}
              />
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {assistantOpen ? "Close Co-Pilot" : "कृषि मित्र (Krishi Mitra) Co-Pilot"}
              </span>
            </motion.div>
          </div>
        </main>
      </div>

      <CommandBar
        isOpen={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
        pageContext={pathname}
      />
    </div>
  );
}
