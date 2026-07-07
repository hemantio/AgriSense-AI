import React, { useState } from "react";
import { Check, X, Edit3, Save, Calendar, Sprout, Layers, DollarSign } from "lucide-react";

interface ConfirmationCardProps {
  tool: string;
  params: Record<string, any>;
  onConfirm: (finalParams: Record<string, any>) => void;
  onCancel: () => void;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  tool,
  params,
  onConfirm,
  onCancel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableParams, setEditableParams] = useState({ ...params });

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleChange = (key: string, value: any) => {
    setEditableParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderFields = () => {
    if (tool === "expense_tool") {
      return (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-2 text-zinc-400">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Amount (₹):
            </span>
            {isEditing ? (
              <input
                type="number"
                value={editableParams.amount || ""}
                onChange={(e) => handleChange("amount", parseFloat(e.target.value))}
                className="w-24 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded px-1.5 py-0.5 text-right text-xs focus:outline-none focus:border-emerald-500"
              />
            ) : (
              <span className="font-semibold text-emerald-400">₹{editableParams.amount}</span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-2 text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Category:
            </span>
            {isEditing ? (
              <select
                value={editableParams.category || "misc"}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-28 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-emerald-500"
              >
                {["seed", "fertilizer", "pesticide", "labour", "irrigation", "equipment", "misc"].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : (
              <span className="capitalize font-medium text-zinc-100">{editableParams.category}</span>
            )}
          </div>

          {editableParams.notes && (
            <div className="text-[11px] text-zinc-500 bg-zinc-900/40 p-2 rounded border border-zinc-900/60 mt-1">
              Note: {editableParams.notes}
            </div>
          )}
        </div>
      );
    }

    if (tool === "input_tool") {
      return (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-2 text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Input Product:
            </span>
            {isEditing ? (
              <input
                type="text"
                value={editableParams.product_name || ""}
                onChange={(e) => handleChange("product_name", e.target.value)}
                className="w-28 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-emerald-500"
              />
            ) : (
              <span className="font-semibold text-zinc-100">{editableParams.product_name}</span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-2 text-zinc-400">
              <Sprout className="w-3.5 h-3.5 text-emerald-400" /> Quantity:
            </span>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={editableParams.quantity || ""}
                  onChange={(e) => handleChange("quantity", parseFloat(e.target.value))}
                  className="w-14 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={editableParams.unit || "bags"}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-100 rounded px-1 py-0.5 text-[10px] focus:outline-none"
                >
                  {["kg", "liters", "ml", "grams", "bags"].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="font-medium text-emerald-400">
                {editableParams.quantity} {editableParams.unit}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (tool === "irrigation_tool") {
      return (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-2 text-zinc-400">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Duration (Hours):
            </span>
            {isEditing ? (
              <input
                type="number"
                step="0.5"
                value={editableParams.hours || ""}
                onChange={(e) => handleChange("hours", parseFloat(e.target.value))}
                className="w-16 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:border-emerald-500"
              />
            ) : (
              <span className="font-semibold text-emerald-400">{editableParams.hours} hrs</span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-2 text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Water Source:
            </span>
            {isEditing ? (
              <select
                value={editableParams.water_source || "borewell"}
                onChange={(e) => handleChange("water_source", e.target.value)}
                className="w-24 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-emerald-500"
              >
                {["borewell", "canal", "rainwater", "well"].map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            ) : (
              <span className="capitalize font-medium text-zinc-100">{editableParams.water_source || "borewell"}</span>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const getCardTitle = () => {
    if (tool === "expense_tool") return "Record Expense?";
    if (tool === "input_tool") return "Log Farm Input?";
    if (tool === "irrigation_tool") return "Log Watering Event?";
    return "Confirm Action?";
  };

  return (
    <div className="w-full bg-zinc-950/80 rounded-xl border border-zinc-800/80 p-3.5 shadow-lg backdrop-blur-md transition-all duration-300 my-2">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
        <span className="text-xs font-semibold text-zinc-200 tracking-wide">
          {getCardTitle()}
        </span>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[10px] flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Save className="w-3 h-3" /> Done
          </button>
        )}
      </div>

      <div className="mb-4">{renderFields()}</div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onConfirm(editableParams)}
          disabled={isEditing}
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-bold py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" /> Haan
        </button>
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 text-xs transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
};
