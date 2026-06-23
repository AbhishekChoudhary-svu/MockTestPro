"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin";
  const isLoggedIn = status === "authenticated" && session?.user;
  const userInitials = getInitials(session?.user?.name);

  

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Reusable dropdown content used on both desktop and mobile
  const UserDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger >
        <Button
          variant="ghost"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-white transition-colors"
        >
          <Avatar className="h-8 w-8 border-2 border-blue-400">
            <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? ""} />
            <AvatarFallback className="bg-blue-900 text-white text-xs font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {/* Name shown on desktop only */}
          <div className="text-left hidden sm:block md:block">
            <p className="text-sm font-semibold leading-none text-white">
              {session?.user?.name ?? "User"}
            </p>
            <p className="text-xs text-blue-200 mt-0.5">
              {isAdmin ? "Admin" : "Student"}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 mt-1">
        <div className="px-2 py-1.5 text-xs text-slate-500">
          Signed in as{" "}
          <span className="font-semibold text-slate-800">
            {session?.user?.name ?? session?.user?.email}
          </span>
        </div>
        <DropdownMenuSeparator />

        {isAdmin && (
          <DropdownMenuItem >
            <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
              <LayoutDashboard className="h-4 w-4 text-yellow-500" />
              <span>Admin Panel</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem >
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem >
          <Link href="/exams" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            <span>Exams</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem >
          <Link href="/my-tests" className="flex items-center gap-2 cursor-pointer">
            <ClipboardList className="h-4 w-4" />
            <span>My Attempts</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 bg-[#1A56DB] text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xl font-extrabold font-heading tracking-tight hover:opacity-90 flex items-center gap-2"
            >
              <GraduationCap className="h-6 w-6" />
              <span>MockTestPro</span>
            </Link>

            
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <UserDropdown />
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

          {/* Mobile: Avatar Dropdown + Hamburger */}
          <div className="flex md:hidden items-center gap-1">
            {isLoggedIn ? (
              <UserDropdown />
            ) : (
              status !== "loading" && (
                <Link
                  href="/login"
                  className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-[#1A56DB] hover:bg-slate-100 transition-colors shadow-sm mr-1"
                >
                  Sign In
                </Link>
              )
            )}

           
          </div>
        </div>
      </div>

    </header>
  );
}