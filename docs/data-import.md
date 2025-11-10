# Carga de informes BBVA

Este proyecto admite la importación directa de los extractos de BBVA exportados en formato Excel (`.xlsx`). A continuación se detalla cómo interpreta el backend los archivos que suba el usuario.

## Reglas de formato

- **Hoja**: se detecta automáticamente la primera pestaña cuyo nombre contenga la palabra `Informe`. Si no existe, se usa la primera hoja del libro.
- **Encabezados**: el parser ignora cualquier bloque inicial (títulos, fechas, celdas vacías) y busca la fila que incluya las columnas `Concepto` y `Importe`. A partir de ahí se toman los datos.
- **Columnas mínimas**:
  - `F.Valor` (fecha valor) – se utiliza como fecha principal de la transacción.
  - `Fecha` – fecha de contabilización; si falta, se reutiliza la fecha valor.
  - `Concepto` y `Movimiento` – se combinan para generar la descripción y ayudan a la categorización.
  - `Importe` – admite formatos `-15.10`, `-15,10` o con miles `1.234,56`. Los gastos deben venir como valores negativos.
  - `Observaciones` – opcional, pero se incorpora a la descripción ampliada y al motor de categorización.
- **Columnas opcionales**:
  - `Categoría` / `Categoria`
  - `Subcategoría` / `Subcatergoria`
  Si el informe incluye estas columnas, se respetan como prioridad.

## Lógica aplicada durante la importación

- **Normalización de datos**: espacios y saltos de línea se recortan; valores vacíos se descartan.
- **Fechas**: se aceptan fechas Excel, texto `dd/MM/yyyy` o formatos ISO.
- **Importes**: se detecta automáticamente el separador decimal para evitar errores de escala.
- **Duplicados**: dentro del propio archivo se elimina cualquier fila repetida (misma combinación de fecha valor, fecha contabilización, importe, concepto, movimiento y observaciones).
- **Meses**: el informe puede mezclar meses; el `monthKey` se calcula a partir de la `F.Valor`. Al guardar, se reemplazan los movimientos ya existentes de esos meses para evitar duplicados históricos.

## Categorización

- Si el archivo trae `Categoría`/`Subcategoría`, se marca el movimiento como proveniente del fichero (`categorizationSource: "file"`).
- En caso contrario, se aplica el motor heurístico interno y, si sigue sin resultado claro, se marca la operación como `Sin clasificar`, queda destacada en el dashboard (`pendingCategory: true`) y la capa de IA intenta sugerir una categoría.
- Las reglas manuales del usuario (`category-rules`) se aplican después de parsear y antes de invocar a la IA.

## Errores habituales

- Encabezados renombrados o traducidos: asegúrese de que la fila de títulos contenga al menos `Concepto` e `Importe`.
- Celdas con texto no numérico en `Importe`: deben convertirse a número antes de importar.
- Archivos CSV: aún no se ha implementado la adaptación para este layout concreto; exporte el informe en `.xlsx`.

Con estas reglas en mente, basta con subir el informe descargado de BBVA sin realizar modificaciones manuales sobre el formato de la hoja. El sistema avisará desde el dashboard si quedan movimientos por categorizar o si algún campo crítico falta en el archivo.


