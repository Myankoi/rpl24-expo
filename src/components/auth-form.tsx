"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AcademicCapIcon, EnvelopeIcon, LockClosedIcon, UserIcon } from "@heroicons/react/24/outline";
import { loginAction, registerAction, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

const initialState: AuthState = {};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction] = useActionState(action, initialState);
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="auth-form">
      {state.error && <div className="form-alert form-alert-error">{state.error}</div>}
      {mode === "register" && (
        <>
          <label className="field">
            <span>Nama lengkap</span>
            <div className="input-shell"><UserIcon className="icon" /><input name="fullName" autoComplete="name" required placeholder="Nama kamu" value={fullName} onChange={(event) => setFullName(event.target.value)} /></div>
          </label>
          <label className="field">
            <span>Kelas</span>
            <div className="input-shell"><AcademicCapIcon className="icon" /><input name="className" required placeholder="Contoh: XI RPL 1" value={className} onChange={(event) => setClassName(event.target.value)} /></div>
          </label>
        </>
      )}
      <label className="field">
        <span>Email</span>
        <div className="input-shell"><EnvelopeIcon className="icon" /><input name="email" type="email" autoComplete="email" required placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      </label>
      <label className="field">
        <span>Password</span>
        <div className="input-shell"><LockClosedIcon className="icon" /><input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 6 : 8} required placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
      </label>
      <SubmitButton>{mode === "login" ? "Masuk ke dashboard" : "Buat akun peserta"}</SubmitButton>
      <p className="auth-switch">
        {mode === "login" ? "Belum punya akun tim?" : "Sudah punya akun?"}{" "}
        <Link href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Daftar" : "Masuk"}</Link>
      </p>
    </form>
  );
}
