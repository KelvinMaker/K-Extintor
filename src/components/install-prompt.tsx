"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "kExtintorInstallDismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPrompt() {
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || sessionStorage.getItem(DISMISS_KEY) === "1") return;
    setIos(isIos());
    setOpen(true);

    const capture = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setOpen(true);
    };
    const pending = (window as Window & { __kextintorInstall?: BeforeInstallPromptEvent | null }).__kextintorInstall;
    if (pending) setDeferred(pending);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("kextintor-install-ready", () => {
      const stored = (window as Window & { __kextintorInstall?: BeforeInstallPromptEvent | null }).__kextintorInstall;
      if (stored) setDeferred(stored);
    });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <img src="/logo.jpg" alt="Logo de K-Extintor" className="h-16 w-16 rounded-2xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Instalar aplicación</p>
            <h2 className="text-lg font-bold text-slate-900">Lleva K-Extintor en el teléfono</h2>
            <p className="mt-1 text-sm text-slate-600">
              Instálala para abrir el inventario como una app, con el logo en la pantalla de inicio.
            </p>
          </div>
          <button type="button" onClick={dismiss} className="rounded-full p-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {ios ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="flex items-center gap-2 font-medium">
              <Share className="h-4 w-4 text-blue-700" />
              En iPhone o iPad
            </p>
            <p className="mt-1">Pulsa Compartir y luego <strong>Agregar a pantalla de inicio</strong>.</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={install}
            disabled={!deferred}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Download className="h-4 w-4" />
            {deferred ? "Instalar aplicación" : "Preparando instalación…"}
          </button>
        )}

        {!ios && !deferred && (
          <p className="mt-2 text-xs text-slate-500">
            Si el botón sigue en espera, abre el menú del navegador y elige Instalar aplicación o Agregar a la pantalla de inicio.
          </p>
        )}

        <button type="button" onClick={dismiss} className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
          Ahora no
        </button>
      </div>
    </div>
  );
}
