"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

export type AuthState = { error?: string };

const loginSchema = z.object({
  email: z.email("Format email belum benar."),
  password: z.string().min(6, "Password minimal 6 karakter."),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(3, "Nama lengkap minimal 3 karakter.").max(80),
  className: z.string().trim().min(2, "Isi kelas kamu.").max(40),
  password: z.string().min(8, "Password minimal 8 karakter."),
});

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email atau password salah." };
  redirect("/dashboard");
}

export async function registerAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    className: formData.get("className"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName, class_name: parsed.data.className } },
  });
  if (error) return { error: error.message };
  if (!data.session) redirect("/login?message=Cek+email+kamu+untuk+konfirmasi+akun");
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}

