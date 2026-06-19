"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Sparkles,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type AlertType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: AlertType;
  title?: string;
  message: string;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning" | "info";
}

interface AlertContextValue {
  toast: (type: AlertType, message: string, title?: string) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextValue | null>(null);

/* ─────────────────────────────────────────────
   Toast colours / icons
───────────────────────────────────────────── */
const toastStyles: Record<
  AlertType,
  { bar: string; bg: string; icon: React.ReactNode; title: string }
> = {
  success: {
    bar: "bg-emerald-500",
    bg: "bg-white border-emerald-200",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    title: "Success",
  },
  error: {
    bar: "bg-red-500",
    bg: "bg-white border-red-200",
    icon: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
    title: "Error",
  },
  warning: {
    bar: "bg-amber-500",
    bg: "bg-white border-amber-200",
    icon: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    title: "Warning",
  },
  info: {
    bar: "bg-[#1A56DB]",
    bg: "bg-white border-blue-200",
    icon: <Info className="h-5 w-5 text-[#1A56DB] shrink-0" />,
    title: "Info",
  },
};

/* ─────────────────────────────────────────────
   Single Toast Card
───────────────────────────────────────────── */
function Toast({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: (id: string) => void;
}) {
  const s = toastStyles[item.type];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    const t = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 4 s
    const auto = setTimeout(() => handleClose(), 4200);
    return () => {
      clearTimeout(t);
      clearTimeout(auto);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(item.id), 320);
  };

  return (
    <div
      className={`relative flex items-start gap-3 rounded-2xl border shadow-xl px-4 py-3.5 min-w-[300px] max-w-[420px] overflow-hidden
        transition-all duration-300 ease-out
        ${s.bg}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {/* Coloured left bar */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${s.bar}`} />

      <div className="pl-2 mt-0.5">{s.icon}</div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-extrabold text-slate-800 leading-tight">
          {item.title || s.title}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.message}</p>
      </div>

      <button
        onClick={handleClose}
        className="ml-1 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Progress bar */}
      <span
        className={`absolute bottom-0 left-0 h-[3px] ${s.bar} opacity-30`}
        style={{ animation: "shrink-width 4.2s linear forwards" }}
      />

      <style>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Confirm Dialog
───────────────────────────────────────────── */
const confirmTypeMap = {
  danger: {
    icon: <XCircle className="h-10 w-10 text-red-500" />,
    btn: "bg-red-600 hover:bg-red-700 text-white",
    ring: "ring-red-100",
    iconBg: "bg-red-50",
  },
  warning: {
    icon: <AlertTriangle className="h-10 w-10 text-amber-500" />,
    btn: "bg-amber-500 hover:bg-amber-600 text-white",
    ring: "ring-amber-100",
    iconBg: "bg-amber-50",
  },
  info: {
    icon: <Sparkles className="h-10 w-10 text-[#1A56DB]" />,
    btn: "bg-[#1A56DB] hover:bg-blue-700 text-white",
    ring: "ring-blue-100",
    iconBg: "bg-blue-50",
  },
};

interface ConfirmState extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

function ConfirmDialog({
  state,
  onClose,
}: {
  state: ConfirmState;
  onClose: () => void;
}) {
  const t = confirmTypeMap[state.type || "info"];
  const [show, setShow] = useState(false);

  useEffect(() => {
    const tmr = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(tmr);
  }, []);

  const handleChoice = (val: boolean) => {
    setShow(false);
    setTimeout(() => {
      state.resolve(val);
      onClose();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-200 ${
        show ? "bg-slate-900/50 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={(e) => e.target === e.currentTarget && handleChoice(false)}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden
          transition-all duration-200
          ${show ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
      >
        {/* Header stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#1A56DB] to-indigo-500" />

        <div className="p-6 space-y-5">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl ${t.iconBg} ${t.ring} ring-4 flex items-center justify-center mx-auto`}>
            {t.icon}
          </div>

          {/* Text */}
          <div className="text-center space-y-1.5">
            {state.title && (
              <h3 className="text-base font-extrabold text-slate-800 font-heading">
                {state.title}
              </h3>
            )}
            <p className="text-sm text-slate-500 leading-relaxed">{state.message}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => handleChoice(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              {state.cancelLabel || "Cancel"}
            </button>
            <button
              onClick={() => handleChoice(true)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm ${t.btn}`}
            >
              {state.confirmLabel || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Provider
───────────────────────────────────────────── */
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const idRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: AlertType, message: string, title?: string) => {
      const id = String(++idRef.current);
      setToasts((prev) => [...prev, { id, type, message, title }]);
    },
    []
  );

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ ...opts, resolve });
    });
  }, []);

  return (
    <AlertContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast Stack */}
      <div className="fixed bottom-5 right-5 z-[9998] flex flex-col gap-2.5 items-end pointer-events-none">
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <Toast item={item} onClose={removeToast} />
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmState && (
        <ConfirmDialog
          state={confirmState}
          onClose={() => setConfirmState(null)}
        />
      )}
    </AlertContext.Provider>
  );
}

/* ─────────────────────────────────────────────
   Hook
───────────────────────────────────────────── */
export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used inside <AlertProvider>");
  return ctx;
}
