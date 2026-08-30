"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircleIcon, LockClosedIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getDeviceFingerprint, hasVotedLocally, markAsVoted } from "@/lib/fingerprint";
import type { PublicProject } from "@/lib/types";

export function VoteModal({ project, onClose }: { project: PublicProject | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error" | "already">("idle");
  const [message, setMessage] = useState("");

  const resetAndClose = useCallback(() => {
    if (status !== "already") {
      setStatus("idle");
      setMessage("");
    }
    onClose();
  }, [onClose, status]);

  useEffect(() => {
    if (!project) return;
    if (hasVotedLocally()) {
      setStatus("already");
      setMessage("Kamu sudah menggunakan hak suara dari perangkat ini.");
      return;
    }
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && resetAndClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, resetAndClose]);

  async function submit() {
    if (!project || status === "sending") return;
    setStatus("sending");
    setMessage("");
    try {
      const deviceId = await getDeviceFingerprint();
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: project.id, deviceId, website: "" }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        if (response.status === 409) markAsVoted();
        setStatus("error");
        setMessage(result.message ?? "Voting gagal. Coba kembali.");
        return;
      }
      markAsVoted();
      setStatus("success");
      setMessage(result.message ?? "Suara berhasil disimpan.");
      confetti({ particleCount: 110, spread: 75, origin: { y: 0.7 }, colors: ["#65e7ff", "#9d7bff", "#fbd561"] });
    } catch {
      setStatus("error");
      setMessage("Koneksi terputus. Pastikan internet aktif lalu coba lagi.");
    }
  }

  return (
    <AnimatePresence>
      {project && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && resetAndClose()}>
          <motion.div ref={dialogRef} className="vote-modal" role="dialog" aria-modal="true" aria-label={`Voting ${project.title}`} initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.98 }} transition={{ type: "spring", stiffness: 330, damping: 28 }}>
            <button className="modal-close" type="button" onClick={resetAndClose} aria-label="Tutup"><XMarkIcon /></button>
            {status === "success" ? (
              <div className="vote-success">
                <CheckCircleIcon />
                <span className="eyebrow">VOTE RECORDED</span>
                <h2>Terima kasih!</h2>
                <p>{message}</p>
                <button className="button button-primary" type="button" onClick={resetAndClose}>Kembali ke katalog</button>
              </div>
            ) : status === "already" ? (
              <div className="vote-success">
                <LockClosedIcon />
                <span className="eyebrow">SUDAH VOTING</span>
                <h2>Satu perangkat, satu suara.</h2>
                <p>{message}</p>
                <button className="button button-primary" type="button" onClick={resetAndClose}>Kembali ke katalog</button>
              </div>
            ) : (
              <>
                <div className="vote-modal-head">
                  <span className="eyebrow">PEOPLE&apos;S CHOICE</span>
                  <h2>Vote {project.title}?</h2>
                  <p>Booth {project.boothNumber?.toString().padStart(2, "0") ?? "—"} · {project.teamName}</p>
                </div>
                <div className="vote-form">
                  <p className="vote-confirm-text">Satu perangkat hanya dapat memberikan satu suara. Pilihan bersifat final dan tidak bisa diubah.</p>
                  {status === "error" && <div className="form-alert form-alert-error">{message}</div>}
                  <button className="button button-primary button-vote-submit" type="button" onClick={submit} disabled={status === "sending"}>
                    <LockClosedIcon />{status === "sending" ? "Menyimpan suara..." : "Ya, vote sekarang"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
