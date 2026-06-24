"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

interface InputRecord {
  id: string;
  name: string;
  category: string;
  brand?: string;
  dosage_instructions?: string;
  quantity: string;
  purchase_date: string;
  notes?: string;
}

export default function InputsPage() {
  const { user } = useAuthStore();
  const [inputs, setInputs] = useState<InputRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Fertilizer");
  const [brand, setBrand] = useState("");
  const [dosage, setDosage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInputs = async () => {
    setIsLoading(true);
    try {
      const response = await api.listInputs();
      setInputs(response.data.inputs || response.data || []);
    } catch (error) {
      console.error("Error fetching inputs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInputs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setFormError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.uploadInputOCR(formData);
      const data = response.data;

      // Auto-fill values returned by OCR service
      if (data.product_name) setName(data.product_name);
      if (data.brand) setBrand(data.brand);
      if (data.dosage_instructions) setDosage(data.dosage_instructions);
      if (data.category) setCategory(data.category);
      if (data.notes) setNotes(data.notes);
    } catch (err: any) {
      setFormError("OCR scan failed or was partially readable. You can manually type the fields below.");
    } finally {
      setIsScanning(false);
      // Clear file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      await api.createInput({
        name,
        category,
        brand: brand || undefined,
        dosage_instructions: dosage || undefined,
        quantity,
        purchase_date: purchaseDate,
        notes: notes || undefined,
      });

      // Clear
      setName("");
      setCategory("Fertilizer");
      setBrand("");
      setDosage("");
      setQuantity("");
      setPurchaseDate("");
      setNotes("");
      fetchInputs();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to register agricultural input.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
          Agricultural Inputs Scan 🧴
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Scan fertilizer or pesticide labels using AI OCR to auto-fill dosage rules and inventory details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Register/OCR Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 relative overflow-hidden">
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Register Input</h2>

            {/* OCR Scanner upload zone */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-2">
                Scan Packet Label (AI OCR)
              </label>
              
              <div 
                onClick={() => !isScanning && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isScanning 
                    ? "border-[var(--color-primary-light)] bg-[var(--bg-tertiary)]" 
                    : "border-[var(--border-color)] hover:border-[var(--color-primary-light)] bg-[var(--bg-tertiary)]/30"
                } relative overflow-hidden group`}
              >
                {/* Scan Overlay Line Animation */}
                {isScanning && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-primary-light)] animate-[bounce_2s_infinite] shadow-[0_0_10px_#40916c]" />
                )}

                <div className="space-y-2">
                  <span className="text-3xl block group-hover:scale-110 transition-transform">📸</span>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    {isScanning ? "Scanning Label Details..." : "Upload Packet Label Photo"}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Supports JPG, PNG (AI extracts Brand, Dosage, & Name)
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                  disabled={isScanning}
                />
              </div>
            </div>

            <div className="border-t border-[var(--border-light)] pt-6">
              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-xs text-[var(--color-danger-light)]">
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    placeholder="e.g. Urea, Neem Oil, NPK 19-19-19"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    >
                      <option value="Fertilizer">Fertilizer</option>
                      <option value="Pesticide">Pesticide</option>
                      <option value="Seeds">Seeds</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Brand</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                      placeholder="e.g. IFFCO, Bayer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Quantity Purchased</label>
                  <input
                    type="text"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    placeholder="e.g. 5 bags, 2 Litres"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Dosage Instructions</label>
                  <textarea
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    rows={2}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                    placeholder="e.g. Mix 5ml per Litre of water, spray weekly"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[var(--text-muted)] mb-1">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary-light)]"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full pt-2.5 pb-2.5"
                  disabled={isSubmitting || isScanning}
                >
                  {isSubmitting ? "Registering..." : "Add to Inventory"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Inventory List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Input Inventory Ledger</h2>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-[var(--bg-secondary)] rounded-lg" />
                ))}
              </div>
            ) : inputs.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-12">No agricultural inputs registered yet.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[600px] stagger-children">
                {inputs.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)]/20 hover:border-[var(--color-primary-light)] transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 group"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {item.category === "Fertilizer" ? "🧪" : item.category === "Pesticide" ? "🕷️" : "🌱"}
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-[var(--text-primary)]">{item.name}</h3>
                          <span className="text-[10px] text-[var(--text-muted)] capitalize">
                            Brand: {item.brand || "Generic"} &bull; Quantity: {item.quantity}
                          </span>
                        </div>
                      </div>

                      {item.dosage_instructions && (
                        <div className="mt-2.5 p-2 bg-[var(--bg-secondary)] rounded-lg text-xs text-[var(--text-secondary)] border border-[var(--border-light)]">
                          💡 <span className="font-medium text-[var(--text-primary)]">Dosage:</span> {item.dosage_instructions}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--border-light)] text-[10px] text-[var(--text-muted)]">
                      <span>Purchased: {new Date(item.purchase_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
