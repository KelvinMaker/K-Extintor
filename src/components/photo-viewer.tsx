"use client";

import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { Extinguisher } from "@/types";
import { displayCode, formatShort } from "@/lib/inventory";

export default function PhotoViewer({
  extinguisher,
  onClose,
}: {
  extinguisher: Extinguisher;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const code = displayCode(extinguisher);
  const fields = [
    ["Tipo", extinguisher.typeOfExtinguisher || "—"],
    ["Capacidad", extinguisher.capacity || "—"],
    ["Recarga", formatShort(extinguisher.dateOfManufacture)],
    ["Vencimiento", formatShort(extinguisher.expiryDate)],
    ["Serie", extinguisher.serialNumber || "—"],
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-3 md:p-6">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#10233f] text-white shadow-2xl md:flex-row">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Etiqueta · {code}</p>
              <p className="text-xs text-slate-300">{extinguisher.photoName || "Fotografía del equipo"}</p>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto px-4 pb-2">
            <img
              src={extinguisher.photoDataUri}
              alt={`Etiqueta de ${code}`}
              style={{ width: `${zoom}%`, maxWidth: "none" }}
              className="max-h-[58vh] rounded-lg object-contain md:max-h-[70vh]"
            />
          </div>
          <div className="flex items-center justify-center gap-3 pb-4">
            <button type="button" onClick={() => setZoom((value) => Math.max(50, value - 25))} className="rounded-full bg-white/10 p-2" aria-label="Alejar">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-14 text-center text-sm">{zoom}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(200, value + 25))} className="rounded-full bg-white/10 p-2" aria-label="Acercar">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <aside className="w-full border-t border-white/10 bg-[#16325c] p-4 md:w-72 md:border-l md:border-t-0">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Lectura con IA</h3>
            <button type="button" onClick={onClose} className="rounded-full bg-red-500 p-1" aria-label="Cerrar visor">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-3 text-xs text-slate-300">Datos registrados de la etiqueta. Verifícalos contra la imagen.</p>
          <div className="space-y-2">
            {fields.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#0e2748] px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
