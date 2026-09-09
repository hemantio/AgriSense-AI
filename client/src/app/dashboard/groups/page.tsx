"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Users, QrCode, Plus, X, Search, Calendar, Landmark, Info } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string | null;
  code: string;
  created_at: string;
}

interface Member {
  user_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

export default function GroupsPage() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModalGroup, setQrModalGroup] = useState<Group | null>(null);
  
  // Selected Group details
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const response = await api.listGroups();
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load cooperative groups.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async (groupId: string) => {
    setLoadingMembers(true);
    try {
      const response = await api.listGroupMembers(groupId);
      setMembers(response.data);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load group members.");
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchMembers(selectedGroup.id);
    } else {
      setMembers([]);
    }
  }, [selectedGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      await api.createGroup({
        name,
        description: description || undefined,
      });

      toast.success(`Group "${name}" created successfully!`);
      setName("");
      setDescription("");
      setIsModalOpen(false);
      fetchGroups();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Failed to create group";
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
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
          Group Management is only accessible to Admin users. Please contact system administrators if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            Cooperative Groups <Landmark className="w-7 h-7 text-[var(--color-primary-light)]" />
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Create cooperative groups, view group members, and generate QR codes for farmers to scan and join.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary self-start sm:self-center flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Group
        </button>
      </div>

      {/* Main Grid: Groups List and Members Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Groups List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Active Groups ({groups.length})</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-card p-6 h-28 animate-pulse bg-[var(--bg-secondary)]/50" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="glass-card p-12 text-center text-[var(--text-secondary)]">
              <p className="text-lg font-medium">No Groups Configured</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Click the button above to create your first cooperative group.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`glass-card p-5 border transition-all cursor-pointer relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    selectedGroup?.id === group.id 
                      ? "border-[var(--color-primary-light)] bg-[var(--bg-secondary)]/80" 
                      : "border-[var(--border-color)] hover:border-[var(--text-muted)]"
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg text-[var(--text-primary)]">{group.name}</span>
                      <span className="text-xs bg-zinc-800 text-[var(--text-secondary)] px-2 py-0.5 rounded border border-zinc-700">
                        Code: {group.code}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {group.description || "No description provided."}
                    </p>
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px] pt-1">
                      <Calendar className="w-3 h-3" />
                      Created {new Date(group.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setQrModalGroup(group)}
                      className="btn text-xs px-3 py-1.5 border border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 hover:bg-zinc-900 text-[var(--text-primary)] flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Show QR
                    </button>
                    <button
                      onClick={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
                      className="btn text-xs px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-zinc-900 font-medium flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" /> {selectedGroup?.id === group.id ? "Hide Members" : "View Members"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Group Members Detail view */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Group Details</h2>
          
          <AnimatePresence mode="wait">
            {selectedGroup ? (
              <motion.div
                key={selectedGroup.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-card p-5 border border-[var(--border-color)] space-y-4 bg-zinc-950/40"
              >
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">{selectedGroup.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{selectedGroup.description || "No description."}</p>
                </div>

                <div className="border-t border-[var(--border-light)] pt-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                    <span>Enrolled Members</span>
                    <span>{members.length}</span>
                  </h4>

                  {loadingMembers ? (
                    <div className="space-y-2 py-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-10 bg-zinc-900/60 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[var(--text-muted)] border border-dashed border-zinc-800 rounded bg-zinc-950/50">
                      No members registered in this group yet. Use the QR Code to join.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {members.map((member) => (
                        <div key={member.user_id} className="p-3 bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-900 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{member.name}</p>
                            <p className="text-[var(--text-muted)] text-[10px]">{member.email}</p>
                          </div>
                          <div className="text-right">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 capitalize">
                              {member.role}
                            </span>
                            <p className="text-[var(--text-muted)] text-[9px] mt-1">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-8 border border-dashed border-zinc-800 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[300px]">
                <Info className="w-8 h-8 mb-2 text-zinc-700" />
                <p className="text-sm font-medium">Select a Group</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
                  Click "View Members" on any group to see its metadata and members list here.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Modal 1: Create Group */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-md p-6 border border-[var(--border-color)] space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Create New Cooperative Group</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-950/40 border border-red-900/30 rounded text-xs text-red-400">
                    ❌ {formError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Group Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sonipat Rice Farmers Association"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Details about the group purpose, location, or cooperative membership requirements."
                    rows={3}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full py-2.5 font-semibold text-sm"
                >
                  {isSubmitting ? "Creating..." : "Create Group"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: QR Code display */}
      <AnimatePresence>
        {qrModalGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-sm p-6 border border-[var(--border-color)] space-y-6 text-center bg-zinc-950"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h3 className="font-bold text-[var(--text-primary)] text-left truncate max-w-[80%]">
                  {qrModalGroup.name} QR Code
                </h3>
                <button onClick={() => setQrModalGroup(null)} className="text-[var(--text-muted)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-white rounded-2xl border border-zinc-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrModalGroup.id}`}
                    alt={`QR Code for ${qrModalGroup.name}`}
                    width={250}
                    height={250}
                    className="rounded"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Scan to Join Group</p>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
                    Farmers scan this code with the AgriSense mobile app to join this group.
                  </p>
                </div>
                <div className="w-full bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-xs">
                  <span className="text-[var(--text-muted)]">Join Code:</span> <strong className="text-[var(--color-primary-light)] font-mono">{qrModalGroup.code}</strong>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
