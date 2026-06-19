import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/Providers";
import SessionWatcher from "@/components/SessionWatcher";
import { AlertProvider } from "@/components/ui/AlertProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "MockTestPro",
  description: "Online Mock Test Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body
        className={cn(
          "min-h-screen bg-[#F9FAFB] text-gray-900 font-sans antialiased"
        )}
      >
        <Providers>
          <AlertProvider>
            <SessionWatcher />
            {children}
          </AlertProvider>
        </Providers>
      </body>
    </html>
  );
}
