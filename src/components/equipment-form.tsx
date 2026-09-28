"use client";

import { useMemo, useState } from "react";
import { addYears, format } from "date-fns";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { readExtinguisherInformation } from "@/ai/flows/read-extinguisher-information";
import { EXTINGUISHER_TYPES_ES } from "@/lib/constants";
import { displayCode, LS_DRAFT, parseLooseDate, toDateInput } from "@/lib/inventory";
import type { Extinguisher } from "@/types";
import { useToast } from "@/hooks/use-toast";

type Draft = {
  location: string;
  exactPoint: string;
  typeOfExtinguisher: string;
  capacity: string;
  serialNumber: string;
  notes: string;
  recharge: string;
  photoDataUri?: string;
  photoName?: string;
  aiNote?: string;
};

const emptyDraft: Draft = {
  location: "",
  exactPoint: "",
  typeOfExtinguisher: "",
  capacity: "",
  serialNumber: "",
  notes: "",
  recharge: "",
};

function fromExtinguisher(ext: Extinguisher): Draft {
  return {
    location: ext.location || "",
    exactPoint: ext.exactPoint || "",
    typeOfExtinguisher: ext.typeOfExtinguisher || "",
    capacity: ext.capacity || "",
    serialNumber: ext.serialNumber || "",
    notes: ext.notes || "",
    recharge: toDateInput(ext.dateOfManufacture),
    photoDataUri: ext.photoDataUri,
    photoName: ext.photoName,
  };
}

export default function EquipmentForm({
  mode,
  initial,
  suggestedCode,
  onSubmit,
  onCancel,
  onDelete,
  onPreviewPhoto,
}: {
  mode: "create" | "edit";
  initial?: Extinguisher;
  suggestedCode: string;
  onSubmit: (extinguisher: Extinguisher) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onPreviewPhoto: (extinguisher: Extinguisher) => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft>(() => {
    if (initial) return fromExtinguisher(initial);
    if (typeof window === "undefined") return emptyDraft;
    const stored = localStorage.getItem(LS_DRAFT);
    if (!stored) return emptyDraft;
    try {
      return { ...emptyDraft, ...JSON.parse(stored) };
    } catch {
      return emptyDraft;
    }
  });
  const [reading, setReading] = useState(false);

  const expiry = useMemo(() => {
    const recharge = parseLooseDate(draft.recharge);
    return recharge ? addYears(recharge, 1) : null;
  }, [draft.recharge]);

  const code = initial ? displayCode(initial) : suggestedCode;
  const completeness = [
    draft.location,
    draft.exactPoint,
    draft.typeOfExtinguisher,
    draft.capacity,
    draft.serialNumber,
    draft.recharge,
    draft.photoDataUri,
  ].filter(Boolean).length;
  const percent = Math.round((completeness / 7) * 100);

  const setField = (key: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const onPhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({
        ...current,
        photoDataUri: String(reader.result),
        photoName: file.name,
        aiNote: undefined,
      }));
    };
    reader.readAsDataURL(file);
  };

  const readLabel = async () => {
    if (!draft.photoDataUri) {
      toast({ title: "Falta la fotografía", description: "Sube una foto de la etiqueta antes de leerla.", variant: "destructive" });
      return;
    }
    setReading(true);
    try {
      const result = await readExtinguisherInformation({ photoDataUri: draft.photoDataUri });
      const aiType = result.typeOfExtinguisher || "";
      const matchingType = EXTINGUISHER_TYPES_ES.find(
        (type) => type.value.toLowerCase() === aiType.toLowerCase() || aiType.toLowerCase().includes(type.value.toLowerCase())
      );
      const capacityMatch = aiType.match(/(\d+(?:[.,]\d+)?\s?(?:kg|l|lb))/i);
      const parsedDate = parseLooseDate(result.dateOfManufacture);
      setDraft((current) => ({
        ...current,
        typeOfExtinguisher: matchingType?.value || current.typeOfExtinguisher || aiType,
        capacity: capacityMatch?.[1]?.replace(",", ".") || current.capacity,
        recharge: parsedDate ? toDateInput(parsedDate) : current.recharge,
        aiNote: "La etiqueta se analizó y los campos detectados se completaron automáticamente.",
      }));
      toast({
        title: "Equipo leído",
        description: parsedDate
          ? "Tipo y fecha de recarga se completaron desde la etiqueta."
          : "Se detectó el tipo. Revisa la fecha de recarga antes de guardar.",
      });
    } catch {
      toast({
        title: "No pudimos leer la etiqueta",
        description: "La conexión se interrumpió. Los datos siguen en este formulario.",
        variant: "destructive",
      });
    } finally {
      setReading(false);
    }
  };

  const buildRecord = (): Extinguisher | null => {
    const recharge = parseLooseDate(draft.recharge);
    if (!draft.location.trim() || !draft.exactPoint.trim() || !draft.typeOfExtinguisher || !recharge || !expiry) {
      toast({
        title: "Faltan datos obligatorios",
        description: "Completa área, punto exacto, tipo y fecha de recarga.",
        variant: "destructive",
      });
      return null;
    }
    return {
      id: initial?.id || code,
      code,
      location: draft.location.trim(),
      exactPoint: draft.exactPoint.trim(),
      typeOfExtinguisher: draft.typeOfExtinguisher,
      capacity: draft.capacity.trim(),
      serialNumber: draft.serialNumber.trim(),
      notes: draft.notes.trim(),
      dateOfManufacture: recharge,
      expiryDate: expiry,
      photoDataUri: draft.photoDataUri,
      photoName: draft.photoName,
    };
  };

  const save = () => {
    const record = buildRecord();
    if (!record) return;
    if (mode === "create") localStorage.removeItem(LS_DRAFT);
    onSubmit(record);
  };

  const saveDraft = () => {
    localStorage.setItem(LS_DRAFT, JSON.stringify(draft));
    toast({ title: "Borrador guardado", description: "Puedes continuar el registro más tarde en este navegador." });
  };

  const preview = () => {
    const record = buildRecord();
    if (!record?.photoDataUri) {
      toast({ title: "No hay fotografía", description: "Sube la etiqueta para ampliarla.", variant: "destructive" });
      return;
    }
    onPreviewPhoto(record);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <p className="text-xs font-semibold text-blue-700">1 · Ubicación del equipo</p>
          <h3 className="mt-1 font-semibold text-slate-900">Identifica con precisión dónde está instalado el extintor.</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Área *
              <input value={draft.location} onChange={(event) => setField("location", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Bodega Norte" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Punto exacto *
              <input value={draft.exactPoint} onChange={(event) => setField("exactPoint", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Pasillo B · Columna 14" />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Código del equipo
              <input value={code} readOnly className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500" />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                {mode === "edit" ? "El identificador no se puede modificar." : "Generado automáticamente según la secuencia de planta."}
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <p className="text-xs font-semibold text-blue-700">2 · Identificación y etiqueta</p>
          <h3 className="mt-1 font-semibold text-slate-900">Usa una fotografía legible para agilizar la captura de datos.</h3>
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-3">
            {draft.photoDataUri ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <img src={draft.photoDataUri} alt="Etiqueta" className="h-24 w-32 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{draft.photoName || "etiqueta.jpg"}</p>
                  <p className="text-xs text-slate-500">Procura que el texto esté enfocado, sin reflejos y dentro del encuadre.</p>
                  <div className="mt-2 flex gap-2">
                    <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">
                      Cambiar foto
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => onPhoto(event.target.files?.[0])} />
                    </label>
                    <button type="button" onClick={preview} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">
                      Ampliar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center py-6 text-sm text-slate-600">
                Fotografía de la etiqueta *
                <span className="mt-1 text-xs">Toca para tomar o elegir una foto</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => onPhoto(event.target.files?.[0])} />
              </label>
            )}
          </div>
          <button
            type="button"
            onClick={readLabel}
            disabled={reading || !draft.photoDataUri}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Lectura con IA
          </button>
          {draft.aiNote && (
            <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
              <p className="font-semibold">Extracción completa</p>
              <p>{draft.aiNote}</p>
              <p className="mt-1 text-xs">Verifica los datos antes de guardar. La IA no sustituye la inspección física.</p>
            </div>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Tipo de extintor *
              <select value={draft.typeOfExtinguisher} onChange={(event) => setField("typeOfExtinguisher", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="">Selecciona</option>
                {EXTINGUISHER_TYPES_ES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Capacidad *
              <input value={draft.capacity} onChange={(event) => setField("capacity", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="6 kg" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Número de serie *
              <input value={draft.serialNumber} onChange={(event) => setField("serialNumber", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="PQS-6K-260251" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <p className="text-xs font-semibold text-blue-700">3 · Recarga y vigencia</p>
          <h3 className="mt-1 font-semibold text-slate-900">El vencimiento se calcula automáticamente a 12 meses de la recarga.</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Fecha de recarga *
              <input type="date" value={draft.recharge} onChange={(event) => setField("recharge", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <div className="text-sm font-medium text-slate-700">
              Vencimiento autocalculado
              <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800">
                {expiry ? format(expiry, "dd / MM / yyyy") : "—"}
              </div>
              <span className="mt-1 block text-xs font-normal text-slate-500">Política aplicada: vigencia anual.</span>
            </div>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Notas de inspección
              <textarea value={draft.notes} onChange={(event) => setField("notes", event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Incluye hallazgos útiles para la próxima revisión." />
            </label>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          {mode === "edit" ? (
            <button type="button" onClick={onDelete} className="text-sm font-semibold text-red-600">
              Eliminar equipo
            </button>
          ) : (
            <button type="button" onClick={saveDraft} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">
              Guardar como borrador
            </button>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">
              {mode === "edit" ? "Descartar cambios" : "Cancelar"}
            </button>
            <button type="button" onClick={save} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white">
              {mode === "edit" ? "Guardar cambios" : "Registrar equipo"}
            </button>
          </div>
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{mode === "edit" ? "Estado actual" : "Antes de guardar"}</p>
        <p className="mt-3 text-2xl font-bold text-slate-900">{percent}%</p>
        <p className="text-sm text-slate-500">Completitud</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
        </div>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Ubicación {draft.location && draft.exactPoint ? "confirmada" : "pendiente"}</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {draft.photoDataUri ? "Etiqueta cargada" : "Etiqueta pendiente"}</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {expiry ? "Fechas coherentes" : "Fechas pendientes"}</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {draft.typeOfExtinguisher && draft.capacity ? "Tipo y capacidad válidos" : "Tipo pendiente"}</li>
        </ul>
      </aside>
    </div>
  );
}
