const CACHE_NAME = 'omla-v1';
const assets = [
  './',
  './index.html',
  './script.js',
  './manifest.json'
];

// تثبيت الـ Service Worker وتخزين الملفات
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// جلب الملفات من الكاش لتسريع الأداء
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});
