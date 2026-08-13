/* =========================================================
   SERVICE WORKER
   ========================================================= */

const CACHE_NAME = "mates-v2";


const ARCHIVOS = [
    "./",
    "./index.html",
    "./manifest.json",
    "./styles.css",
    "./app.js"
];


/* =========================================================
   INSTALACIÓN
========================================================= */

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(ARCHIVOS);

            })

    );

    /* Activa inmediatamente la nueva versión */

    self.skipWaiting();

});


/* =========================================================
   ACTIVACIÓN
========================================================= */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(nombres => {

                return Promise.all(

                    nombres
                        .filter(nombre => nombre !== CACHE_NAME)
                        .map(nombre => caches.delete(nombre))

                );

            })

            .then(() => {

                /* Toma el control inmediatamente */

                return self.clients.claim();

            })

    );

});


/* =========================================================
   PETICIONES
========================================================= */

self.addEventListener("fetch", event => {

    event.respondWith(

        fetch(event.request)

            .then(response => {

                /*
                 * Si la respuesta es válida,
                 * devolvemos siempre la versión
                 * actualizada de Internet.
                 */

                return response;

            })

            .catch(() => {

                /*
                 * Si no hay conexión,
                 * utilizamos la caché.
                 */

                return caches.match(event.request);

            })

    );

});