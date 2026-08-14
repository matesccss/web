const CACHE_NAME = "mates-cache-v2";


/* =========================================================
   INSTALACIÓN
========================================================= */

self.addEventListener("install", event => {

    console.log("🆕 Instalando nueva versión del Service Worker");

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

                console.log("✅ Nueva versión activada");

                return self.clients.claim();

            })

    );

});


/* =========================================================
   PETICIONES
========================================================= */

self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {
        return;
    }


    /* No interceptar webs externas */

    if (
        !event.request.url.startsWith(
            self.location.origin
        )
    ) {

        return;

    }


    /*
       HTML
       -----------------------------------------------
       SIEMPRE intentamos obtener la versión actual
       de GitHub Pages.
    */

    if (
        event.request.destination === "document" ||
        event.request.url.endsWith(".html")
    ) {

        event.respondWith(

            fetch(
                new Request(
                    event.request,
                    {
                        cache: "no-store"
                    }
                )
            )

            .then(response => {

                return response;

            })

            .catch(() => {

                return caches.match(event.request);

            })

        );

        return;

    }


    /*
       CSS / JS / IMÁGENES / OTROS
       -----------------------------------------------
       Primero Internet.
       Si falla, usamos caché.
    */

    event.respondWith(

        fetch(
            new Request(
                event.request,
                {
                    cache: "no-store"
                }
            )
        )

        .then(response => {

            const copia =
                response.clone();


            caches.open(CACHE_NAME)
                .then(cache => {

                    cache.put(
                        event.request,
                        copia
                    );

                });


            return response;

        })

        .catch(() => {

            return caches.match(
                event.request
            );

        })

    );

});