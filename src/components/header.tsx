import Link from "next/link";
import { Bars3Icon, CubeTransparentIcon, Squares2X2Icon, TrophyIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export function Header() {
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link href="/" className="brand" aria-label="RPL Expo beranda">
          <span className="brand-icon"><CubeTransparentIcon /></span>
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
