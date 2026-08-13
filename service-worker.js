/* =========================================================
   SERVICE WORKER
========================================================= */

const CACHE_NAME = "mates-cache";


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
            .then(cache => cache.addAll(ARCHIVOS))

    );

    self.skipWaiting();

});


/* =========================================================
   ACTIVACIÓN
========================================================= */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(cachesExistentes => {

                return Promise.all(

                    cachesExistentes
                        .filter(nombre => nombre !== CACHE_NAME)
                        .map(nombre => caches.delete(nombre))

                );

            })

            .then(() => self.clients.claim())

    );

});


/* =========================================================
   PETICIONES
========================================================= */

self.addEventListener("fetch", event => {

    /*
     * Para navegación y archivos de la web:
     * intentar siempre obtener la versión actual.
     */

    event.respondWith(

        fetch(event.request)

            .then(response => {

                /*
                 * Guardamos una copia actualizada.
                 */

                if (
                    response &&
                    response.status === 200 &&
                    response.type === "basic"
                ) {

                    const copia = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(
                                event.request,
                                copia
                            );
                        });

                }

                return response;

            })

            .catch(() => {

                /*
                 * Sin conexión:
                 * utilizar la versión guardada.
                 */

                return caches.match(event.request);

            })

    );

});