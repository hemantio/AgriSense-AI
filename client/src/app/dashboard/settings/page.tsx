"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();

  // Profile Form States
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [villageName, setVillageName] = useState(user?.village_name || "");
  const [language, setLanguage] = useState(user?.preferred_language || "en");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");
    setProfileLoading(true);

    try {
      const response = await api.updateProfile({
        name,
        email,
        phone_number: phone,
        village_name: villageName || undefined,
        preferred_language: language,
      });

      // Update global user store details
      setUser({ ...user, ...response.data } as any);
      setProfileSuccess("Profile settings updated successfully!");
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || "Failed to update profile settings.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess("");
    setPwdError("");

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }

    setPwdLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPwdSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdError(err.response?.data?.detail || "Failed to update password. Verify current password.");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
          Account Settings ⚙️
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your personal credentials, communication preferences, and language settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings Card */}
        <div className="glass-card p-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Edit Profile</h2>

          {profileSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-950/20 border border-green-500/20 text-xs text-green-400">
              ✓ {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-xs text-[var(--color-danger-light)]">
              ⚠️ {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Village Name</label>
                <input
                  type="text"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
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
                <option value="en">English (US)</option>
                <option value="hi">Hindi (हिंदी)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-2.5"
              disabled={profileLoading}
            >
              {profileLoading ? "Saving Changes..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="glass-card p-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Change Password</h2>

          {pwdSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-950/20 border border-green-500/20 text-xs text-green-400">
              ✓ {pwdSuccess}
            </div>
          )}

          {pwdError && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-xs text-[var(--color-danger-light)]">
              ⚠️ {pwdError}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                placeholder="Confirm password"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-2.5"
              disabled={pwdLoading}
            >
              {pwdLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
