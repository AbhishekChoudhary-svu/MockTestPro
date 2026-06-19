import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/ui/Header";
import { 
  Shield, 
  Train, 
  Landmark, 
  Map, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  HelpCircle, 
  BookOpen,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1A56DB] to-[#0A3D91] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 -left-12 h-72 w-72 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 -right-12 h-72 w-72 rounded-full bg-amber-500 opacity-10 blur-3xl"></div>

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/50 px-3 py-1 text-xs font-semibold text-blue-100 border border-blue-400/30 mb-6 uppercase tracking-wider">
            Now Live: SSC CGL & RRB NTPC simulations
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl font-heading leading-tight">
            Master Indian Government Exams with Exam-Accurate Mocks
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-blue-100 leading-relaxed font-sans">
            Replicate the exact NTA and SSC online test environment. Get real-time section timers, negative marking calculations, and deep analytics to ace your prep.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/exams"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-base font-bold text-slate-900 shadow hover:bg-amber-600 transition-all font-sans"
            >
              Browse Mock Tests
              <ArrowRight className="h-5 w-5" />
            </Link>
            {!session?.user && (
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-blue-400 bg-white/10 px-6 py-3.5 text-base font-semibold hover:bg-white/20 transition-all font-sans"
              >
                Register Free
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 mx-auto -mt-8 max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 shadow-xl border border-slate-100 sm:grid-cols-4">
          <div className="flex flex-col items-center justify-center p-2 text-center border-r border-slate-100 last:border-r-0">
            <BookOpen className="h-6 w-6 text-[#1A56DB]" />
            <span className="mt-2 text-2xl font-black text-slate-800">10+</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Mock Tests</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 text-center sm:border-r sm:border-slate-100 last:border-r-0">
            <HelpCircle className="h-6 w-6 text-[#1A56DB]" />
            <span className="mt-2 text-2xl font-black text-slate-800">300+</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Exam Questions</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 text-center border-r border-slate-100 last:border-r-0">
            <Users className="h-6 w-6 text-[#1A56DB]" />
            <span className="mt-2 text-2xl font-black text-slate-800">2,500+</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Active Students</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 text-center">
            <CheckCircle className="h-6 w-6 text-[#1A56DB]" />
            <span className="mt-2 text-2xl font-black text-slate-800">4</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Categories Covered</span>
          </div>
        </div>
      </section>

      {/* Exam Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 font-heading">
            Choose Your Exam Category
          </h2>
          <p className="text-slate-500 mt-2 max-w-lg mx-auto">
            Choose from tailored test packages aligning strictly with the latest government exam patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* SSC Card */}
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1">
            <div>
              <div className="inline-flex rounded-xl bg-blue-50 p-4 text-[#1A56DB] mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-heading">SSC</h3>
              <p className="text-slate-500 text-sm mt-2">
                CGL (Tier 1 & 2), CHSL (Tier 1), MTS, and Stenographer mock formats.
              </p>
            </div>
            <Link
              href="/exams?category=SSC"
              className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-[#1A56DB] group-hover:text-blue-700"
            >
              View SSC Tests
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Railway Card */}
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1">
            <div>
              <div className="inline-flex rounded-xl bg-amber-50 p-4 text-amber-600 mb-4">
                <Train className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-heading">Railway (RRB)</h3>
              <p className="text-slate-500 text-sm mt-2">
                NTPC (CBT 1 & 2), Group D, ALP, and Junior Engineer mock setups.
              </p>
            </div>
            <Link
              href="/exams?category=Railway"
              className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-amber-600 group-hover:text-amber-700"
            >
              View Railway Tests
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Banking Card */}
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1">
            <div>
              <div className="inline-flex rounded-xl bg-purple-50 p-4 text-purple-600 mb-4">
                <Landmark className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-heading">Banking</h3>
              <p className="text-slate-500 text-sm mt-2">
                IBPS PO, IBPS Clerk, SBI PO, SBI Clerk, and RBI Assistant.
              </p>
            </div>
            <Link
              href="/exams?category=Banking"
              className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-purple-600 group-hover:text-purple-700"
            >
              View Banking Tests
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* State PSC Card */}
          <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1">
            <div>
              <div className="inline-flex rounded-xl bg-emerald-50 p-4 text-emerald-600 mb-4">
                <Map className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-heading">State PSC</h3>
              <p className="text-slate-500 text-sm mt-2">
                WBPSC, UPPSC, BPSC, MPSC, and other regional PSC simulations.
              </p>
            </div>
            <Link
              href="/exams?category=PSC"
              className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-emerald-600 group-hover:text-emerald-700"
            >
              View PSC Tests
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand block */}
            <div className="md:col-span-1">
              <Link href="/" className="text-xl font-extrabold font-heading text-white tracking-tight hover:opacity-90 flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-[#1A56DB]" />
                <span>MockTestPro</span>
              </Link>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                Empowering government job aspirants with real exam simulations, real-time analytics, and expert-crafted mock tests.
              </p>
              <div className="mt-6 flex gap-4">
                <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="Twitter">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="YouTube">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.507 2.507 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C3 15.255 3 12 3 12s0-3.255.418-4.814a2.507 2.507 0 0 1 1.768-1.768C6.745 5 13 5 13 5s6.255 0 7.812.418ZM10.5 8.5v7l6-3.5-6-3.5Z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="Instagram">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.01 3.71.054 1.14.051 1.96.23 2.53.45a4.335 4.335 0 0 1 1.55 1.01c.47.47.78.99.99 1.55.22.56.4 1.38.45 2.52.04.93.05 1.28.05 3.72s-.01 2.78-.05 3.71c-.05 1.14-.23 1.96-.45 2.53a4.61 4.61 0 0 1-1.01 1.55c-.47.47-.99.78-1.55.99-.56.22-1.38.4-2.52.45-.93.04-1.28.05-3.72.05s-2.78-.01-3.71-.05c-1.14-.05-1.96-.23-2.53-.45a4.61 4.61 0 0 1-1.55-1.01c-.47-.47-.78-.99-.99-1.55-.22-.56-.4-1.38-.45-2.52C2.01 16.16 2 15.81 2 13.38s.01-2.78.05-3.71c.05-1.14.23-1.96.45-2.53a4.61 4.61 0 0 1 1.01-1.55c.47-.47.99-.78 1.55-.99.56-.22 1.38-.4 2.52-.45.93-.04 1.28-.05 3.72-.05zm0 1.83c-2.39 0-2.68.01-3.62.05-.88.04-1.35.19-1.67.31a2.8 2.8 0 0 0-1.03.67 2.8 2.8 0 0 0-.67 1.03c-.12.32-.27.79-.31 1.67-.04.94-.05 1.23-.05 3.62s.01 2.68.05 3.62c.04.88.19 1.35.31 1.67.12.35.29.65.55.91a2.8 2.8 0 0 0 .91.55c.32.12.79.27 1.67.31.94.04 1.23.05 3.62.05s2.68-.01 3.62-.05c.88-.04 1.35-.19 1.67-.31a2.8 2.8 0 0 0 1.03-.67c.26-.26.43-.56.55-.91.12-.32.27-.79.31-1.67.04-.94.05-1.23.05-3.62s-.01-2.68-.05-3.62c-.04-.88-.19-1.35-.31-1.67a2.8 2.8 0 0 0-.67-1.03 2.8 2.8 0 0 0-1.03-.67c-.32-.12-.79-.27-1.67-.31-.94-.04-1.23-.05-3.62-.05zm0 3.67a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8zm0 8a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zm4.18-8.52a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="hover:text-white transition-colors text-sm">Home</Link>
                </li>
                <li>
                  <Link href="/exams" className="hover:text-white transition-colors text-sm">Exams</Link>
                </li>
                <li>
                  <Link href="/my-tests" className="hover:text-white transition-colors text-sm">My Attempts</Link>
                </li>
                {session?.user && (
                  <li>
                    <Link href="/profile" className="hover:text-white transition-colors text-sm">My Profile</Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Exam Categories */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Exams Covered</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/exams?category=SSC" className="hover:text-white transition-colors text-sm">SSC CGL / CHSL / MTS</Link>
                </li>
                <li>
                  <Link href="/exams?category=Railway" className="hover:text-white transition-colors text-sm">Railway RRB NTPC / Group D</Link>
                </li>
                <li>
                  <Link href="/exams?category=Banking" className="hover:text-white transition-colors text-sm">Banking IBPS / SBI PO</Link>
                </li>
                <li>
                  <Link href="/exams?category=PSC" className="hover:text-white transition-colors text-sm">State PSC Exams</Link>
                </li>
              </ul>
            </div>

            {/* Contact & Support */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Support & Contact</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                  <span>123 Prep Junction, Sector 62, Noida, UP, India</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-slate-500 shrink-0" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-slate-500 shrink-0" />
                  <span>support@mocktestpro.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} MockTestPro. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Refund Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
