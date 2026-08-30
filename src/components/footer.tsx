import Link from "next/link";
import { CubeTransparentIcon } from "@heroicons/react/24/outline";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><CubeTransparentIcon /><span><strong>RPL Expo 2026</strong><small>Code. Create. Inspire.</small></span></div>
      <div className="footer-links"><Link href="/catalog">Katalog</Link><Link href="/vote">Voting</Link><Link href="/login">Peserta</Link></div>
    </footer>
  );
}

