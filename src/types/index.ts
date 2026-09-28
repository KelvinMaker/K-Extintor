export interface Extinguisher {
  id: string;
  code?: string;
  location: string;
  exactPoint?: string;
  typeOfExtinguisher: string;
  capacity?: string;
  serialNumber?: string;
  notes?: string;
  dateOfManufacture: Date;
  expiryDate: Date;
  photoDataUri?: string;
  photoName?: string;
}

export type ExtinguisherFormData = {
  location: string;
  typeOfExtinguisher: string;
  dateOfManufacture?: Date;
  expiryDate?: Date;
  photo?: FileList;
};