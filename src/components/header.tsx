import Image from "next/image";
import Link from "next/link";
import { Bars3Icon, Squares2X2Icon, TrophyIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export function Header() {
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link href="/" className="brand" aria-label="RPL Expo beranda">
          <span className="brand-icon"><Image src="/rpl-smkn24-logo.png" alt="" width={36} height={36} priority /></span>
          <span><strong>RPL EXPO</strong><small>2026</small></span>
        </Link>
        <details className="nav-details">
          <summary aria-label="Buka navigasi"><Bars3Icon /></summary>
          <nav className="main-nav">
            <Link href="/catalog"><Squares2X2Icon />Katalog</Link>
            <Link href="/vote"><UserGroupIcon />Voting</Link>
            <Link href="/results"><TrophyIcon />Hasil</Link>
            <Link className="button button-primary button-compact" href="/login">Login peserta</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
