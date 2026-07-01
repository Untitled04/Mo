/* دفتر الديون — Service Worker
   يخزّن التطبيق وملفاته ليعمل بدون إنترنت بعد أول فتح */

const CACHE = 'daftar-v1';

// الملفات الأساسية التي نملكها (مسارات نسبية لتعمل داخل مجلد GitHub Pages)
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './favicon.png'
];

// التثبيت: خزّن الملفات الأساسية (allSettled حتى لا يفشل الكل إذا نقص ملف)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(CORE.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

// التفعيل: احذف النسخ القديمة من الكاش
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// الجلب: من الكاش أولاً، وإلا من الشبكة مع تخزين نسخة (يشمل ملفات CDN)
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => {
        // عند انقطاع الإنترنت: أعِد الصفحة الرئيسية لأي تنقّل
        if (req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
