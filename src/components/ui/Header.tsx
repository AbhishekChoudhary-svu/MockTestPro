"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, LayoutDashboard, Menu, X, GraduationCap } from "lucide-react";

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin";
  const isLoggedIn = status === "authenticated" && session?.user;

  const navLinks = [
    
    { label: "Exams", href: "/exams" },
    { label: "My Attempts", href: "/my-tests" },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#1A56DB] text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Desktop Nav Links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-extrabold font-heading tracking-tight hover:opacity-90 flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              <span>MockTestPro</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${
                    isActive(link.href) ? "text-white font-bold" : "text-blue-100 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 px-3 py-1.5 text-xs font-bold text-slate-900 transition-colors border border-yellow-400"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 px-4 py-2 text-sm font-medium transition-colors border border-blue-500"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 px-3 py-1.5 text-sm font-medium transition-colors border border-blue-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              status !== "loading" && (
                <Link
                  href="/login"
                  className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#1A56DB] hover:bg-slate-100 transition-colors shadow-sm"
                >
                  Sign In
                </Link>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMobileMenu}
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-blue-100 hover:bg-blue-700 hover:text-white focus:outline-none transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1A56DB] border-t border-blue-700" id="mobile-menu">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${
                  isActive(link.href) ? "bg-blue-800 text-white font-bold" : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="border-t border-blue-700 my-2 pt-2">
              {isLoggedIn ? (
                <div className="space-y-1">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-yellow-300 hover:bg-blue-700 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                status !== "loading" && (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-md bg-white px-3 py-2 text-center text-base font-bold text-[#1A56DB] hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    Sign In
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
