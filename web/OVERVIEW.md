# Asesor Patri — Resumen del Proyecto

## Visión General

Asesor Patri es un dashboard financiero diseñado a medida para Patri, con el objetivo de lograr un ahorro mínimo de **200 € al mes** mediante claridad, control y motivación constantes. El producto está desplegado en Vercel y puede consultarse en `https://asesor-patri.vercel.app/` [^vercel].

## Flujo de Datos

- **Fuente primaria**: cada mes Patri sube un Excel con el formato del informe BBVA (`@01.01-31.10 BBVA Patri 2.xlsx`, pestaña *Informe BBVA*).  
- **Ingesta** (`src/lib/excel.ts`):  
  - Detecta automáticamente la hoja correspondiente.  
  - Normaliza columnas (`Subcatergoria`, `Categoria`) y convierte fechas/importe al formato interno.  
  - Respeta manualmente las categorías indicadas en el fichero, usando reglas únicamente como respaldo.
- **Persistencia** (`src/lib/transactions.ts` + `src/app/actions/upload-transactions.ts`):  
  - Se asegura de que la tabla `transactions` exista en la base de datos Postgres de Vercel.  
  - Elimina los meses que vienen en el archivo antes de reinsertar, evitando duplicados.  
  - Revalida el dashboard tras cada importación para ofrecer datos siempre actualizados.

## Backend Analítico

- **Agrupación mensual** (`createDashboardData` en `src/lib/analytics.ts`):  
  - Calcula ingresos, gastos, balance, ahorro, promedio diario y días con movimientos.  
  - Genera comparativas frente al mes anterior y métricas acumuladas.  
  - Guarda resúmenes por categoría y prepara la serie histórica completa.
- **Insights** (`src/lib/insights.ts`):  
  - Produce recomendaciones y alertas “baseline” a partir de las métricas.  
  - Mantiene un punto de integración listo para IA (pendiente de activación cuando se defina el modelo definitivo).
- **Categorías** (`src/lib/categorize.ts`): reglas heurísticas para cubrir huecos cuando el fichero carece de categoría/subcategoría.

## Experiencia de Usuario

- **Landing y contexto** (`src/app/page.tsx`): mensaje motivador y guía de acción rápida.
- **Dashboard principal** (`src/components/dashboard/dashboard-client.tsx`):  
  - Selector de mes con pestañas *Resumen* y *Partidas*.  
  - Tarjetas de métricas clave (ingresos, gastos, balance, progreso hacia la meta).  
  - Gráfica de evolución mensual, alertas automáticas y recomendaciones.  
  - Bloque “Asesor de decisiones” preparado para IA (impacto de nuevos gastos).  
  - “Dónde se va tu dinero”: desglose de categorías estilo “fintech/crypto”.
- **Carga de datos** (`UploadWidget`): arrastrar Excel/CSV y actualizar en segundos.  
- **Edición de movimientos** (`TransactionsTable`):  
  - Búsqueda, filtros por tipo, edición in-line de categoría/subcategoría y soporte para crear etiquetas nuevas.  
  - Persistencia con feedback por fila y refresco inmediato del análisis.
- **Temas claro/oscuro**: `next-themes` + diseño inspirado en interfaces crypto (gradientes, brillos, glassmorphism).

## Infraestructura

- **Framework**: Next.js 16 (app router, Server Components).  
- **UI**: React 19, Tailwind 4, Recharts, Lucide Icons, Framer Motion.  
- **Base de datos**: Vercel Postgres (Neon Serverless).  
- **Despliegue continuo**: GitHub → Vercel (build `npm run build`, output `.next`).  
- **Scripts**:  
  - `npm run dev` — desarrollo.  
  - `npm run build` / `npm start` — producción.  
  - `npm run lint` — calidad de código.  
- **Variables de entorno**: `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`.

## Próximos pasos sugeridos

1. Activar la generación de insights mediante OpenAI cuando se confirme el modelo/clave.  
2. Ampliar el “Asesor de decisiones” con simulaciones de gasto/ahorro.  
3. Añadir exportaciones mensuales (PDF o CSV) para reportes rápidos.  
4. Crear tests automáticos sobre ingestión y categorización para blindar cambios futuros.

[^vercel]: Panel de producción disponible en `https://asesor-patri.vercel.app/`.


