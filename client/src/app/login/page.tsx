"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api, setTokens } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { loginSchema } from "@/lib/validators";
import { Sprout, Mail, Lock, Key, ShieldCheck } from "lucide-react";
import BackgroundCanvas from "@/components/BackgroundCanvas";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message || "Invalid input");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login(email, password);
      const { access_token, refresh_token, user } = response.data;

      setTokens(access_token, refresh_token);
      setUser(user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(
        error.response?.data?.detail || "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#030303]">
      {/* Background Canvas Particles */}
      <BackgroundCanvas />

      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full opacity-[0.12]"
          style={{
            background: "radial-gradient(circle, var(--color-primary) 0%, transparent 75%)",
          }}
        />
        <div
          className="absolute bottom-[20%] right-[30%] w-[400px] h-[400px] rounded-full opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, var(--color-accent) 0%, transparent 75%)",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="w-11 h-11 rounded-lg gradient-primary flex items-center justify-center text-white"
            >
              <Sprout className="w-6 h-6 text-zinc-900" />
            </motion.div>
            <span className="text-2xl font-bold tracking-tight text-white">
              AgriSense{" "}
              <span className="text-[var(--color-primary-light)]">AI</span>
            </span>
          </Link>
          <p className="mt-3 text-sm text-zinc-400">
            Sign in to your farm management dashboard
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="glass-card p-8 border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl shadow-2xl rounded-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 rounded-lg text-xs flex items-center gap-2 bg-red-950/20 border border-red-500/20 text-[var(--color-danger-light)]"
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold mb-2 text-zinc-400 uppercase tracking-wide"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10! border-zinc-800 focus:border-[var(--color-primary-light)] focus:shadow-[0_0_12px_rgba(52,211,153,0.15)] bg-zinc-950/80 rounded-lg text-white"
                  placeholder="ramesh@agrisense.ai"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold mb-2 text-zinc-400 uppercase tracking-wide"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10! border-zinc-800 focus:border-[var(--color-primary-light)] focus:shadow-[0_0_12px_rgba(52,211,153,0.15)] bg-zinc-950/80 rounded-lg text-white"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="btn btn-primary w-full py-2.5 text-sm font-semibold mt-2 shadow-lg shadow-emerald-500/10 cursor-pointer text-zinc-900 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] border-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin"
                  />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          {/* Demo Credentials */}
          <div
            className="mt-6 p-4 rounded-xl text-xs bg-emerald-950/10 border border-emerald-500/15"
          >
            <p
              className="font-bold mb-2 flex items-center gap-1.5 text-[var(--color-primary-light)]"
            >
              <Key className="w-3.5 h-3.5" /> Demo Credentials
            </p>
            <p className="text-zinc-400">
              <span className="font-semibold text-zinc-300">Admin:</span> admin@agrisense.ai / Password123
            </p>
            <p className="text-zinc-400 mt-1">
              <span className="font-semibold text-zinc-300">Farmer:</span> ramesh@agrisense.ai / Password123
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <p
          className="text-center mt-6 text-[10px] text-zinc-500 flex items-center justify-center gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secured with JWT + bcrypt + RBAC
        </p>
      </div>
    </div>
  );
}
