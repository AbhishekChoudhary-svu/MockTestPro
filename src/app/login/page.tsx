"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function LoginForm() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";

  const [devEmail, setDevEmail] = useState("developer@mocktestpro.com");
  const [devName, setDevName] = useState("Mock Developer");
  const [devRole, setDevRole] = useState("admin");
  const [isDevMode, setIsDevMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("developer-login", {
        email: devEmail,
        name: devName,
        role: devRole,
        callbackUrl,
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && !loading)) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1A56DB] border-t-transparent"></div>
        <p className="text-gray-400 font-medium font-sans">Checking session...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md space-y-8 bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-8 rounded-2xl shadow-2xl">
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#F59E0B] text-white font-bold text-2xl mb-4">
          M
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-heading">
          MockTestPro
        </h2>
        <p className="mt-2 text-sm text-slate-400 font-sans">
          Online Mock Test Simulation Platform
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="group relative flex w-full justify-center items-center gap-3 rounded-lg border border-slate-600 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:ring-offset-2 disabled:opacity-50 font-sans"
        >
          {/* Google Icon */}
          <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-slate-800 px-2 text-slate-400 font-sans">Or developer options</span>
          </div>
        </div>

        {!isDevMode ? (
          <button
            type="button"
            onClick={() => setIsDevMode(true)}
            className="w-full text-center text-xs font-semibold text-[#F59E0B] hover:text-[#e08f0a] transition-colors font-sans"
          >
            Show Developer Bypass Options
          </button>
        ) : (
          <form onSubmit={handleDevLogin} className="space-y-4 font-sans">
            <div>
              <label htmlFor="dev-name" className="block text-xs font-semibold text-slate-300">
                Name
              </label>
              <input
                id="dev-name"
                type="text"
                required
                value={devName}
                onChange={(e) => setDevName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm shadow-sm focus:border-[#1A56DB] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]"
              />
            </div>

            <div>
              <label htmlFor="dev-email" className="block text-xs font-semibold text-slate-300">
                Email
              </label>
              <input
                id="dev-email"
                type="email"
                required
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm shadow-sm focus:border-[#1A56DB] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]"
              />
            </div>

            <div>
              <label htmlFor="dev-role" className="block text-xs font-semibold text-slate-300">
                Role
              </label>
              <select
                id="dev-role"
                value={devRole}
                onChange={(e) => setDevRole(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm shadow-sm focus:border-[#1A56DB] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]"
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-[#F59E0B] px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:bg-[#e08f0a] disabled:opacity-50"
              >
                Bypass & Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsDevMode(false)}
                className="rounded-md border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative background blobs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-[#1A56DB] opacity-20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-[#F59E0B] opacity-10 rounded-full blur-3xl animate-pulse"></div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1A56DB] border-t-transparent"></div>
            <p className="text-gray-400 font-medium font-sans">Loading login...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
