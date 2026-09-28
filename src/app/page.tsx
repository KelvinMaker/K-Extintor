"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  ClipboardList,
  Download,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import type { Extinguisher } from "@/types";
import {
  compliancePercent,
  DEFAULT_PLANT,
  displayCode,
  formatShort,
  getStatus,
  hydrateExtinguisher,
  LS_KEY,
  LS_PLANT,
  nextCode,
  type EquipmentStatus,
  type PlantProfile,
} from "@/lib/inventory";
import EquipmentForm from "@/components/equipment-form";
import InstallPrompt from "@/components/install-prompt";
import DeleteEquipmentDialog from "@/components/delete-equipment-dialog";
import PhotoViewer from "@/components/photo-viewer";
import { useToast } from "@/hooks/use-toast";

type View = "inventario" | "alertas" | "registrar" | "editar" | "reportes" | "config";

const statusStyle: Record<EquipmentStatus, string> = {
  vigente: "bg-emerald-50 text-emerald-700",
  proximo: "bg-amber-50 text-amber-800",
  vencido: "bg-red-50 text-red-700",
};

export default function HomePage() {
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [plant, setPlant] = useState<PlantProfile>(DEFAULT_PLANT);
  const [view, setView] = useState<View>("inventario");
  const [editing, setEditing] = useState<Extinguisher | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Extinguisher | null>(null);
  const [preview, setPreview] = useState<Extinguisher | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | EquipmentStatus>("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [areaFilter, setAreaFilter] = useState("todos");

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      try {
        setExtinguishers(JSON.parse(stored).map(hydrateExtinguisher));
      } catch {
        setExtinguishers([]);
      }
    }
    const storedPlant = localStorage.getItem(LS_PLANT);
    if (storedPlant) {
      try {
        setPlant({ ...DEFAULT_PLANT, ...JSON.parse(storedPlant) });
      } catch {
        setPlant(DEFAULT_PLANT);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(LS_KEY, JSON.stringify(extinguishers));
  }, [extinguishers, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(LS_PLANT, JSON.stringify(plant));
  }, [plant, ready]);

  const counts = useMemo(() => {
    const vigentes = extinguishers.filter((item) => getStatus(item.expiryDate) === "vigente").length;
    const proximos = extinguishers.filter((item) => getStatus(item.expiryDate) === "proximo").length;
    const vencidos = extinguishers.filter((item) => getStatus(item.expiryDate) === "vencido").length;
    return { total: extinguishers.length, vigentes, proximos, vencidos };
  }, [extinguishers]);

  const areas = useMemo(
    () => Array.from(new Set(extinguishers.map((item) => item.location).filter(Boolean))),
    [extinguishers]
  );
  const types = useMemo(
    () => Array.from(new Set(extinguishers.map((item) => item.typeOfExtinguisher).filter(Boolean))),
    [extinguishers]
  );

  const visible = useMemo(() => {
    return extinguishers
      .filter((item) => {
        const status = getStatus(item.expiryDate);
        const haystack = `${displayCode(item)} ${item.location} ${item.exactPoint || ""} ${item.typeOfExtinguisher}`.toLowerCase();
        if (query && !haystack.includes(query.toLowerCase())) return false;
        if (statusFilter !== "todos" && status !== statusFilter) return false;
        if (typeFilter !== "todos" && item.typeOfExtinguisher !== typeFilter) return false;
        if (areaFilter !== "todos" && item.location !== areaFilter) return false;
        return true;
      })
      .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  }, [extinguishers, query, statusFilter, typeFilter, areaFilter]);

  const attention = useMemo(
    () =>
      extinguishers
        .filter((item) => getStatus(item.expiryDate) !== "vigente")
        .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime()),
    [extinguishers]
  );

  const saveNew = (item: Extinguisher) => {
    setExtinguishers((current) => [...current, item].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime()));
    setView("inventario");
    toast({
      title: "Equipo registrado correctamente",
      description: `${displayCode(item)} · ${item.typeOfExtinguisher} se agregó en ${item.location}.`,
    });
  };

  const saveEdit = (item: Extinguisher) => {
    setExtinguishers((current) => current.map((entry) => (entry.id === item.id ? item : entry)));
    setEditing(null);
    setView("inventario");
    toast({ title: "Cambios guardados", description: `${displayCode(item)} quedó actualizado.` });
  };

  const remove = (item: Extinguisher) => {
    setExtinguishers((current) => current.filter((entry) => entry.id !== item.id));
    setPendingDelete(null);
    setEditing(null);
    setView("inventario");
    toast({ title: "Equipo eliminado", description: `${displayCode(item)} salió del inventario activo.`, variant: "destructive" });
  };

  const downloadCsv = (list = extinguishers) => {
    const headers = "Codigo,Area,Punto,Tipo,Capacidad,Serie,Recarga,Vencimiento,Estado\n";
    const rows = list
      .map((item) =>
        [
          displayCode(item),
          item.location,
          item.exactPoint || "",
          item.typeOfExtinguisher,
          item.capacity || "",
          item.serialNumber || "",
          format(item.dateOfManufacture, "yyyy-MM-dd"),
          format(item.expiryDate, "yyyy-MM-dd"),
          getStatus(item.expiryDate),
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventario_extintores.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openEdit = (item: Extinguisher) => {
    setEditing(item);
    setView("editar");
  };

  if (!ready) return null;

  const alertCount = counts.vencidos + counts.proximos;
  const rawDate = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const todayLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-900">
      <div className="md:flex">
        <aside className="hidden w-64 shrink-0 flex-col bg-[#0d1b33] text-white md:flex md:min-h-screen">
          <div className="flex items-center gap-3 px-5 py-6">
            <img src="/logo.jpg" alt="K-Extintor" className="h-12 w-12 rounded-xl object-cover" />
            <div>
              <p className="text-lg font-bold leading-none">K-Extintor</p>
              <p className="mt-1 text-xs text-slate-300">Control operativo</p>
            </div>
          </div>
          <nav className="space-y-1 px-3">
            <NavButton active={view === "inventario" || view === "registrar" || view === "editar"} icon={<LayoutDashboard className="h-4 w-4" />} label="Inventario" onClick={() => setView("inventario")} />
            <NavButton active={view === "alertas"} icon={<Bell className="h-4 w-4" />} label="Alertas" count={alertCount} onClick={() => setView("alertas")} />
            <NavButton active={view === "reportes"} icon={<ClipboardList className="h-4 w-4" />} label="Reportes" onClick={() => setView("reportes")} />
            <NavButton active={view === "config"} icon={<Settings className="h-4 w-4" />} label="Configuración" onClick={() => setView("config")} />
          </nav>
          <div className="mt-auto p-4">
            <div className="rounded-2xl bg-white/10 p-3 text-sm">
              <p className="text-xs text-slate-300">Instalación activa</p>
              <p className="font-semibold">{plant.name}</p>
              <p className="text-xs text-slate-300">{plant.code}</p>
              {counts.vencidos > 0 && <p className="mt-2 text-xs text-red-200">{counts.vencidos} equipos vencidos requieren atención</p>}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-24 md:pb-0">
          <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Control operativo</p>
                <h1 className="text-xl font-bold md:text-2xl">{todayLabel}</h1>
              </div>
              <p className="text-sm text-slate-500">{plant.supervisor || "Responsable de zona"}</p>
            </div>
          </header>

          <main className="px-4 py-5 md:px-8">
            {view === "inventario" && (
              <Inventory
                plant={plant}
                counts={counts}
                visible={visible}
                total={extinguishers.length}
                query={query}
                setQuery={setQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                areaFilter={areaFilter}
                setAreaFilter={setAreaFilter}
                areas={areas}
                types={types}
                onCreate={() => setView("registrar")}
                onExport={() => downloadCsv()}
                onOpen={openEdit}
                onAlerts={() => setView("alertas")}
              />
            )}

            {view === "alertas" && (
              <Alerts
                items={attention}
                onOpen={openEdit}
                onExport={() => downloadCsv(attention)}
              />
            )}

            {view === "registrar" && (
              <section>
                <HeaderBlock
                  kicker="Nuevo activo"
                  title="Registrar nuevo extintor"
                  text="Documenta la ubicación, captura la etiqueta y valida la vigencia antes de incorporar el equipo al inventario."
                />
                <EquipmentForm
                  mode="create"
                  suggestedCode={nextCode(extinguishers)}
                  onSubmit={saveNew}
                  onCancel={() => setView("inventario")}
                  onPreviewPhoto={setPreview}
                />
              </section>
            )}

            {view === "editar" && editing && (
              <section>
                <HeaderBlock
                  kicker={editing.location}
                  title={`Editar ${displayCode(editing)}`}
                  text="Actualiza la ubicación, fotografía o datos de vigencia."
                />
                <EquipmentForm
                  mode="edit"
                  initial={editing}
                  suggestedCode={displayCode(editing)}
                  onSubmit={saveEdit}
                  onCancel={() => setView("inventario")}
                  onDelete={() => setPendingDelete(editing)}
                  onPreviewPhoto={setPreview}
                />
              </section>
            )}

            {view === "reportes" && (
              <section>
                <HeaderBlock kicker={plant.name} title="Reportes" text="Prioriza los equipos vencidos y programa la recarga de los próximos a vencer." />
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <Metric label="Total" value={counts.total} tone="text-slate-900" />
                  <Metric label="Vencidos" value={counts.vencidos} tone="text-red-600" />
                  <Metric label="Próximos" value={counts.proximos} tone="text-amber-600" />
                </div>
                <button type="button" onClick={() => downloadCsv()} className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold">
                  <Download className="h-4 w-4" /> Exportar CSV
                </button>
                <AlertList items={attention} onOpen={openEdit} />
              </section>
            )}

            {view === "config" && (
              <section>
                <HeaderBlock kicker="Instalación" title="Configuración" text="Estos datos aparecen en el inventario y en los reportes de esta instalación." />
                <div className="max-w-lg space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <Field label="Planta" value={plant.name} onChange={(name) => setPlant({ ...plant, name })} />
                  <Field label="Código" value={plant.code} onChange={(code) => setPlant({ ...plant, code })} />
                  <Field label="Responsable de zona" value={plant.supervisor} onChange={(supervisor) => setPlant({ ...plant, supervisor })} />
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white px-2 py-2 md:hidden">
        <MobileTab active={view === "inventario"} icon={<LayoutDashboard className="h-5 w-5" />} label="Inventario" onClick={() => setView("inventario")} />
        <MobileTab active={view === "alertas"} icon={<Bell className="h-5 w-5" />} label="Alertas" onClick={() => setView("alertas")} />
        <MobileTab active={view === "registrar"} icon={<Plus className="h-5 w-5" />} label="Registrar" onClick={() => setView("registrar")} />
        <MobileTab active={view === "config"} icon={<UserRound className="h-5 w-5" />} label="Perfil" onClick={() => setView("config")} />
      </nav>

      <InstallPrompt />
      {pendingDelete && (
        <DeleteEquipmentDialog extinguisher={pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={() => remove(pendingDelete)} />
      )}
      {preview?.photoDataUri && <PhotoViewer extinguisher={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function NavButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium ${active ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10"}`}
    >
      <span className="flex items-center gap-2">{icon}{label}</span>
      {count ? <span className="rounded-full bg-red-500 px-2 text-xs text-white">{count}</span> : null}
    </button>
  );
}

function MobileTab({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex flex-col items-center gap-1 text-[11px] ${active ? "text-blue-700" : "text-slate-500"}`}>
      {icon}
      {label}
    </button>
  );
}

function HeaderBlock({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{kicker}</p>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">{text}</p>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
    </label>
  );
}

function Inventory({
  plant,
  counts,
  visible,
  total,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  areaFilter,
  setAreaFilter,
  areas,
  types,
  onCreate,
  onExport,
  onOpen,
  onAlerts,
}: {
  plant: PlantProfile;
  counts: { total: number; vigentes: number; proximos: number; vencidos: number };
  visible: Extinguisher[];
  total: number;
  query: string;
  setQuery: (value: string) => void;
  statusFilter: "todos" | EquipmentStatus;
  setStatusFilter: (value: "todos" | EquipmentStatus) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  areaFilter: string;
  setAreaFilter: (value: string) => void;
  areas: string[];
  types: string[];
  onCreate: () => void;
  onExport: () => void;
  onOpen: (item: Extinguisher) => void;
  onAlerts: () => void;
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Inventario</p>
          <h2 className="text-2xl font-bold">Control de extintores</h2>
          <p className="text-sm text-slate-600">
            {counts.total === 0
              ? `Aún no hay equipos en ${plant.name}.`
              : `Visibilidad operativa de ${counts.total} equipos en ${plant.name}.`}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onExport} disabled={total === 0} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Registrar equipo
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Total de equipos" value={counts.total} tone="text-slate-900" />
        <Metric label="Vigentes" value={counts.vigentes} tone="text-emerald-600" />
        <Metric label="Próximos a vencer" value={counts.proximos} tone="text-amber-600" />
        <Metric label="Vencidos" value={counts.vencidos} tone="text-red-600" />
      </div>

      {counts.vencidos > 0 && (
        <button type="button" onClick={onAlerts} className="mb-4 flex w-full items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm text-red-800">
          <span>{counts.vencidos} equipos vencidos requieren atención</span>
          <span className="font-semibold">Revisar alertas →</span>
        </button>
      )}

      <div className="mb-4 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-4">
        <label className="relative md:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por ID, ubicación o tipo..." className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "todos" | EquipmentStatus)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="todos">Estado: todos</option>
          <option value="vigente">Vigentes</option>
          <option value="proximo">Próximos a vencer</option>
          <option value="vencido">Vencidos</option>
        </select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="todos">Tipo: todos</option>
          {types.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="todos">Ubicación: toda la planta</option>
          {areas.map((area) => <option key={area} value={area}>{area}</option>)}
        </select>
      </div>

      <p className="mb-3 text-sm text-slate-500">
        Mostrando {visible.length} de {total} equipos · Orden: vencimiento más próximo · Cumplimiento {compliancePercent(visible)}%
      </p>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold">No hay equipos para mostrar</p>
          <p className="mt-1 text-sm text-slate-500">Registra el primer extintor para empezar el control de la planta.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((item) => {
            const status = getStatus(item.expiryDate);
            return (
              <button key={item.id} type="button" onClick={() => onOpen(item)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    {item.photoDataUri && <img src={item.photoDataUri} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                    <div>
                      <p className="font-bold">{displayCode(item)}</p>
                      <p className="text-sm text-slate-600">{item.typeOfExtinguisher}{item.capacity ? ` · ${item.capacity}` : ""}</p>
                      <p className="text-sm text-slate-800">{item.location}</p>
                      {item.exactPoint && <p className="text-xs text-slate-500">{item.exactPoint}</p>}
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusStyle[status]}`}>
                    {status === "vigente" ? "Vigente" : status === "proximo" ? "Próximo a vencer" : "Vencido"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Última recarga</p>
                    <p className="font-medium">{formatShort(item.dateOfManufacture)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Vencimiento</p>
                    <p className="font-medium">{formatShort(item.expiryDate)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Alerts({ items, onOpen, onExport }: { items: Extinguisher[]; onOpen: (item: Extinguisher) => void; onExport: () => void }) {
  const vencidos = items.filter((item) => getStatus(item.expiryDate) === "vencido");
  const proximos = items.filter((item) => getStatus(item.expiryDate) === "proximo");
  return (
    <section>
      <HeaderBlock
        kicker="Seguimiento"
        title="Alertas"
        text={items.length === 0 ? "No hay equipos vencidos ni próximos a vencer." : `${items.length} equipos requieren seguimiento.`}
      />
      <button type="button" onClick={onExport} disabled={items.length === 0} className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
        <Download className="h-4 w-4" /> Exportar lista
      </button>
      <h3 className="mb-2 font-semibold text-red-700">Vencidos · acción inmediata</h3>
      <AlertList items={vencidos} onOpen={onOpen} empty="No hay equipos vencidos." />
      <h3 className="mb-2 mt-6 font-semibold text-amber-700">Próximos a vencer · 30 días</h3>
      <AlertList items={proximos} onOpen={onOpen} empty="No hay equipos por vencer en los próximos 30 días." />
    </section>
  );
}

function AlertList({ items, onOpen, empty }: { items: Extinguisher[]; onOpen: (item: Extinguisher) => void; empty?: string }) {
  if (items.length === 0) return <p className="text-sm text-slate-500">{empty || "Sin equipos en esta lista."}</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const status = getStatus(item.expiryDate);
        return (
          <button key={item.id} type="button" onClick={() => onOpen(item)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left">
            <div>
              <p className="font-semibold">{displayCode(item)}</p>
              <p className="text-sm text-slate-600">{item.location}{item.exactPoint ? ` · ${item.exactPoint}` : ""}</p>
              <p className="text-xs text-slate-500">{item.typeOfExtinguisher}{item.capacity ? ` · ${item.capacity}` : ""}</p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-semibold ${status === "vencido" ? "text-red-600" : "text-amber-700"}`}>
                {status === "vencido" ? "Venció" : "Vence"}
              </p>
              <p className="text-sm font-medium">{formatShort(item.expiryDate)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
