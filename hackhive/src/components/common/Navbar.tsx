"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { name: "Hackathons", href: "/hackathons" },
  { name: "Applications", href: "/applications" },
  { name: "Profile", href: "/profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
  try {
    await logout();
    router.replace("/");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#fffdf5]/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <Link href="/profile" className="flex items-center gap-2">
          <Image
            src="/images/logo-v2.png"
            alt="HackHive"
            width={52}
            height={58}
          />
          <span className="hive-heading text-xl">HackHive</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/profile" &&
                pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => router.push(link.href)}
                className={`text-xs font-bold transition ${
                  active
                    ? "text-[#b48600]"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-black bg-[#ffda3d] text-sm font-black">
            {user?.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt={user.fullName}
                width={36}
                height={36}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              user?.fullName.charAt(0).toUpperCase()
            )}
          </div>

          <span className="max-w-[130px] truncate text-xs font-bold">
            {user?.fullName}
          </span>

          <button
            onClick={handleLogout}
            className="ml-2 flex items-center gap-2 rounded-full border border-black px-4 py-2 text-xs font-bold hover:bg-black hover:text-white"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden"
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-black/10 bg-[#fffdf5] p-5 lg:hidden">
          <nav className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  setMenuOpen(false);
                  router.push(link.href);
                }}
                className="text-sm font-bold"
              >
                {link.name}
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-left text-sm font-bold"
            >
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}