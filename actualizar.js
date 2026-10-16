/* =========================================================
   AUTO-ACTUALIZACIÓN
   ---------------------------------------------------------
   Se incluye en TODAS las páginas. Hace que cada alumno
   (móvil, tablet u ordenador, con o sin la app instalada)
   vea siempre la última versión que hay en GitHub.

   - Al abrir la página
   - Al volver a ella con el botón "atrás"
   - Al volver a una pestaña que llevaba tiempo abierta

   compara los enlaces de la página con los del servidor.
   Si alguno ha cambiado, recarga la página sola.
========================================================= */

(function () {

    var script = document.currentScript;
    var raiz = script ? new URL(".", script.src).href : "/";


    /* ---------- 1. Service Worker siempre al día ---------- */

    if ("serviceWorker" in navigator) {

        navigator.serviceWorker
            .register(raiz + "service-worker.js", { updateViaCache: "none" })
            .then(function (reg) { reg.update(); })
            .catch(function () {});

    }


    /* ---------- 2. ¿Está la página desactualizada? ---------- */

    function enlaces(doc) {

        var lista = [];

        doc.querySelectorAll("a[href], iframe[src]").forEach(function (el) {

            var valor = el.getAttribute("href") || el.getAttribute("src");

            if (valor && valor.indexOf("http") === 0) {
                lista.push(valor.trim());
            }

        });

        return lista;

    }


    var comprobando = false;
    var ultimaComprobacion = 0;

    function comprobar() {

        var ahora = Date.now();

        if (comprobando || ahora - ultimaComprobacion < 30000) return;

        comprobando = true;
        ultimaComprobacion = ahora;

        var url = location.href.split("#")[0];

        fetch(url, { cache: "no-store" })
            .then(function (r) { return r.ok ? r.text() : null; })
            .then(function (html) {

                if (!html) return;

                var nuevo = new DOMParser().parseFromString(html, "text/html");

                var actuales = enlaces(document);
                var delServidor = enlaces(nuevo);

                var titulo = (nuevo.title || "").trim();

                var cambiado =
                    (titulo && titulo !== document.title.trim()) ||
                    delServidor.some(function (e) {
                        return actuales.indexOf(e) === -1;
                    });

                if (cambiado) recargar(url);

            })
            .catch(function () {})
            .then(function () { comprobando = false; });

    }


    function recargar(url) {

        /* Evitar bucles: como mucho una recarga por minuto */

        var clave = "recarga:" + url;

        try {
            var antes = Number(sessionStorage.getItem(clave) || 0);
            if (Date.now() - antes < 60000) return;
            sessionStorage.setItem(clave, String(Date.now()));
        } catch (e) {}

        /* Refrescar la copia guardada del navegador y recargar */

        fetch(url, { cache: "reload" })
            .catch(function () {})
            .then(function () { location.reload(); });

    }


    /* ---------- 3. Cuándo comprobar ---------- */

    // Al abrir
    comprobar();

    // Al volver con "atrás" (el navegador muestra una copia guardada)
    window.addEventListener("pageshow", function (e) {
        if (e.persisted) { ultimaComprobacion = 0; comprobar(); }
    });

    // Al volver a una pestaña o app que estaba en segundo plano
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") comprobar();
    });

})();
