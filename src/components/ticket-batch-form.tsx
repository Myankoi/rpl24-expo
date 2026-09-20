"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PrinterIcon, TicketIcon } from "@heroicons/react/24/outline";

type Ticket = { token: string; code: string };

export function TicketBatchForm({ voteBaseUrl }: { voteBaseUrl: string }) {
  const [label, setLabel] = useState("Pengunjung");
  const [quantity, setQuantity] = useState("20");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/tickets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label, quantity: Number(quantity) }) });
      const result = (await response.json()) as { message?: string; tickets?: Ticket[] };
      if (!response.ok || !result.tickets) throw new Error(result.message ?? "Batch tiket gagal dibuat.");
      setTickets(result.tickets);
      setMessage("Tiket dibuat. Simpan atau cetak batch ini sekarang; token tidak dapat diambil ulang.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Batch tiket gagal dibuat.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="ticket-center"><div className="dashboard-card ticket-generator"><div className="card-icon"><TicketIcon /></div><h2>Terbitkan tiket pengunjung</h2><p>Token mentah hanya dikirim sekali ke browser dan tidak disimpan di database.</p><div className="form-row"><label className="field"><span>Label batch</span><input value={label} onChange={(event) => setLabel(event.target.value)} /></label><label className="field"><span>Jumlah</span><input type="number" min={1} max={500} value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label></div><button className="button button-primary" type="button" onClick={generate} disabled={loading}>{loading ? "Membuat tiket..." : "Buat batch tiket"}</button>{message && <div className="form-alert form-alert-success">{message}</div>}</div>{tickets.length > 0 && <><button className="button button-ghost print-button" type="button" onClick={() => window.print()}><PrinterIcon />Cetak tiket batch ini</button><div className="ticket-print-grid">{tickets.map((ticket) => <article className="ticket-card" key={ticket.token}><QRCodeSVG value={`${voteBaseUrl}#ticket=${ticket.token}`} size={150} level="H" marginSize={2} /><strong>{ticket.code}</strong><small>Scan untuk voting · satu tiket satu suara</small></article>)}</div></>}</div>;
}
