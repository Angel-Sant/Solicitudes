# Transporte Bilbao · Solicitudes de cambio

Esta PWA tiene dos apps que usan los mismos datos:

| Archivo | Para quién | Qué hace |
|---|---|---|
| `public/index.html` | Familias | Acceso, alumno con historial, Mañana/Tarde, confirmación al número, WhatsApp, llamada y reporte |
| `public/coordinacion.html` | Coordinación | Bandeja en tiempo real, detalle con teléfono, responder por WhatsApp o llamada, marcar como atendida |

Los avisos tipo banco o WhatsApp salen de `functions/index.js`:
- A **coordinación** le llega un aviso cada vez que entra una solicitud nueva.
- A **coordinación** también le llega un aviso cuando una familia toca WhatsApp, Llamar o Reporte.
- A **la familia** le llega un aviso cuando coordinación marca su solicitud como **atendida**.

---

## Puesta en marcha (una sola vez)

1. **Proyecto Firebase.** Puedes crear uno nuevo o reutilizar `rutas-bilbao`. Esta app usa colecciones propias, así que no choca con lo que ya tiene ese proyecto.
2. **Authentication** → Método de acceso → activa **Correo electrónico/contraseña**.
3. **Firestore Database** → Crear base de datos. Usa modo producción y la región `nam5` o `us-central`.
4. **Plan Blaze.** Las Cloud Functions lo exigen. Para el volumen de un colegio queda dentro de la capa gratuita, pero pide tarjeta. Pon una **alerta de presupuesto** (por ejemplo, $20 MXN) en Google Cloud → Facturación → Presupuestos.
5. **Configuración del proyecto → Tus apps → Web (</>)**. Copia el bloque `firebaseConfig` y pégalo en `public/firebase-config.js`.
6. **Configuración → Cloud Messaging → Certificados push web → Generar par de claves.** Pega la clave en `vapidKey` dentro del mismo archivo.
7. En `public/firebase-config.js` llena también el WhatsApp, el teléfono y el correo de coordinación.
8. En `functions/index.js` cambia `APP_URL` por la dirección final de la app, por ejemplo `https://rutas-bilbao.web.app`.
9. En la computadora, instala Node 20 y luego ejecuta:
   ```
   npm install -g firebase-tools
   firebase login
   firebase use --add          (elige tu proyecto)
   cd functions && npm install && cd ..
   firebase deploy
   ```

## Dar permiso de coordinación

1. Crea la cuenta del coordinador. Puedes hacerlo en Authentication → Agregar usuario, o entrando una vez a `coordinacion.html`, que muestra el **UID** de la cuenta.
2. En Firestore, crea la colección **`roles`**.
3. Dentro, crea un documento cuyo ID sea **ese UID**, con el campo `rol` (texto) = `coordinacion`.
4. En su celular, el coordinador abre `https://TU-APP/coordinacion.html`, la **instala** (Agregar a pantalla de inicio) y toca la **campana** 🔔 para activar los avisos.

## Familias

- Entran a `https://TU-APP/`. Pueden crear su cuenta; si prefieres darlas de alta tú, pon `permitirRegistro: false`.
- **En iPhone** los avisos solo funcionan con iOS 16.4 o posterior **y** con la app instalada en la pantalla de inicio. La app lo explica en pantalla.
- Si una familia no activa los avisos, igual ve en el inicio el estado de su solicitud (Enviada / Atendida).

## Qué se guarda en Firestore

- `usuarios/{uid}`: correo, historial de alumnos (los últimos 6) y teléfono de confirmación.
- `solicitudes/{id}`: alumno, turno, tipo, día, dirección, quién recibe, foto de la identificación (comprimida, alrededor de 150 KB), teléfono, estado y fechas.
- `contactos/{id}`: registro de cuando una familia toca WhatsApp, Llamar o Reporte.
- `tokens/{token}`: celulares que reciben avisos.
- `roles/{uid}`: quién es coordinación. Solo se edita a mano en la consola.

## Cambiar el color azul

En `public/styles.css` cambia `--azul` (y `--azul-osc`). Cambia también `theme_color` en los dos `manifest*.json` y el `<meta name="theme-color">` de cada página.

## Limitaciones conocidas

- La app **no puede leer el número del celular**. Por eso la familia lo escribe una vez en "Recibir confirmación al número" y desde entonces se rellena solo.
- Cuando la familia toca WhatsApp, Llamar o Gmail, la app solo sabe *que lo abrió*, no qué escribió afuera.
- La identificación se acepta como **foto** (JPG/PNG), no como PDF. Así se guarda en Firestore sin necesitar Storage.
- Si publicas cambios y algún Android sigue mostrando la versión vieja, súbele el número a `CACHE` en `public/firebase-messaging-sw.js`.
