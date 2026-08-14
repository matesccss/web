const CACHE_NAME = "mates-cache";

const ARCHIVOS_INICIALES = [
    "./",
    "./index.html",
    "./manifest.json",
    "./styles.css"
];


/* =========================================================
   INSTALACIÓN
========================================================= */

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ARCHIVOS_INICIALES))

    );

    /* Activar inmediatamente la nueva versión */
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

    );

    /* Controlar inmediatamente las páginas abiertas */
    self.clients.claim();

});


/* =========================================================
   PETICIONES
========================================================= */

self.addEventListener("fetch", event => {

    /* Solo GET */
    if (event.request.method !== "GET") {
        return;
    }


    /* No controlar peticiones externas */
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }


    event.respondWith(

        fetch(event.request)

            .then(response => {

                /* Guardar la versión nueva */

                const copia = response.clone();

                caches.open(CACHE_NAME)
                    .then(cache => {

                        cache.put(
                            event.request,
                            copia
                        );

                    });

                /* Mostrar SIEMPRE la versión de Internet */
                return response;

            })

            .catch(() => {

                /* Si no hay Internet,
                   utilizar la versión guardada */

                return caches.match(event.request);

            })

    );

});
