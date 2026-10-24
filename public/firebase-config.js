/* ============================================================
   CONFIGURACIÓN — es el único archivo que necesitas llenar.
   (Lo usan index.html, coordinacion.html y el service worker.)
   ============================================================ */
self.APP_CONFIG = {
  // 1) Firebase Console → Configuración del proyecto → Tus apps → App web → "Configuración del SDK"
  firebase: {
    apiKey: "AIzaSyD8WMtoVUcdC0QVoVq_GZG05itp3j3ImH8",
    authDomain: "solicitudes-8f76b.firebaseapp.com",
    projectId: "solicitudes-8f76b",
    storageBucket: "solicitudes-8f76b.firebasestorage.app",
    messagingSenderId: "999724037789",
    appId: "1:999724037789:web:929b1496e708d3affb8674"
  },

  // 2) Firebase Console → Configuración → Cloud Messaging → "Certificados push web" → Generar par de claves
  vapidKey: "BL01GCJYKpLBB38QuCJiJESw2jlPhQucRdbXU0SCZHTbdI5JYtJ9JoM5quatVNyXQyyqapUyS_v_7SNZyjLsEUE",

  // 3) Datos de Coordinación de Transporte
  coordinacion: {
    whatsapp: "5215562550283",          // 52 + 1 + 10 dígitos, sin espacios ni "+"
    telefono: "5562550283",             // 10 dígitos para la llamada
    correo:   "miguel.santana.mon@bilbao.edu.mx"
  },

  // 4) ¿Las familias pueden crear su propia cuenta desde la app?
  //    false = solo entran cuentas que coordinación da de alta en Firebase Console.
  permitirRegistro: true
};
