# K-Extintor 🧯

Aplicación moderna para la gestión de inventario y mantenimiento de extintores, diseñada para garantizar la seguridad y el cumplimiento de normativas.

## 🚀 Tecnologías
- **Framework**: [Next.js 15](https://nextjs.org/)
- **Estilos**: Tailwind CSS con tema personalizado Amarillo/Rojo.
- **Componentes**: Radix UI + Shadcn UI.
- **IA**: Google Genkit con Gemini 2.0 Flash para escaneo de etiquetas.
- **Manejo de Fechas**: date-fns.

## ✨ Funcionalidades
1. **Escaneo con IA**: Carga una foto de la etiqueta y la IA extraerá automáticamente el tipo de extintor y la fecha de recarga.
2. **Alertas Inteligentes**: Sistema de notificaciones visuales para equipos que vencen en 7 días o menos. La alerta aparece al iniciar la app o cada 24 horas si hay cambios.
3. **Gestión Completa**: Añade, edita y elimina extintores.
4. **Persistencia Local**: Los datos se guardan en el navegador (`localStorage`).
5. **Exportación**: Genera un archivo CSV con todo tu inventario.

## 🛠️ Instalación y Uso
1. Descarga el código.
2. Ejecuta `npm install`.
3. Configura tu `GEMINI_API_KEY` en el archivo `.env`.
4. Ejecuta `npm run dev` para iniciar el servidor local.

Desarrollado en Firebase Studio.