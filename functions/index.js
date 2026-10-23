/**
 * Avisos automáticos (como los del banco o WhatsApp) con Firebase Cloud Messaging.
 *  1) Nueva solicitud            → aviso a todos los celulares de coordinación.
 *  2) Solicitud marcada atendida → aviso a la familia que la envió.
 *  3) La familia abre WhatsApp / llamada / Gmail → aviso a coordinación.
 */
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

// ⚠️ Cambia por la dirección donde publiques la app (sin "/" al final).
const APP_URL = 'https://TU-PROYECTO.web.app';

const TURNOS = { manana: 'Mañana', tarde: 'Tarde' };
const TIPOS = { no_sube: 'No sube', sube_distinto: 'Sube en lugar distinto', no_baja: 'No baja', baja_distinto: 'Baja en lugar distinto' };
const CANALES = { whatsapp: 'WhatsApp', llamada: 'la llamada', reporte: 'un reporte por Gmail' };
const tel = (s) => { const d = String(s || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}` : ''; };

async function tokens(filtro) {
  let q = db.collection('tokens');
  for (const [campo, valor] of Object.entries(filtro)) q = q.where(campo, '==', valor);
  const s = await q.get();
  return s.docs.map((d) => d.id);
}

async function enviar(lista, { titulo, cuerpo, link, tag }) {
  if (!lista.length) return;
  for (let i = 0; i < lista.length; i += 500) {
    const lote = lista.slice(i, i + 500);
    const r = await admin.messaging().sendEachForMulticast({
      tokens: lote,
      webpush: {
        notification: { title: titulo, body: cuerpo, icon: `${APP_URL}/icons/icon-192.png`, badge: `${APP_URL}/icons/icon-192.png`, tag, renotify: true },
        fcmOptions: { link }
      }
    });
    // Borra los tokens de celulares que ya no existen o desinstalaron la app.
    const malos = [];
    r.responses.forEach((res, k) => {
      const code = res.error && res.error.code;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') malos.push(lote[k]);
    });
    await Promise.all(malos.map((t) => db.collection('tokens').doc(t).delete()));
  }
}

exports.avisarNuevaSolicitud = onDocumentCreated('solicitudes/{id}', async (event) => {
  const s = event.data && event.data.data();
  if (!s) return;
  let cuerpo = `${s.alumno} — ${TIPOS[s.tipo] || s.tipo}`;
  if (s.recibe) cuerpo += `. Recibe: ${s.recibe}`;
  if (s.identificacion) cuerpo += '. Con identificación';
  cuerpo += `. Tel. ${tel(s.telefono)}`;
  await enviar(await tokens({ rol: 'coordinacion' }), {
    titulo: `Nueva solicitud · ${TURNOS[s.turno] || ''}`,
    cuerpo,
    link: `${APP_URL}/coordinacion.html`,
    tag: `sol-${event.params.id}`
  });
});

exports.avisarAtendida = onDocumentUpdated('solicitudes/{id}', async (event) => {
  const antes = event.data.before.data();
  const despues = event.data.after.data();
  if (!despues || antes.estado === 'atendida' || despues.estado !== 'atendida') return;
  await enviar(await tokens({ uid: despues.uid }), {
    titulo: 'Solicitud atendida ✓',
    cuerpo: `Coordinación confirmó el cambio de ${despues.alumno} (${(TURNOS[despues.turno] || '').toLowerCase()} · ${(TIPOS[despues.tipo] || '').toLowerCase()}).`,
    link: `${APP_URL}/index.html`,
    tag: `ok-${event.params.id}`
  });
});

exports.avisarContacto = onDocumentCreated('contactos/{id}', async (event) => {
  const c = event.data && event.data.data();
  if (!c) return;
  const quien = c.alumno || c.email || 'Una familia';
  await enviar(await tokens({ rol: 'coordinacion' }), {
    titulo: 'Contacto de una familia',
    cuerpo: `${quien}${c.telefono ? ' (' + tel(c.telefono) + ')' : ''} abrió ${CANALES[c.canal] || c.canal}.`,
    link: `${APP_URL}/coordinacion.html`,
    tag: `con-${event.params.id}`
  });
});
