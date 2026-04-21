"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Home,
  ClipboardList,
  Map,
  CheckSquare,
  BarChart3,
  ChevronRight,
} from "lucide-react";

const primaryNavItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Onboarding", path: "/onboarding", icon: ClipboardList },
  { name: "Roadmap", path: "/roadmap", icon: Map },
  { name: "Today", path: "/today", icon: CheckSquare },
  { name: "Progress", path: "/progress", icon: BarChart3 },
];

const secondaryNavItems = [
  { name: "Goals", path: "/goals" },
  { name: "Learning", path: "/learning" },
  { name: "Upskill", path: "/upskill" },
  { name: "Calendar", path: "/calendar" },
  { name: "Credentials", path: "/credentials" },
  { name: "About", path: "/about" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            <span className="text-base font-semibold text-white tracking-tight">
              Saarthi AI
            </span>
            <span className="hidden sm:inline-block badge">Learning OS</span>
          </div>

          <div className="flex items-center gap-2">
            {session?.user ? (
              <>
                <img
                  src={session.user.image || ""}
                  alt="profile"
                  className="w-8 h-8 rounded-full border border-zinc-700 hover:ring-2 hover:ring-indigo-500 transition"
                />
                <button
                  onClick={() => signOut()}
                  className="text-sm text-zinc-400 hover:text-white transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="text-sm border border-zinc-700 text-white px-4 py-1.5 rounded-lg hover:bg-zinc-800 transition"
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {primaryNavItems.map(({ name, path, icon: Icon }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={name}
                href={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/40"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent"
                }`}
              >
                <Icon size={14} />
                {name}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500">
          <span>More:</span>
          {secondaryNavItems.map((item, index) => (
            <span key={item.path} className="flex items-center gap-2">
              <Link href={item.path} className="hover:text-zinc-300 transition">
                {item.name}
              </Link>
              {index < secondaryNavItems.length - 1 && <ChevronRight size={12} />}
            </span>
          ))}
        </div>
      </div>
    </nav>
  );
}
