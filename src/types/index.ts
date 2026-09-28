export interface Extinguisher {
  id: string;
  location: string;
  typeOfExtinguisher: string;
  dateOfManufacture: Date;
  expiryDate: Date;
  photoDataUri?: string;
}

export type ExtinguisherFormData = {
  location: string;
  typeOfExtinguisher: string;
  dateOfManufacture?: Date;
  expiryDate?: Date;
  photo?: FileList;
};