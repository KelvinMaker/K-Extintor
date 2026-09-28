"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { Extinguisher } from "@/types";
import { displayCode, getStatus, statusLabel } from "@/lib/inventory";

export default function DeleteEquipmentDialog({
  extinguisher,
  onCancel,
  onConfirm,
}: {
  extinguisher: Extinguisher;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const code = displayCode(extinguisher);
  const [typed, setTyped] = useState("");
  const status = getStatus(extinguisher.expiryDate);
  const canDelete = typed.trim().toUpperCase() === code.toUpperCase();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">¿Eliminar {code}?</h2>
          </div>
          <button type="button" onClick={onCancel} className="rounded-full p-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Esta acción retirará el equipo del inventario activo. El registro quedará fuera de la operación diaria.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-slate-900">{code}</p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-800">
              {statusLabel(status)}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            {extinguisher.typeOfExtinguisher}
            {extinguisher.capacity ? ` · ${extinguisher.capacity}` : ""}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {extinguisher.location}
            {extinguisher.exactPoint ? ` · ${extinguisher.exactPoint}` : ""}
          </p>
        </div>
        <div className="mt-3 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>No podrás recuperar fotografías, notas ni el historial de este equipo desde el inventario operativo.</p>
        </div>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Escribe {code} para confirmar
          <input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder={code}
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canDelete}
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-red-200"
          >
            Eliminar equipo
          </button>
        </div>
      </div>
    </div>
  );
}
