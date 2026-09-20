"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArchiveBoxIcon, Bars3Icon, Squares2X2Icon, TrophyIcon, UserGroupIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { ExpoEvent } from "@/lib/types";

export function Header({ event }: { event: ExpoEvent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link href="/" className="brand" aria-label="RPL Expo beranda" onClick={closeMenu}>
          <span className="brand-icon"><Image src="/rpl-smkn24-logo.png" alt="" width={36} height={36} priority /></span>
          <span><strong>RPL EXPO</strong><small>{event.year}</small></span>
        </Link>
        <div className="nav-menu-shell">
          <button className="nav-toggle" type="button" aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <XMarkIcon /> : <Bars3Icon />}
          </button>
          {menuOpen && <button className="nav-backdrop" type="button" aria-label="Tutup navigasi" onClick={closeMenu} />}
          <nav id="main-navigation" className={`main-nav ${menuOpen ? "is-open" : ""}`}>
            <Link href="/catalog" onClick={closeMenu}><Squares2X2Icon />Katalog</Link>
            <Link href="/vote" onClick={closeMenu}><UserGroupIcon />Voting</Link>
            <Link href="/results" onClick={closeMenu}><TrophyIcon />Hasil</Link>
            <Link href="/editions" onClick={closeMenu}><ArchiveBoxIcon />Arsip</Link>
            <Link className="button button-primary button-compact" href="/login" onClick={closeMenu}>Login peserta</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
