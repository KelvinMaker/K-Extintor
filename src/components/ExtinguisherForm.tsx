
"use client";

import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addYears } from "date-fns";
import { es } from 'date-fns/locale';
import { readExtinguisherInformation } from '@/ai/flows/read-extinguisher-information';
import type { Extinguisher } from '@/types'; // Importar Extinguisher
import { useToast } from '@/hooks/use-toast';
import { EXTINGUISHER_TYPES_ES } from '@/lib/constants';

const formSchema = z.object({
  location: z.string().min(1, "La ubicación es obligatoria"),
  typeOfExtinguisher: z.string().min(1, "El tipo es obligatorio"),
  dateOfManufacture: z.date({ required_error: "La fecha de recarga es obligatoria." }),
  expiryDate: z.date({ required_error: "La fecha de caducidad es obligatoria." }),
  photo: z.any().optional(), // Para el input de archivo
});

interface ExtinguisherFormProps {
  onSubmit: (data: Extinguisher) => void;
  onCancel: () => void;
}

const ExtinguisherForm: FC<ExtinguisherFormProps> = ({ onSubmit, onCancel }) => {
  const { toast } = useToast();
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: "",
      typeOfExtinguisher: "",
    },
  });

  const watchedDateOfManufacture = form.watch("dateOfManufacture");

  useEffect(() => {
    if (watchedDateOfManufacture && watchedDateOfManufacture instanceof Date && !isNaN(watchedDateOfManufacture.getTime())) {
      const newExpiryDate = addYears(watchedDateOfManufacture, 1);
      form.setValue("expiryDate", newExpiryDate, { shouldValidate: true, shouldDirty: true });
    }
  }, [watchedDateOfManufacture, form.setValue]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("photo", event.target.files as FileList);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue("photo", undefined);
      setPhotoPreview(null);
    }
  };

  const handleReadInfoFromPhoto = async () => {
    const photoFiles = form.getValues("photo") as FileList | undefined | null;
    const photoFile = photoFiles?.[0];

    if (!photoFile) {
      toast({ title: "No se seleccionó foto", description: "Por favor, selecciona una foto de la etiqueta del extintor.", variant: "destructive" });
      return;
    }

    setIsAiProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(photoFile);
      reader.onload = async (e) => {
        const photoDataUriForAI = e.target?.result as string;
        if (!photoDataUriForAI) {
          toast({ title: "Error al leer la foto", description: "No se pudo leer la foto seleccionada.", variant: "destructive" });
          setIsAiProcessing(false);
          return;
        }
        
        const result = await readExtinguisherInformation({ photoDataUri: photoDataUriForAI });
        
        const aiType = result.typeOfExtinguisher;
        const matchingType = EXTINGUISHER_TYPES_ES.find(t => t.value.toLowerCase() === aiType.toLowerCase() || t.label.toLowerCase().includes(aiType.toLowerCase()));
        form.setValue("typeOfExtinguisher", matchingType ? matchingType.value : aiType);

        const manuDate = new Date(result.dateOfManufacture); 
        if (!isNaN(manuDate.getTime())) {
            form.setValue("dateOfManufacture", manuDate, { shouldValidate: true, shouldDirty: true });
        } else {
            toast({ title: "Advertencia de Resultado IA", description: `No se pudo analizar la fecha de recarga: ${result.dateOfManufacture}. Por favor, establécela manually.`, variant: "default" });
        }
        
        toast({ title: "Información Extraída", description: "Tipo y fecha de recarga actualizados desde la foto." });
      };
      reader.onerror = () => {
        toast({ title: "Error al leer la foto", description: "No se pudo procesar la foto seleccionada para la IA.", variant: "destructive" });
      }
    } catch (error) {
      console.error("AI processing error:", error);
      toast({ title: "Error de IA", description: "No se pudo extraer información de la foto. Por favor, completa manualmente.", variant: "destructive" });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const processSubmit = async (data: z.infer<typeof formSchema>) => {
    const { photo, ...restOfData } = data;
    let photoDataUri: string | undefined = undefined;

    if (photo && photo[0]) {
      const file = photo[0];
      try {
        photoDataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch (error) {
        console.error("Error al leer la foto para guardarla:", error);
        toast({
          title: "Error al procesar la foto",
          description: "No se pudo guardar la imagen. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    }

    const newExtinguisher: Extinguisher = {
      id: crypto.randomUUID(),
      ...restOfData,
      dateOfManufacture: restOfData.dateOfManufacture as Date, // Asegurar tipo
      expiryDate: restOfData.expiryDate as Date, // Asegurar tipo
      ...(photoDataUri && { photoDataUri }),
    };
    onSubmit(newExtinguisher);
    form.reset(); 
    setPhotoPreview(null);
    if (photoInputRef.current) {
        photoInputRef.current.value = "";
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-6 p-6 border rounded-lg shadow-md bg-card">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación</FormLabel>
              <FormControl>
                <Input placeholder="ej., Cocina de la oficina, Almacén Sección A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Foto de la Etiqueta</FormLabel>
          <FormControl>
            <Input type="file" accept="image/*" onChange={handlePhotoChange} ref={photoInputRef} className="file:text-foreground"/>
          </FormControl>
          {photoPreview && (
            <div className="mt-2">
              <img src={photoPreview} alt="Vista previa de etiqueta de extintor" className="max-h-40 rounded-md border" data-ai-hint="label document" />
            </div>
          )}
          <Button type="button" onClick={handleReadInfoFromPhoto} disabled={isAiProcessing || !form.getValues("photo")} className="mt-2" variant="outline">
            {isAiProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Leer Info de Foto
          </Button>
          <FormMessage>{form.formState.errors.photo?.message as React.ReactNode}</FormMessage>
        </FormItem>

        <FormField
          control={form.control}
          name="typeOfExtinguisher"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Extintor</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de extintor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EXTINGUISHER_TYPES_ES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="dateOfManufacture" 
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de Recarga</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                        field.onChange(date);
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de Caducidad</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange} 
                    disabled={(date) => {
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        // Permitir la fecha seleccionada actual incluso si es pasada (por si se autocalculó)
                        if (field.value && date.getTime() === field.value.getTime()) {
                            return false;
                        }
                        // Deshabilitar fechas anteriores al día de hoy
                        return date < today;
                    }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Añadir Extintor
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ExtinguisherForm;

