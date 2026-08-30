"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase/admin";
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

  // Akun submission dibuat dari server dan langsung dikonfirmasi. Ini
  // menghindari antrean email konfirmasi saat semua tim mendaftar bersamaan.
  const admin = createAdminSupabase();
  const { error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName, class_name: parsed.data.className },
  });
  if (error?.code === "email_exists" || error?.message.toLowerCase().includes("already")) {
    return { error: "Email sudah terdaftar. Silakan masuk." };
  }
  if (error) return { error: "Akun belum berhasil dibuat. Coba kembali." };

  const supabase = await createServerSupabase();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (signInError) redirect("/login?message=Akun+berhasil+dibuat.+Silakan+masuk");
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}
