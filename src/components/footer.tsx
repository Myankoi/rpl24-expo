import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><Image src="/rpl-smkn24-logo.png" alt="" width={34} height={34} /><span><strong>RPL Expo 2026</strong><small>Code. Create. Inspire.</small></span></div>
      <div className="footer-links"><Link href="/catalog">Katalog</Link><Link href="/vote">Voting</Link><Link href="/login">Peserta</Link></div>
    </footer>
  );
}
