# Manual de Actualización: Google Apps Script v2 🛰️

Para que el historial de jornadas y el cuadro de ganadores funcionen, debes actualizar el código de tu Google Sheet.

###  pasos a seguir:
1.  Abre tu Google Sheet de Sports King.
2.  Ve a **Extensiones -> Apps Script**.
3.  **Borra todo** el código actual y pega este nuevo bloque:

```javascript
/**
 * SPORTS KING - SISTEMA DE SINCRONIZACIÓN Y REGISTRO V2
 * Actualizado: Soporte para Múltiples Jornadas e Historial
 */

const SHEET_NAME = "RESPUESTAS";
const OFFICIAL_RESULTS_ROW = "RESULTADOS_OFICIALES";
const LIVE_SCORES_ROW = "MARCADORES_VIVO";
const JACKPOT_ROW = "MARCADOR_JACKPOT_GOLES";

/**
 * Función para recibir registros desde el sitio web
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // Obtenemos los valores enviados por la web
    const nombre = data.nombre || "Sin Nombre";
    const predicciones = data.predicciones || "";
    const telefono = data.poblacion || ""; // Usamos la clave enviada
    const metodo = data.metodo_pago || "NONE";
    const status = data.status || "PENDIENTE";
    const jornadaId = data.jornada || 13; // Nueva columna de Jornada
    
    // Añadimos la fila al Excel
    // Columna A: Nombre, B: Predicciones, C: Puntos (0), D: Teléfono, E: Status, F: Jornada
    sheet.appendRow([nombre, predicciones, 0, telefono, status, jornadaId, metodo, new Date()]);
    
    return ContentService.createTextOutput("Registro exitoso").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Función de Sincronización Automática con ESPN
 * (Configura un ACTIVADOR para que corra cada 15-30 minutos)
 */
function syncESPN() {
  // Nota: La sincronización de marcadores ahora se maneja 
  // principalmente desde el lado del cliente (sitio web) 
  // para mayor precisión con el calendario.
  console.log("Sistema sincronizado vía cliente.");
}

function doGet(e) {
  return ContentService.createTextOutput("Servicio Sports King Activo");
}
```

### ⚠️ IMPORTANTE:
1.  Haz clic en el icono de **Guardar (💾)**.
2.  Haz clic en el botón azul **Desplegar -> Nueva implementación**.
3.  Selecciona Tipo: **Aplicación web**.
4.  Descripción: `Soporte Multi-Jornada`.
5.  Ejecutar como: **Tú (Tu correo)**.
6.  Quién tiene acceso: **Cualquiera (Anyone)**. <-- **ESTO ES VITAL**.
7.  Haz clic en **Desplegar** y **Autorizar acceso** si te lo pide.

**Si la URL del script cambia, recuerda avisarme para actualizarla en el sitio web.**
