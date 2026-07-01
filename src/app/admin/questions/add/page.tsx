"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RedirectToAddQuestion() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/questions?tab=add");
  }, [router]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A56DB] mx-auto mb-4" />
        <p className="text-xs font-semibold text-slate-500">Redirecting to Question Builder...</p>
      </div>
    </div>
  );
}
