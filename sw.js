// Mude este número sempre que atualizar os arquivos
const VERSION = '1.4';
const CACHE = 'financas-v' + VERSION;

const ASSETS = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
];

// Instala e cacheia
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  // Força ativação imediata sem esperar fechar a aba
  self.skipWaiting();
});

// Remove caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('[SW] Deletando cache antigo:', k);
        return caches.delete(k);
      }))
    )
  );
  // Assume controle imediato de todas as abas
  self.clients.claim();
});

// Network-first: tenta a rede primeiro, cai pro cache se offline
self.addEventListener('fetch', e => {
  // Ignora requests que não sejam GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Atualiza o cache com a versão mais recente
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => {
        // Offline: usa o cache
        return caches.match(e.request).then(r => r || caches.match('./app.html'));
      })
  );
});

// Recebe mensagem para forçar update
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
