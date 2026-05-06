"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Portfolio" },
    { href: "/insights", label: "Insights" },
  ];

  return (
    <nav className="bg-neutral-950/80 backdrop-blur border-b border-neutral-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 flex items-center h-12 sm:h-14 gap-3 sm:gap-6">
        <span className="font-bold text-white text-sm sm:text-lg tracking-tight whitespace-nowrap">Portfolio Tracker</span>
        <div className="flex gap-0.5 sm:gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-white text-neutral-950"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
