const CACHE_NAME = 'orian-ess-v1';
const urlsToCache = [
  '/',
  '/ess',
  '/ess/profile',
  '/ess/attendance',
  '/ess/leave',
  '/ess/documents',
  '/ess/payslips',
  '/m/scan',
  '/m/confirm',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
