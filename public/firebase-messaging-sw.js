/* Service worker: recibe los avisos push (Firebase Cloud Messaging) y guarda la app para abrir rápido. */
importScripts('https://cdn.jsdelivr.net/npm/firebase@10.14.1/firebase-app-compat.js');
importScripts('https://cdn.jsdelivr.net/npm/firebase@10.14.1/firebase-messaging-compat.js');
importScripts('./firebase-config.js');

firebase.initializeApp(self.APP_CONFIG.firebase);
// Los avisos llegan con "notification" + "fcmOptions.link": el SDK los muestra solo
// y al tocarlos abre la página indicada. No hace falta más código aquí.
firebase.messaging();

const CACHE = 'solicitudes-v3';   // súbele el número cuando publiques cambios
const ARCHIVOS = [
  './', './index.html', './coordinacion.html', './styles.css', './common.js',
  './firebase-config.js', './manifest.json', './manifest-coordinacion.json',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Red primero (siempre la versión más nueva); si no hay internet, usa la copia guardada.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
