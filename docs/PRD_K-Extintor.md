# Documento de Requisitos del Producto (PRD) - K-Extintor

## 1. Introducción
**K-Extintor** es una aplicación web diseñada para la gestión, control y seguimiento del inventario de extintores en instalaciones corporativas o industriales. Su objetivo principal es facilitar el registro de equipos, monitorizar sus fechas de caducidad y simplificar la entrada de datos mediante el uso de Inteligencia Artificial.

## 2. Objetivos del Producto
- Mantener un registro digital, seguro y accesible de todos los extintores.
- Prevenir el vencimiento de los equipos mediante alertas proactivas.
- Acelerar el proceso de registro y auditoría extrayendo datos automáticamente de fotografías de etiquetas (IA).
- Facilitar la exportación de reportes para auditorías de seguridad.

## 3. Arquitectura y Tecnologías
- **Frontend/Framework:** Next.js (App Router, v15.2.8) con React 18.
- **Estilos y UI:** Tailwind CSS, shadcn/ui (Radix UI Primitives), Lucide React (Iconos).
- **Inteligencia Artificial:** Firebase Genkit integrado con Google AI (`gemini-2.0-flash`).
- **Almacenamiento:** Local Storage del navegador (sin base de datos backend en esta fase).
- **Validación de Formularios:** React Hook Form + Zod.

## 4. Características y Funcionalidades (Features)

### 4.1. Gestión de Inventario (CRUD)
- **Visualización:** Lista de extintores presentados en formato de tarjetas (Cards). Cada tarjeta muestra la ubicación, ID corto, tipo, fecha de recarga, fecha de caducidad e indicador visual del estado (cumplimiento).
- **Creación:** Formulario para registrar un nuevo extintor con los siguientes campos:
  - Ubicación (Texto)
  - Fotografía de la etiqueta (Subida de archivo)
  - Tipo de Extintor (Selector)
  - Fecha de Recarga (Selector de Fecha)
  - Fecha de Caducidad (Selector de Fecha, auto-calculado a 1 año desde la fecha de recarga)
- **Edición:** Capacidad de modificar cualquier campo de un extintor existente, incluyendo la actualización de la fotografía.
- **Eliminación:** Borrado de un equipo del inventario previa confirmación mediante un cuadro de diálogo de advertencia para evitar borrados accidentales.

### 4.2. Integración con Inteligencia Artificial (IA)
- **Lectura Automática de Etiquetas:** Al subir una fotografía de la etiqueta de un extintor durante el registro, el usuario puede activar la "Lectura de Info". 
- El sistema envía la imagen a un flujo de *Genkit* (impulsado por Gemini 2.0 Flash) que analiza la etiqueta y extrae automáticamente:
  - Tipo de Extintor.
  - Fecha de Recarga.
- Estos datos pre-rellenan el formulario, reduciendo el trabajo manual y errores humanos.

### 4.3. Sistema de Alertas de Caducidad
- **Detección Automática:** Al cargar la aplicación, el sistema verifica todos los registros buscando equipos que caduquen en los próximos 7 días o que ya hayan caducado.
- **Notificación Modal:** Si existen equipos en riesgo, se muestra un *Alert Dialog* detallando la ubicación y la fecha exacta de vencimiento de cada uno.
- **Gestión de Interrupciones:** El sistema recuerda (mediante `localStorage`) si el usuario ya descartó la alerta para evitar mostrar el aviso repetidamente en un periodo de 24 horas, a menos que un nuevo extintor entre en estado crítico.

### 4.4. Exportación y Reportes
- **Descarga CSV:** Botón dedicado en el panel principal que permite generar y descargar instantáneamente un archivo `.csv` (inventario_extintores.csv) con todas las columnas del inventario, útil para compartir con supervisores o abrir en Excel.

### 4.5. Interfaz de Usuario y Experiencia (UX/UI)
- **Diseño Responsivo:** Adaptable a dispositivos móviles, tablets y escritorios.
- **Feedback Visual (Toasts):** Notificaciones flotantes al crear, editar, eliminar o extraer información con IA con éxito o error.
- **Visor de Imágenes:** Modal integrado para previsualizar en tamaño grande la foto guardada de cada extintor directamente desde su tarjeta en el inventario.

## 5. Estructura de Datos
El modelo principal de datos (`Extinguisher`) almacenado consta de:
- `id`: Identificador único (UUID).
- `location`: String (Ubicación física).
- `typeOfExtinguisher`: String (Tipo, ej. PQS, CO2, Agua).
- `dateOfManufacture`: Date (Fecha de recarga o fabricación).
- `expiryDate`: Date (Fecha de vencimiento).
- `photoDataUri`: String (Opcional, imagen en formato Base64/Data URI).

## 6. Consideraciones y Futuras Mejoras
- **Limitación de Almacenamiento:** Debido al uso de `localStorage` y guardar imágenes en `Base64`, el espacio está limitado a unos pocos megabytes (aprox. 5MB en la mayoría de navegadores).
- **Mejoras Futuras:** 
  1. Migrar la persistencia de datos y almacenamiento de imágenes a un backend real (ej. Firebase Firestore y Cloud Storage).
  2. Implementar sistema de autenticación de usuarios.
  3. Soporte PWA (Progressive Web App) para uso offline o escaneo de códigos QR/Barras.
