/* Funciones compartidas por la app de familias y la de coordinación. */
(function () {
  'use strict';
  const C = self.APP_CONFIG;
  firebase.initializeApp(C.firebase);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const TS = () => firebase.firestore.FieldValue.serverTimestamp();

  /* ---------- Service worker (caché + avisos push) ---------- */
  let swReg = null;
  async function registrarSW() {
    if (!('serviceWorker' in navigator)) return null;
    try { swReg = await navigator.serviceWorker.register('./firebase-messaging-sw.js'); }
    catch (e) { console.warn('SW no registrado', e); }
    return swReg;
  }
  const swListo = registrarSW();

  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const esInstalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  async function pushSoportado() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
    try { return await Promise.resolve(firebase.messaging.isSupported()); }
    catch (e) { return false; }
  }

  /** Pide permiso y guarda el token de este celular. rol: 'familia' | 'coordinacion' */
  async function activarAvisos(rol, opciones) {
    const silencioso = !!(opciones && opciones.silencioso);
    const user = auth.currentUser;
    if (!user) return false;
    if (!(await pushSoportado())) {
      if (!silencioso) {
        toast(esIOS && !esInstalada
          ? 'En iPhone primero agrega la app a tu pantalla de inicio (Compartir → Agregar a inicio) y ábrela desde ahí.'
          : 'Este navegador no admite avisos. Usa Chrome o Safari actualizados.');
      }
      return false;
    }
    let permiso = Notification.permission;
    if (permiso === 'default') {
      if (silencioso) return false;
      permiso = await Notification.requestPermission();
    }
    if (permiso !== 'granted') {
      if (!silencioso) toast('Los avisos están bloqueados. Actívalos en los ajustes del navegador para esta página.');
      return false;
    }
    try {
      const reg = (await swListo) || (await registrarSW());
      const token = await firebase.messaging().getToken({ vapidKey: C.vapidKey, serviceWorkerRegistration: reg });
      if (!token) return false;
      await db.collection('tokens').doc(token).set({
        uid: user.uid, rol: rol, actualizado: TS(), dispositivo: navigator.userAgent.slice(0, 140)
      });
      if (!silencioso) toast('Listo: recibirás avisos en este celular.');
      return true;
    } catch (e) {
      console.error(e);
      if (!silencioso) toast('No se pudieron activar los avisos (' + (e.code || e.message) + ').');
      return false;
    }
  }

  /** Avisos que llegan con la app abierta: los mostramos como toast. */
  function escucharEnPrimerPlano(fn) {
    pushSoportado().then(function (ok) {
      if (ok) firebase.messaging().onMessage(function (p) { fn(p); });
    });
  }

  /* ---------- Utilidades ---------- */
  let toastTimer;
  function toast(msg) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast'; el.className = 'toast';
      el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 4500);
  }
  const soloDigitos = (s) => String(s || '').replace(/\D/g, '');
  function telBonito(s) {
    const d = soloDigitos(s).slice(-10);
    return d.length === 10 ? d.slice(0, 2) + ' ' + d.slice(2, 6) + ' ' + d.slice(6) : (s || '');
  }
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function hora(ts) {
    const d = ts && ts.toDate ? ts.toDate() : null;
    if (!d) return 'ahora';
    const hoy = new Date().toDateString() === d.toDateString();
    const dia = hoy ? 'Hoy' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    return dia + ', ' + d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
  }
  function hoyISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }
  function fechaLarga(iso) {
    if (!iso) return '';
    const p = iso.split('-').map(Number);
    const f = new Date(p[0], p[1] - 1, p[2]);
    return (iso === hoyISO() ? 'Hoy, ' : '') + f.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function errorAuth(e) {
    const m = {
      'auth/invalid-credential': 'Correo o contraseña incorrectos.',
      'auth/wrong-password': 'Correo o contraseña incorrectos.',
      'auth/user-not-found': 'No existe una cuenta con ese correo.',
      'auth/invalid-email': 'El correo no es válido.',
      'auth/missing-password': 'Escribe tu contraseña.',
      'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
      'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Inicia sesión.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/network-request-failed': 'Sin conexión. Revisa tu internet.'
    };
    return m[e && e.code] || 'Ocurrió un error (' + ((e && (e.code || e.message)) || 'desconocido') + ').';
  }

  window.App = {
    C, auth, db, TS, esIOS, esInstalada, pushSoportado, activarAvisos, escucharEnPrimerPlano,
    toast, soloDigitos, telBonito, esc, hora, hoyISO, fechaLarga, errorAuth,
    TURNOS: { manana: 'Mañana', tarde: 'Tarde' },
    TIPOS: { no_sube: 'No sube', sube_distinto: 'Sube en lugar distinto', no_baja: 'No baja', baja_distinto: 'Baja en lugar distinto' },
    CANALES: { whatsapp: 'WhatsApp', llamada: 'Llamada', reporte: 'Reporte (Gmail)' }
  };
})();
