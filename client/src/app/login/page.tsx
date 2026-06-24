"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setTokens } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { loginSchema } from "@/lib/validators";
import { Sprout, Mail, Lock, Key, ShieldCheck } from "lucide-react";

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
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full opacity-[0.15]"
          style={{
            background: "radial-gradient(circle, var(--color-primary) 0%, transparent 75%)",
          }}
        />
        <div
          className="absolute bottom-[20%] right-[30%] w-[400px] h-[400px] rounded-full opacity-[0.1]"
          style={{
            background: "radial-gradient(circle, var(--color-accent) 0%, transparent 75%)",
          }}
        />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-lg gradient-primary flex items-center justify-center text-white transition-transform group-hover:scale-105">
              <Sprout className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              AgriSense{" "}
              <span style={{ color: "var(--color-primary-light)" }}>AI</span>
            </span>
          </Link>
          <p className="mt-3 text-sm text-zinc-400">
            Sign in to your farm management dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 border border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,12,0.65)] backdrop-blur-md shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div
                className="p-3 rounded-lg text-xs animate-fade-in flex items-center gap-2"
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "var(--color-danger-light)",
                }}
              >
                <span>⚠️</span> {error}
              </div>
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
                  className="input-field pl-10"
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
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-full py-2.5 text-sm font-semibold mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"
                  />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div
            className="mt-6 p-4 rounded-lg text-xs"
            style={{
              background: "rgba(16, 185, 129, 0.04)",
              border: "1px solid rgba(16, 185, 129, 0.15)",
            }}
          >
            <p
              className="font-bold mb-2 flex items-center gap-1.5"
              style={{ color: "var(--color-primary-light)" }}
            >
              <Key className="w-3.5 h-3.5" /> Demo Credentials
            </p>
            <p className="text-zinc-400">
              <strong>Admin:</strong> admin@agrisense.ai / Password123
            </p>
            <p className="text-zinc-400 mt-1">
              <strong>Farmer:</strong> ramesh@agrisense.ai / Password123
            </p>
          </div>
        </div>

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
