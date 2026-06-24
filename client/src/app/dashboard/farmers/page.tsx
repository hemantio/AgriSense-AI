"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Farmer {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  village_name: string;
  preferred_language: string;
  notes?: string;
  created_at: string;
}

export default function FarmersPage() {
  const { user } = useAuthStore();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [village, setVillage] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [villageName, setVillageName] = useState("");
  const [language, setLanguage] = useState("en");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFarmers = async () => {
    setIsLoading(true);
    try {
      const response = await api.listFarmers({
        page,
        page_size: 10,
        search: search || undefined,
        village: village || undefined,
      });
      setFarmers(response.data.farmers);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching farmers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchFarmers();
    }
  }, [page, search, village, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      await api.createFarmer({
        name,
        email,
        password,
        phone_number: phone,
        village_name: villageName,
        preferred_language: language,
        notes: notes || undefined,
      });
      
      toast.success(`Farmer ${name} registered successfully!`);
      // Reset form & close modal
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setVillageName("");
      setLanguage("en");
      setNotes("");
      setIsModalOpen(false);
      fetchFarmers();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Failed to create farmer";
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this farmer?")) return;
    try {
      await api.deleteFarmer(id);
      toast.success("Farmer account deleted successfully.");
      fetchFarmers();
    } catch (error) {
      toast.error("Failed to delete farmer account.");
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 text-3xl mb-4 border border-red-500/20">
          ⚠️
        </div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Access Denied</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md">
          Farmer Management is only accessible to Admin users. Please contact system administrators if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            Farmer Accounts 👨‍🌾
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Create, search, and manage registered farmer profiles.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary self-start sm:self-center"
        >
          ➕ Register New Farmer
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary-light)] transition-colors w-full"
        />
        <input
          type="text"
          placeholder="Filter by village name..."
          value={village}
          onChange={(e) => {
            setVillage(e.target.value);
            setPage(1);
          }}
          className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary-light)] transition-colors w-full"
        />
        <div className="flex items-center text-xs text-[var(--text-muted)] sm:col-span-2 md:col-span-1 justify-end">
          Total Farmers: {total}
        </div>
      </div>

      {/* Farmer Grid list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-card p-6 h-48 animate-pulse bg-[var(--bg-secondary)]/50" />
          ))}
        </div>
      ) : farmers.length === 0 ? (
        <div className="glass-card p-12 text-center text-[var(--text-secondary)]">
          <p className="text-lg font-medium">No Farmers Found</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Try adjusting your filters or add a new farmer profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmers.map((farmer, index) => (
            <motion.div
              key={farmer.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, translateY: -2 }}
              className="glass-card p-6 group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 gradient-primary opacity-5 blur-2xl group-hover:opacity-20 transition-opacity pointer-events-none" />
              
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--border-color)] flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
                    {farmer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-[var(--text-primary)]">{farmer.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-light)] text-[var(--text-muted)]">
                      📍 {farmer.village_name || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <p className="flex items-center gap-2">
                    <span>📧</span> <span className="truncate">{farmer.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span>📞</span> <span>{farmer.phone_number || "N/A"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span>🗣️</span> <span className="capitalize">{farmer.preferred_language === "hi" ? "Hindi" : "English"}</span>
                  </p>
                  {farmer.notes && (
                    <p className="text-xs text-[var(--text-muted)] italic mt-2 line-clamp-2">
                      &ldquo;{farmer.notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-light)] flex justify-between items-center">
                <span className="text-[10px] text-[var(--text-muted)]">
                  Registered: {new Date(farmer.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(farmer.id)}
                  className="text-xs text-[var(--color-danger-light)] hover:underline"
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Register Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-card w-full max-w-lg p-6 overflow-y-auto max-h-[90vh] relative"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Register Farmer Account</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-2xl text-[var(--text-secondary)] hover:text-white"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-xs text-[var(--color-danger-light)]">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    placeholder="Minimum 6 chars"
                    minLength={6}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    placeholder="10-digit mobile"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Village Name</label>
                  <input
                    type="text"
                    required
                    value={villageName}
                    onChange={(e) => setVillageName(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    placeholder="e.g. Rampur"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Preferred Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                  placeholder="Soil quality details, primary crops, general observations..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-light)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registering..." : "Complete Registration"}
                </button>
              </div>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
