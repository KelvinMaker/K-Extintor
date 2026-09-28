
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import type { Extinguisher } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ComplianceBadge from "@/components/ComplianceBadge";
import { MapPin, HardHat, CalendarDays, Factory, Edit, Eye, Image as ImageIcon, Trash2 } from 'lucide-react';
import { format, addYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXTINGUISHER_TYPES_ES } from '@/lib/constants';

interface ExtinguisherCardProps {
  extinguisher: Extinguisher;
  onUpdateExtinguisher: (updatedExtinguisher: Extinguisher) => void;
  onDeleteExtinguisher: (id: string) => void;
}

const ExtinguisherCard: FC<ExtinguisherCardProps> = ({ extinguisher, onUpdateExtinguisher, onDeleteExtinguisher }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedExtinguisher, setEditedExtinguisher] = useState<Extinguisher>(extinguisher);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditedExtinguisher(extinguisher);
    }
  }, [extinguisher, isEditing]);

  useEffect(() => {
    if (isEditing && editedExtinguisher.dateOfManufacture instanceof Date && !isNaN(editedExtinguisher.dateOfManufacture.getTime())) {
      const newExpiryDate = addYears(editedExtinguisher.dateOfManufacture, 1);
      if (editedExtinguisher.expiryDate?.getTime() !== newExpiryDate.getTime()) {
        setEditedExtinguisher(prevState => ({
          ...prevState,
          expiryDate: newExpiryDate,
        }));
      }
    }
  }, [isEditing, editedExtinguisher.dateOfManufacture]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedExtinguisher(prevState => ({
      ...prevState,
      [name]: (name === 'dateOfManufacture' || name === 'expiryDate') ? (value ? new Date(value) : new Date()) : value,
    }));
  };
  
  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedExtinguisher(prevState => ({
          ...prevState,
          photoDataUri: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectChange = (value: string) => {
    setEditedExtinguisher(prevState => ({
      ...prevState,
      typeOfExtinguisher: value,
    }));
  };
  
  const handleEditClick = () => {
    setEditedExtinguisher(extinguisher); 
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    if (!(editedExtinguisher.dateOfManufacture instanceof Date && !isNaN(editedExtinguisher.dateOfManufacture.getTime())) ||
        !(editedExtinguisher.expiryDate instanceof Date && !isNaN(editedExtinguisher.expiryDate.getTime()))) {
      alert("Por favor, introduce fechas válidas.");
      return;
    }
    onUpdateExtinguisher(editedExtinguisher);
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setEditedExtinguisher(extinguisher); 
    setIsEditing(false);
  };

  const handleDeleteConfirm = () => {
    onDeleteExtinguisher(extinguisher.id);
    setShowDeleteConfirmDialog(false);
  };

  const displayExtinguisher = isEditing ? editedExtinguisher : extinguisher;
  const currentTypeLabel = EXTINGUISHER_TYPES_ES.find(t => t.value === displayExtinguisher.typeOfExtinguisher)?.label || displayExtinguisher.typeOfExtinguisher;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
      <CardHeader>
        <div className="flex justify-between items-start">
          {isEditing ? (
            <Input 
              name="location" 
              value={editedExtinguisher.location} 
              onChange={handleInputChange} 
              className="text-xl font-semibold text-primary p-0 h-auto border-none focus-visible:ring-transparent mb-1 mr-16" 
              placeholder="Ubicación"
            />
          ) : (
            <CardTitle className="text-xl font-semibold text-primary mr-24">{displayExtinguisher.location || 'Ubicación sin nombre'}</CardTitle>
          )}
          <div className="flex items-center gap-1 absolute top-3 right-3">
            {!isEditing && displayExtinguisher.photoDataUri && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-1 text-muted-foreground hover:text-primary h-7 w-7"
                    aria-label="Ver foto del extintor"
                  >
                    <Eye className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[80vw] md:max-w-[60vw] lg:max-w-[50vw] xl:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Foto: {displayExtinguisher.location}</DialogTitle>
                    <DialogDescription>
                      Imagen cargada para este extintor.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 flex justify-center items-center max-h-[75vh] overflow-auto">
                    <img 
                      src={displayExtinguisher.photoDataUri} 
                      alt={`Foto de ${displayExtinguisher.location}`} 
                      className="max-w-full max-h-full rounded-md object-contain"
                      data-ai-hint="extinguisher label"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {!isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-1 text-muted-foreground hover:text-primary h-7 w-7"
                  onClick={handleEditClick}
                  aria-label="Editar extintor"
                >
                  <Edit className="h-5 w-5" />
                </Button>
                <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-1 text-destructive/70 hover:text-destructive h-7 w-7"
                      aria-label="Eliminar extintor"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Estás a punto de eliminar el extintor ubicado en "<strong className="text-foreground">{displayExtinguisher.location || 'Ubicación sin nombre'}</strong>".
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
            <CardDescription className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" /> ID: {displayExtinguisher.id.substring(0,8)}
            </CardDescription>
            {displayExtinguisher.expiryDate instanceof Date && !isNaN(displayExtinguisher.expiryDate.getTime()) &&
              <ComplianceBadge expiryDate={displayExtinguisher.expiryDate} />
            }
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <div className="flex items-center">
          <HardHat className="h-5 w-5 mr-3 text-accent" />
          <div className="flex-grow">
            <p className="text-sm font-medium text-foreground">Tipo</p>
            {isEditing ? (
              <Select onValueChange={handleSelectChange} value={editedExtinguisher.typeOfExtinguisher}>
                <SelectTrigger className="w-full p-1 h-auto text-sm text-muted-foreground border rounded focus-visible:ring-ring">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {EXTINGUISHER_TYPES_ES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{currentTypeLabel}</p>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <Factory className="h-5 w-5 mr-3 text-accent" />
          <div className="flex-grow">
            <p className="text-sm font-medium text-foreground">Recarga</p>
            {isEditing ? (
              <Input 
                name="dateOfManufacture" 
                type="date" 
                value={editedExtinguisher.dateOfManufacture instanceof Date && !isNaN(editedExtinguisher.dateOfManufacture.getTime()) ? format(editedExtinguisher.dateOfManufacture, 'yyyy-MM-dd') : ''} 
                onChange={handleInputChange} 
                className="p-1 h-auto text-sm text-muted-foreground border rounded focus-visible:ring-ring" 
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {displayExtinguisher.dateOfManufacture instanceof Date && !isNaN(displayExtinguisher.dateOfManufacture.getTime()) ? 
                 format(displayExtinguisher.dateOfManufacture, 'PPP', { locale: es }) : 'Fecha inválida'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <CalendarDays className="h-5 w-5 mr-3 text-accent" />
          <div className="flex-grow">
            <p className="text-sm font-medium text-foreground">Caduca</p>
            {isEditing ? (
              <Input 
                name="expiryDate" 
                type="date" 
                value={editedExtinguisher.expiryDate instanceof Date && !isNaN(editedExtinguisher.expiryDate.getTime()) ? format(editedExtinguisher.expiryDate, 'yyyy-MM-dd') : ''}
                onChange={handleInputChange}
                className="p-1 h-auto text-sm text-muted-foreground border rounded focus-visible:ring-ring" 
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {displayExtinguisher.expiryDate instanceof Date && !isNaN(displayExtinguisher.expiryDate.getTime()) ?
                 format(displayExtinguisher.expiryDate, 'PPP', { locale: es }) : 'Fecha inválida'}
              </p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="space-y-3 mt-3">
            <div>
                <Label htmlFor={`photo-edit-${extinguisher.id}`} className="text-sm font-medium text-foreground">
                    Reemplazar Foto (opcional)
                </Label>
                <Input 
                  id={`photo-edit-${extinguisher.id}`}
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoInputChange}
                  className="mt-1 p-1 h-auto text-sm text-muted-foreground border rounded focus-visible:ring-ring file:text-foreground"
                />
            </div>
            {editedExtinguisher.photoDataUri && (
              <div className="mt-1">
                <p className="text-xs text-muted-foreground mb-1">Vista previa actual:</p>
                <img 
                  src={editedExtinguisher.photoDataUri} 
                  alt="Vista previa de la foto actual" 
                  className="max-h-24 w-auto rounded-md border object-contain"
                  data-ai-hint="label document"
                />
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleCancelClick}>Cancelar</Button>
            <Button onClick={handleSaveClick} className="bg-accent hover:bg-accent/90 text-accent-foreground">Guardar Cambios</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
};

export default ExtinguisherCard;
