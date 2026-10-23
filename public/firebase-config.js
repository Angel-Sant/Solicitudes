/* ============================================================
   CONFIGURACIÓN — es el único archivo que necesitas llenar.
   (Lo usan index.html, coordinacion.html y el service worker.)
   ============================================================ */
self.APP_CONFIG = {
  // 1) Firebase Console → Configuración del proyecto → Tus apps → App web → "Configuración del SDK"
  firebase: {
    apiKey: "PEGA_AQUI",
    authDomain: "PEGA_AQUI.firebaseapp.com",
    projectId: "PEGA_AQUI",
    storageBucket: "PEGA_AQUI.appspot.com",
    messagingSenderId: "PEGA_AQUI",
    appId: "PEGA_AQUI"
  },

  // 2) Firebase Console → Configuración → Cloud Messaging → "Certificados push web" → Generar par de claves
  vapidKey: "PEGA_AQUI_LA_CLAVE_VAPID",

  // 3) Datos de Coordinación de Transporte
  coordinacion: {
    whatsapp: "5215500000000",          // 52 + 1 + 10 dígitos, sin espacios ni "+"
    telefono: "5500000000",             // 10 dígitos para la llamada
    correo:   "CAMBIA_ESTE_CORREO@bilbao.edu.mx"
  },

  // 4) ¿Las familias pueden crear su propia cuenta desde la app?
  //    false = solo entran cuentas que coordinación da de alta en Firebase Console.
  permitirRegistro: true
};
