"use server";

import { createHmac } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveEvent } from "@/lib/dal";
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
  enrollmentCode: z.string().trim().max(100),
  password: z.string().min(8, "Password minimal 8 karakter."),
});

function enrollmentHash(code: string) {
  const secret = process.env.ENROLLMENT_CODE_SECRET ?? process.env.VOTER_HASH_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHmac("sha256", secret).update(code.toUpperCase()).digest("hex");
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email atau password salah, atau email belum diverifikasi." };
  redirect("/dashboard");
}

export async function registerAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    className: formData.get("className"),
    email: formData.get("email"),
    password: formData.get("password"),
    enrollmentCode: formData.get("enrollmentCode"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const event = await getActiveEvent();
  if (!["registration", "review"].includes(event.status)) return { error: "Pendaftaran edisi ini sedang ditutup oleh panitia." };
  const { data: eventSecret } = await createAdminSupabase().from("events").select("enrollment_code_hash").eq("id", event.id).single();
  const expectedHash = eventSecret?.enrollment_code_hash ?? enrollmentHash(process.env.EVENT_ENROLLMENT_CODE ?? "");
  if (!expectedHash) return { error: "Kode enrollment belum dikonfigurasi panitia." };
  if (!parsed.data.enrollmentCode || enrollmentHash(parsed.data.enrollmentCode) !== expectedHash) {
    return { error: "Kode enrollment edisi ini belum benar." };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName, class_name: parsed.data.className } },
  });
  if (error?.message.toLowerCase().includes("already")) return { error: "Email sudah terdaftar. Silakan masuk." };
  if (error || !data.user) return { error: "Akun belum berhasil dibuat. Coba kembali." };

  const admin = createAdminSupabase();
  const { error: enrollmentError } = await admin.from("event_enrollments").upsert({
    event_id: event.id,
    user_id: data.user.id,
    class_name: parsed.data.className,
  }, { onConflict: "event_id,user_id" });
  if (enrollmentError) return { error: "Akun dibuat, tetapi enrollment edisi belum tersimpan. Hubungi panitia." };

  if (data.session) redirect("/dashboard");
  redirect(`/login?message=${encodeURIComponent("Akun dibuat. Cek email untuk verifikasi, lalu masuk.")}`);
}

export async function logoutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}
