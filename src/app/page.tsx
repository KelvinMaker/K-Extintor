"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Extinguisher } from '@/types';
import Header from '@/components/Header';
import ExtinguisherForm from '@/components/ExtinguisherForm';
import ExtinguisherCard from '@/components/ExtinguisherCard';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListChecks, Download } from 'lucide-react';
import Image from 'next/image';
import { format, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { EXTINGUISHER_TYPES_ES } from '@/lib/constants';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showExpiryWarningDialog, setShowExpiryWarningDialog] = useState(false);
  const [expiringSoonList, setExpiringSoonList] = useState<Extinguisher[]>([]);
  const hasRunInitialCheck = useRef(false);
  const { toast } = useToast();

  const LS_KEY = 'kExtintorExtinguishers';
  const LS_LAST_ALERT = 'kExtintor_lastAlertTimestamp';
  const LS_DISMISSED_IDS = 'kExtintor_dismissedIds';

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((ext: any) => ({
          ...ext,
          dateOfManufacture: new Date(ext.dateOfManufacture),
          expiryDate: new Date(ext.expiryDate),
        }));
        setExtinguishers(parsed);
      } catch (e) {
        console.error("Error loading data", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LS_KEY, JSON.stringify(extinguishers));
    }
  }, [extinguishers, isClient]);

  useEffect(() => {
    if (!isClient || extinguishers.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiring = extinguishers.filter(ext => {
      const days = differenceInCalendarDays(new Date(ext.expiryDate), today);
      return days >= 0 && days <= 7;
    });

    if (expiring.length > 0) {
      const now = Date.now();
      const lastAlert = parseInt(localStorage.getItem(LS_LAST_ALERT) || '0');
      const dismissedIds = JSON.parse(localStorage.getItem(LS_DISMISSED_IDS) || '[]');
      const currentIds = expiring.map(e => e.id).sort().join(',');
      const prevIds = dismissedIds.sort().join(',');

      const isNewList = currentIds !== prevIds;
      const isMoreThan24h = now - lastAlert > 24 * 60 * 60 * 1000;

      if (!hasRunInitialCheck.current || isNewList || isMoreThan24h) {
        setExpiringSoonList(expiring);
        setShowExpiryWarningDialog(true);
        hasRunInitialCheck.current = true;
      }
    }
  }, [extinguishers, isClient]);

  const handleAdd = (newExt: Extinguisher) => {
    setExtinguishers(prev => [...prev, newExt].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime()));
    setShowForm(false);
    toast({ title: "Añadido", description: "Nuevo extintor registrado correctamente." });
  };

  const handleUpdate = (updated: Extinguisher) => {
    setExtinguishers(prev => prev.map(e => e.id === updated.id ? updated : e).sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime()));
    toast({ title: "Actualizado", description: "Información del extintor actualizada." });
  };

  const handleDelete = (id: string) => {
    setExtinguishers(prev => prev.filter(e => e.id !== id));
    toast({ title: "Eliminado", description: "El extintor ha sido removido del sistema.", variant: "destructive" });
  };

  const handleDismiss = () => {
    setShowExpiryWarningDialog(false);
    localStorage.setItem(LS_LAST_ALERT, Date.now().toString());
    localStorage.setItem(LS_DISMISSED_IDS, JSON.stringify(expiringSoonList.map(e => e.id)));
  };

  const handleDownloadCSV = () => {
    const headers = "ID,Ubicacion,Tipo,Recarga,Caducidad\n";
    const rows = extinguishers.map(e => `${e.id},${e.location},${e.typeOfExtinguisher},${format(e.dateOfManufacture, 'yyyy-MM-dd')},${format(e.expiryDate, 'yyyy-MM-dd')}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventario_extintores.csv';
    a.click();
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-primary flex items-center">
            <ListChecks className="mr-3 h-8 w-8" />
            Inventario
          </h2>
          <div className="flex gap-3">
            <Button onClick={() => setShowForm(!showForm)} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-5 w-5" />
              {showForm ? 'Cancelar' : 'Añadir Nuevo'}
            </Button>
            <Button onClick={handleDownloadCSV} variant="outline" disabled={extinguishers.length === 0}>
              <Download className="mr-2 h-5 w-5" />
              CSV
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
            <ExtinguisherForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {extinguishers.length === 0 && !showForm ? (
          <div className="text-center py-20 bg-card/50 rounded-2xl border-2 border-dashed border-muted flex flex-col items-center">
            <div className="relative w-48 h-48 mb-6 opacity-40">
              <Image
                src="https://placehold.co/300x200/C70039/FFFFFF.png?text=Extintor"
                alt="Gráfico de extintor"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-xl text-muted-foreground font-medium">No hay equipos registrados aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {extinguishers.map((ext) => (
              <ExtinguisherCard
                key={ext.id}
                extinguisher={ext}
                onUpdateExtinguisher={handleUpdate}
                onDeleteExtinguisher={handleDelete}
              />
            ))}
          </div>
        )}

        <AlertDialog open={showExpiryWarningDialog} onOpenChange={setShowExpiryWarningDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive text-xl flex items-center gap-2">
                ⚠️ Alerta de Caducidad
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base pt-2">
                Los siguientes equipos vencen en menos de 7 días:
                <ul className="mt-4 space-y-3">
                  {expiringSoonList.map(ext => (
                    <li key={ext.id} className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <span className="font-bold text-foreground">{ext.location}</span>
                      <br />
                      <span className="text-sm text-muted-foreground">Vence el: {format(ext.expiryDate, 'PPP', { locale: es })}</span>
                    </li>
                  ))}
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleDismiss} className="w-full bg-primary hover:bg-primary/90">
                Entendido
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <footer className="p-6 text-center text-muted-foreground text-sm border-t bg-card/30">
        K-Extintor &copy; {new Date().getFullYear()} - Seguridad y Control
      </footer>
    </div>
  );
}