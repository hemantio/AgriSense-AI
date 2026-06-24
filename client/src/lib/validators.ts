/**
 * AgriSense AI — Form Validation Schemas
 * ==========================================
 * Zod schemas for client-side form validation.
 */

import { z } from "zod";

// --- Auth Schemas ---
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(150, "Name must be less than 150 characters"),
  role: z.enum(["admin", "farmer"]).default("farmer"),
  phone_number: z
    .string()
    .regex(/^\+?[\d\s\-]{7,20}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  village_name: z.string().max(150).optional().or(z.literal("")),
  preferred_language: z.string().default("en"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

// --- Plot Schemas ---
export const plotSchema = z.object({
  plot_name: z
    .string()
    .min(2, "Plot name must be at least 2 characters")
    .max(200, "Plot name must be less than 200 characters"),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  approximate_area_acres: z
    .number()
    .positive("Area must be a positive number")
    .max(10000, "Area seems too large")
    .optional(),
  soil_type: z.string().max(100).optional().or(z.literal("")),
});

// --- Crop Schemas ---
export const cropSchema = z.object({
  plot_id: z.string().uuid("Please select a valid plot"),
  crop_name: z
    .string()
    .min(2, "Crop name must be at least 2 characters")
    .max(150, "Crop name must be less than 150 characters"),
  seed_variety: z.string().max(150).optional().or(z.literal("")),
  seed_brand: z.string().max(150).optional().or(z.literal("")),
  sowing_date: z.string().optional(),
  expected_harvest_date: z.string().optional(),
  crop_stage: z
    .enum([
      "sowing",
      "germination",
      "vegetative",
      "flowering",
      "fruiting",
      "harvest",
      "post-harvest",
    ])
    .default("sowing"),
  description: z.string().max(1000).optional().or(z.literal("")),
});

// --- Expense Schemas ---
export const expenseSchema = z.object({
  crop_id: z.string().uuid("Please select a valid crop"),
  category: z.enum([
    "seeds",
    "fertilizer",
    "pesticide",
    "labor",
    "irrigation",
    "miscellaneous",
  ]),
  amount: z
    .number()
    .positive("Amount must be a positive number")
    .max(10_000_000, "Amount seems too large"),
  expense_date: z.string().optional(),
  description: z.string().max(300).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

// --- Types from Schemas ---
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PlotFormData = z.infer<typeof plotSchema>;
export type CropFormData = z.infer<typeof cropSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
