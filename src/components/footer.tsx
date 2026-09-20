import Image from "next/image";
import Link from "next/link";
import { HeartIcon } from "@heroicons/react/24/solid";
import type { ExpoEvent } from "@/lib/types";

export function Footer({ event }: { event: ExpoEvent }) {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><Image src="/rpl-smkn24-logo.png" alt="" width={34} height={34} /><span><strong>{event.displayName}</strong><small>{event.tagline}</small></span></div>
      <p className="footer-credit"><span>Made with</span><HeartIcon /><span>by</span><strong>RPL Team</strong></p>
      <div className="footer-links"><Link href="/catalog">Katalog</Link><Link href="/vote">Voting</Link><Link href="/editions">Arsip edisi</Link><Link href="/login">Peserta</Link></div>
    </footer>
  );
}
