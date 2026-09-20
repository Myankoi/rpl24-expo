"use client";

import { QRCodeSVG } from "qrcode.react";
import { PrinterIcon } from "@heroicons/react/24/outline";

export function QrPrintCards({ eventName, catalogUrl, voteUrl }: { eventName: string; catalogUrl: string; voteUrl: string }) {
  return (
    <>
      <button className="button button-primary print-button" type="button" onClick={() => window.print()}><PrinterIcon />Cetak QR</button>
      <div className="qr-print-grid">
        <article className="qr-poster"><span className="qr-label">{eventName}</span><h2>Digital Project<br />Catalog</h2><p>Jelajahi seluruh karya siswa RPL.</p><div className="qr-code"><QRCodeSVG value={catalogUrl} size={270} level="H" marginSize={2} fgColor="#071126" bgColor="#ffffff" /></div><strong>SCAN TO EXPLORE</strong><small>{catalogUrl}</small></article>
        <article className="qr-poster qr-poster-vote"><span className="qr-label">{eventName}</span><h2>Vote Your<br />Favorite Project</h2><p>Gunakan tiket pengunjung untuk memilih satu proyek.</p><div className="qr-code"><QRCodeSVG value={voteUrl} size={270} level="H" marginSize={2} fgColor="#071126" bgColor="#ffffff" /></div><strong>SCAN TO VOTE</strong><small>{voteUrl}</small></article>
      </div>
    </>
  );
}
