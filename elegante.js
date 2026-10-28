/* =========================================================
   ESTILO ELEGANTE · comportamiento común
   ---------------------------------------------------------
   1. Marca la página (curso, tipo) y el modo claro/noche.
   2. Menú: botón ☰ en el móvil y desplegables con un toque.
   3. Pie de página siempre abajo y en todas las páginas.
   4. Efectos: foco de luz en tarjetas, aparición suave,
      curva de Gauss en la portada, botón "volver arriba".
   5. Próximos exámenes en la portada (lee las fechas que
      ya pone cada tema: "Fecha: 11 de noviembre de 2026…").
   6. Buscador de temas y vídeos (botón 🔍, Ctrl+K o "/").

   No hace falta tocar nada aquí al añadir temas o vídeos:
   todo se lee de menu.html y de las propias páginas.
========================================================= */

(function () {

    var html = document.documentElement;
    var ruta = decodeURIComponent(location.pathname).toLowerCase();
    var script = document.currentScript;
    var raiz = script ? new URL(".", script.src).href : new URL("/", location.href).href;

    function guardar(clave, valor) {
        try { localStorage.setItem(clave, valor); } catch (e) {}
    }

    function leer(clave) {
        try { return localStorage.getItem(clave); } catch (e) { return null; }
    }


    /* =====================================================
       1. TIPO DE PÁGINA Y MODO CLARO / NOCHE
    ===================================================== */

    if (/\/ccss1\//.test(ruta)) html.setAttribute("data-curso", "1");
    if (/\/ccss2\//.test(ruta)) html.setAttribute("data-curso", "2");

    var pagina = "interior";
    if (/(\/|index\.html)$/.test(ruta) && !/\/(ccss1|ccss2|calculadoras|juegos)\//.test(ruta)) pagina = "inicio";
    else if (/\/calculadoras\//.test(ruta)) pagina = "calculadora";
    else if (/\/juegos\//.test(ruta)) pagina = "juego";
    else if (/cumpleanos\.html$/.test(ruta)) pagina = "cumpleanos";
    html.setAttribute("data-pagina", pagina);

    /* Páginas con cabecera grande (banda oscura bajo el menú) */
    if (pagina !== "juego" && !/interactivos/.test(ruta)) {
        html.setAttribute("data-cabecera", "si");
    }

    function aplicarTema(tema) {
        html.setAttribute("data-tema", tema);
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", tema === "noche" ? "#0b0d17" : "#f4f4f7");
    }

    /* Modo día por defecto. Si el alumno pulsa el botón ☀/☾,
       se respeta su elección en ese dispositivo. */
    aplicarTema(leer("tema-web") === "noche" ? "noche" : "claro");

    var movimientoReducido =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* =====================================================
       2. MENÚ Y BOTONES (delegados: funcionan aunque el
          menú se cargue después)
    ===================================================== */

    document.addEventListener("click", function (e) {

        var botonTema = e.target.closest(".menu-tema");
        if (botonTema) {
            var nuevo = html.getAttribute("data-tema") === "noche" ? "claro" : "noche";
            aplicarTema(nuevo);
            guardar("tema-web", nuevo);
            return;
        }

        if (e.target.closest(".menu-favs")) { abrirFavsVentana(); return; }
        if (e.target.closest(".menu-ajustes")) { abrirAjustes(); return; }

        if (e.target.closest(".menu-buscar, .abrir-buscador")) {
            abrirBuscador();
            return;
        }

        var toggle = e.target.closest(".menu-toggle");
        if (toggle) {
            var menu = toggle.closest(".menu");
            var abierto = menu.classList.toggle("abierto");
            toggle.setAttribute("aria-expanded", abierto ? "true" : "false");
            return;
        }

        var boton = e.target.closest(".dropdown-btn");
        var todos = document.querySelectorAll(".menu-dropdown");

        if (boton) {
            var actual = boton.closest(".menu-dropdown");
            todos.forEach(function (d) {
                if (d !== actual) d.classList.remove("abierto");
            });
            actual.classList.toggle("abierto");
            return;
        }

        if (!e.target.closest(".menu-dropdown")) {
            todos.forEach(function (d) { d.classList.remove("abierto"); });
        }

    });

    document.addEventListener("keydown", function (e) {

        var escribiendo = /input|textarea|select/i.test((e.target.tagName || "")) || e.target.isContentEditable;

        if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
            e.preventDefault();
            abrirBuscador();
            return;
        }

        if (e.key === "/" && !escribiendo && pagina !== "juego") {
            e.preventDefault();
            abrirBuscador();
            return;
        }

        if (e.key === "Escape") {
            document.querySelectorAll(".menu.abierto, .menu-dropdown.abierto")
                .forEach(function (el) { el.classList.remove("abierto"); });
        }

    });


    /* =====================================================
       3. PIE DE PÁGINA
    ===================================================== */

    function ajustarPie() {
        var pie = document.getElementById("footer-container");
        if (!pie || !pie.firstElementChild) return;
        pie.style.marginTop = "";
        /* clientHeight no cambia cuando el móvil esconde la barra de
           direcciones; así no queda hueco bajo el pie */
        var alto = document.documentElement.clientHeight || window.innerHeight;
        var hueco = alto - (pie.getBoundingClientRect().bottom + window.scrollY);
        if (hueco > 0) {
            var base = parseFloat(getComputedStyle(pie).marginTop) || 0;
            pie.style.marginTop = (base + hueco) + "px";
        }
    }

    window.addEventListener("load", ajustarPie);
    window.addEventListener("resize", ajustarPie);
    document.addEventListener("toggle", ajustarPie, true);

    document.addEventListener("DOMContentLoaded", function () {

        if ("ResizeObserver" in window) {
            new ResizeObserver(function () { ajustarPie(); }).observe(document.body);
        }

        if (pagina === "juego") return;
        if (document.getElementById("footer-container")) return;
        if (!document.getElementById("menu-container")) return;

        var contenedor = document.createElement("div");
        contenedor.id = "footer-container";
        document.body.appendChild(contenedor);

        fetch(raiz + "footer.html", { cache: "no-store" })
            .then(function (r) { return r.text(); })
            .then(function (texto) { contenedor.innerHTML = texto; })
            .catch(function () {});

    });


    /* =====================================================
       4. EFECTOS
    ===================================================== */

    /* Foco de luz que sigue al ratón dentro de las tarjetas */

    var SELECTOR_FOCO =
        ".quick-card, .pau-card, .btn-tema, .board, .news-card, .video-section, " +
        ".aviso-examen, .curiosidades, .game-card, .b-tile, .tema, .recurso";

    document.addEventListener("pointermove", function (e) {
        var t = e.target.closest && e.target.closest(SELECTOR_FOCO);
        if (!t) return;
        var r = t.getBoundingClientRect();
        t.style.setProperty("--mx", (e.clientX - r.left) + "px");
        t.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });


    /* Aparición suave al hacer scroll */

    var SELECTOR_REVELAR =
        ".seccion-cab, .quick-card, .board-wrapper, .news-card, " +
        ".pau-card, .b-tile, .btn-tema, .aviso-examen, .curiosidades, " +
        ".video-section, .game-card, .tema";

    function prepararAparicion() {

        if (movimientoReducido || !("IntersectionObserver" in window)) return;

        var observador = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add("visible");
                    observador.unobserve(en.target);
                }
            });
        }, { rootMargin: "0px 0px -6% 0px" });

        var vistos = 0;

        document.querySelectorAll(SELECTOR_REVELAR).forEach(function (el) {
            if (el.classList.contains("revelar")) return;
            var hermanos = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
            el.style.transitionDelay = Math.min(hermanos, 8) * 45 + "ms";
            el.classList.add("revelar");
            observador.observe(el);
            vistos++;
        });

        /* Seguridad: si algo no se ha mostrado en 2,5 s, se muestra igual */
        if (vistos) {
            setTimeout(function () {
                document.querySelectorAll(".revelar:not(.visible)").forEach(function (el) {
                    var r = el.getBoundingClientRect();
                    if (r.top < window.innerHeight) el.classList.add("visible");
                });
            }, 2500);
        }
    }


    /* Curva de Gauss que se dibuja en la cabecera de la portada */

    function dibujarCurva() {

        var hero = document.querySelector(".hero-apple");
        if (!hero || hero.querySelector(".hero-curva")) return;

        var W = 1200, H = 260, base = 230, puntos = [], sombra = [];

        for (var i = 0; i <= 120; i++) {
            var x = i / 120 * W;
            var z = (x - W / 2) / 150;
            var y = base - Math.exp(-z * z / 2) * 190;
            puntos.push((i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1));
            if (x >= W / 2 - 150 && x <= W / 2 + 150) sombra.push(x.toFixed(1) + " " + y.toFixed(1));
        }

        var area = "M" + (W / 2 - 150) + " " + base + " L" + sombra.join(" L") + " L" + (W / 2 + 150) + " " + base + " Z";

        var ns = "http://www.w3.org/2000/svg";
        var svg = document.createElementNS(ns, "svg");
        svg.setAttribute("class", "hero-curva");
        svg.setAttribute("viewBox", "0 0 " + W + " " + H);
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("aria-hidden", "true");
        svg.innerHTML =
            '<defs><linearGradient id="hc-g" x1="0" x2="0" y1="0" y2="1">' +
            '<stop offset="0" stop-color="currentColor" stop-opacity=".28"/>' +
            '<stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>' +
            '<line class="hc-eje" x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '"/>' +
            '<path class="hc-area" d="' + area + '" fill="url(#hc-g)"/>' +
            '<path class="hc-linea" d="' + puntos.join(" ") + '" pathLength="1"/>' +
            '<line class="hc-media" x1="' + W / 2 + '" y1="' + (base - 190) + '" x2="' + W / 2 + '" y2="' + base + '"/>';

        hero.insertBefore(svg, hero.firstChild);
    }


    /* Botón "volver arriba" */

    function botonArriba() {

        if (pagina === "juego") return;

        var b = document.createElement("button");
        b.type = "button";
        b.className = "volver-arriba";
        b.setAttribute("aria-label", "Volver arriba");
        b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5l-7 7 1.4 1.4L11 8.8V20h2V8.8l4.6 4.6L19 12z"/></svg>';
        b.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: movimientoReducido ? "auto" : "smooth" });
        });
        document.body.appendChild(b);

        var visible = false;
        window.addEventListener("scroll", function () {
            var debe = window.scrollY > 700;
            if (debe !== visible) {
                visible = debe;
                b.classList.toggle("activo", debe);
            }
        }, { passive: true });
    }


    /* Abrir un apartado concreto al llegar desde el buscador (?abrir=3) */

    function abrirApartado() {
        var n = new URLSearchParams(location.search).get("abrir");
        if (n === null) return;
        var d = document.querySelectorAll("details")[Number(n)];
        if (!d) return;
        d.open = true;
        d.classList.add("destacado");
        setTimeout(function () {
            d.scrollIntoView({ behavior: movimientoReducido ? "auto" : "smooth", block: "start" });
        }, 250);
    }


    /* =====================================================
       5. DATOS: temas, fechas de examen y vídeos
          (se leen de menu.html y de cada página)
    ===================================================== */

    var MESES = {
        enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6,
        agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
    };

    function limpiar(t) {
        return (t || "").replace(/\s+/g, " ").trim();
    }

    function leerFecha(texto) {
        var m = /(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})(?:[^\d]+(\d{1,2})[:.](\d{2}))?/i.exec(texto || "");
        if (!m) return null;
        var mes = MESES[m[2].toLowerCase()];
        if (mes === undefined) return null;
        return new Date(+m[3], mes, +m[1], +(m[4] || 9), +(m[5] || 0)).getTime();
    }

    function pedirUnaVez(url) {
        return fetch(url, { cache: "no-cache" })
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
            .then(function (t) { return new DOMParser().parseFromString(t, "text/html"); });
    }

    /* Si falla (red lenta, la app actualizándose…), lo vuelve a intentar dos veces */
    function pedir(url) {
        return pedirUnaVez(url).catch(function () {
            return new Promise(function (ok) { setTimeout(ok, 500); }).then(function () { return pedirUnaVez(url); });
        }).catch(function () {
            return new Promise(function (ok) { setTimeout(ok, 1500); }).then(function () { return pedirUnaVez(url); });
        });
    }

    var promesaTemas = null;

    function cargarTemas() {

        if (promesaTemas) return promesaTemas;

        try {
            var guardado = JSON.parse(sessionStorage.getItem("indice-web") || "null");
            if (guardado && Date.now() - guardado.t < 10 * 60 * 1000) {
                promesaTemas = Promise.resolve(guardado.datos);
                return promesaTemas;
            }
        } catch (e) {}

        var incompleto = false;

        promesaTemas = pedir(raiz + "menu.html").then(function (menu) {

            var temas = [];

            menu.querySelectorAll(".menu-dropdown").forEach(function (dd, i) {
                dd.querySelectorAll(".dropdown-content a").forEach(function (a) {
                    if (/display\s*:\s*none/i.test(a.getAttribute("style") || "")) return;
                    temas.push({
                        curso: i + 1,
                        url: new URL(a.getAttribute("href"), raiz).href,
                        nombre: limpiar(a.textContent)
                    });
                });
            });

            return Promise.all(temas.map(function (t) {
                return pedir(t.url).then(function (doc) {
                    var h1 = doc.querySelector(".tema-header h1, h1");
                    var aviso = doc.querySelector(".aviso-examen");
                    t.titulo = limpiar(h1 && h1.textContent) || t.nombre;
                    t.fecha = aviso ? leerFecha(aviso.textContent) : null;
                    t.recursos = [];
                    doc.querySelectorAll("a.btn-tema").forEach(function (a) {
                        var href = a.getAttribute("href") || "";
                        var tit = limpiar((a.querySelector(".titulo") || a).textContent);
                        if (!href || /btn-deshabilitado/.test(a.className)) return;
                        var subEl = a.querySelector(".subtitulo"), icEl = a.querySelector(".icono");
                        t.recursos.push({ titulo: tit, url: new URL(href, t.url).href,
                            sub: limpiar(subEl && subEl.textContent), ic: limpiar(icEl && icEl.textContent),
                            fuera: a.getAttribute("target") === "_blank" });
                    });
                    return t;
                }).catch(function () { incompleto = true; t.titulo = t.nombre; t.fecha = null; t.recursos = []; return t; });
            }));

        }).then(function (temas) {

            /* Vídeos: apartados de las páginas de vídeos de cada tema */
            var paginas = [];
            temas.forEach(function (t) {
                t.recursos.forEach(function (r) {
                    if (/videosyoutube|videospropios/.test(r.url)) paginas.push({ tema: t, r: r });
                });
            });

            ["calculadoras/calculadora570.html", "calculadoras/calculadora991.html", "calculadoras/calculadoraclasswiz.html"]
                .forEach(function (c) { paginas.push({ tema: null, r: { titulo: "Calculadora", url: raiz + c } }); });

            return Promise.all(paginas.map(function (p) {
                return pedir(p.r.url).then(function (doc) {
                    var h1 = doc.querySelector("h1");
                    p.titulo = limpiar(h1 && h1.textContent);
                    p.apartados = [];
                    doc.querySelectorAll("details").forEach(function (d, i) {
                        var s = d.querySelector("summary");
                        if (s) p.apartados.push({ texto: limpiar(s.textContent), i: i });
                    });
                    return p;
                }).catch(function () { incompleto = true; p.apartados = []; return p; });
            })).then(function (paginasVideo) {

                /* incompleto = alguna página no se pudo leer: sirve para mostrar,
                   pero no para comparar novedades ni para guardarlo */
                var datos = { temas: temas, videos: [], incompleto: incompleto };

                paginasVideo.forEach(function (p) {
                    p.apartados.forEach(function (a) {
                        datos.videos.push({
                            texto: a.texto,
                            donde: p.tema
                                ? (p.tema.curso + ".º · " + p.tema.titulo.replace(/^Tema\s+(\d+)\s*:?/i, "T$1 ·") + " · " + p.r.titulo)
                                : (p.titulo || "Calculadora"),
                            url: p.r.url + "?abrir=" + a.i,
                            tipo: p.tema ? "video" : "calc"
                        });
                    });
                });

                if (!incompleto) {
                    try { sessionStorage.setItem("indice-web", JSON.stringify({ t: Date.now(), datos: datos })); } catch (e) {}
                } else {
                    promesaTemas = null;   /* la próxima vez se vuelve a intentar */
                }

                return datos;
            });
        });

        return promesaTemas;
    }


    /* =====================================================
       5b. PRÓXIMOS EXÁMENES (portada)
    ===================================================== */

    var FORMATO_FECHA = { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" };

    function proximosExamenes() {

        var caja = document.getElementById("proximos-examenes");
        if (!caja) return;

        cargarTemas().then(function (datos) {

            var ahora = Date.now();
            var html = "";

            [1, 2].forEach(function (curso) {

                var futuros = datos.temas
                    .filter(function (t) { return t.curso === curso && t.fecha && t.fecha > ahora; })
                    .sort(function (a, b) { return a.fecha - b.fecha; });

                var t = futuros[0];

                html += '<article class="examen-prox" data-curso-card="' + curso + '">' +
                    '<p class="ep-curso">' + curso + '.º Bachillerato · CCSS ' + (curso === 1 ? "I" : "II") + '</p>';

                if (t) {
                    html +=
                        '<h3 class="ep-titulo"><a href="' + t.url + '">' + t.titulo + '</a></h3>' +
                        '<p class="ep-fecha">' + new Date(t.fecha).toLocaleString("es-ES", FORMATO_FECHA) + ' h</p>' +
                        '<div class="ep-cuenta" data-fecha="' + t.fecha + '">' +
                        '<div><strong>--</strong><small>días</small></div>' +
                        '<div><strong>--</strong><small>horas</small></div>' +
                        '<div><strong>--</strong><small>min</small></div>' +
                        '<div><strong>--</strong><small>seg</small></div>' +
                        '</div>' +
                        (futuros[1] ? '<p class="ep-siguiente">Después: ' + futuros[1].titulo.replace(/^Tema\s+\d+\s*:\s*/i, "") + ' · ' +
                            new Date(futuros[1].fecha).toLocaleDateString("es-ES", { day: "numeric", month: "long" }) + '</p>' : "");
                } else {
                    html +=
                        '<h3 class="ep-titulo ep-vacio">Sin exámenes programados</h3>' +
                        '<p class="ep-fecha">Cuando haya una fecha nueva aparecerá aquí automáticamente.</p>';
                }

                html += '</article>';
            });

            caja.innerHTML = html;
            caja.classList.add("cargado");
            actualizarCuentas();

        }).catch(function () {
            caja.closest(".proximos") && (caja.closest(".proximos").style.display = "none");
        });
    }

    function dosCifras(n) { return (n < 10 ? "0" : "") + n; }

    function actualizarCuentas() {
        document.querySelectorAll(".ep-cuenta").forEach(function (c) {
            var falta = Math.max(0, +c.getAttribute("data-fecha") - Date.now());
            var s = Math.floor(falta / 1000);
            var v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
            c.querySelectorAll("strong").forEach(function (el, i) {
                var txt = i === 0 ? String(v[0]) : dosCifras(v[i]);
                if (el.textContent !== txt) el.textContent = txt;
            });
            c.classList.toggle("urgente", falta < 3 * 86400000);
        });
    }

    setInterval(actualizarCuentas, 1000);


    /* =====================================================
       6. BUSCADOR (Ctrl+K)
    ===================================================== */

    var buscador = null;

    function quitarTildes(t) {
        return (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    }

    function crearBuscador() {

        buscador = document.createElement("div");
        buscador.className = "buscador";
        buscador.setAttribute("role", "dialog");
        buscador.setAttribute("aria-modal", "true");
        buscador.setAttribute("aria-label", "Buscar en la web");
        buscador.innerHTML =
            '<div class="buscador-fondo"></div>' +
            '<div class="buscador-caja">' +
            '  <div class="buscador-campo">' +
            '    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2a8 8 0 016.32 12.9l5.39 5.4-1.41 1.4-5.4-5.39A8 8 0 1110 2zm0 2a6 6 0 100 12 6 6 0 000-12z"/></svg>' +
            '    <input type="search" placeholder="Busca un tema, un vídeo, «derivadas», «Bayes»…" autocomplete="off" spellcheck="false">' +
            '    <kbd>Esc</kbd>' +
            '    <button type="button" class="buscador-cerrar" aria-label="Cerrar el buscador">×</button>' +
            '  </div>' +
            '  <ul class="buscador-lista" role="listbox"></ul>' +
            '  <p class="buscador-pie"><span><kbd>↑</kbd><kbd>↓</kbd> moverse</span><span><kbd>Enter</kbd> abrir</span></p>' +
            '</div>';
        document.body.appendChild(buscador);

        var campo = buscador.querySelector("input");
        var lista = buscador.querySelector(".buscador-lista");
        var seleccion = 0;
        var resultados = [];

        function pintar() {
            if (!resultados.length) {
                lista.innerHTML = '<li class="buscador-nada">' +
                    (campo.value.trim() ? "No hay resultados para «" + campo.value.replace(/</g, "&lt;") + "»" : "Cargando…") + '</li>';
                return;
            }
            lista.innerHTML = resultados.map(function (r, i) {
                return '<li role="option" class="br-' + r.tipo + (i === seleccion ? " activo" : "") + '" data-i="' + i + '">' +
                    '<span class="br-icono"></span>' +
                    '<span class="br-texto"><strong>' + r.texto + '</strong><small>' + r.donde + '</small></span>' +
                    '<span class="br-ir">↵</span></li>';
            }).join("");
            var act = lista.querySelector(".activo");
            if (act) act.scrollIntoView({ block: "nearest" });
        }

        function buscar() {
            cargarTemas().then(function (datos) {

                var q = quitarTildes(campo.value.trim());
                var palabras = q.split(/\s+/).filter(Boolean);

                var todo = [];

                datos.temas.forEach(function (t) {
                    todo.push({ texto: t.titulo, donde: t.curso + ".º Bachillerato · Matemáticas CCSS " + (t.curso === 1 ? "I" : "II"), url: t.url, tipo: "tema" });
                });

                [
                    ["Exámenes del curso", "Pruebas realizadas y soluciones", "examenes.html"],
                    ["Juegos", "Modo juego", "juegos.html"],
                    ["Galería de Reels", "Instagram y TikTok", "reels.html"],
                    ["Cumpleaños", "Calendario de cumpleaños", "cumpleanos.html"]
                ].forEach(function (p) {
                    todo.push({ texto: p[0], donde: p[1], url: raiz + p[2], tipo: "pagina" });
                });

                todo = todo.concat(datos.videos);

                if (!palabras.length) {
                    resultados = todo.filter(function (r) { return r.tipo === "tema" || r.tipo === "pagina"; });
                } else {
                    resultados = todo.map(function (r) {
                        var a = quitarTildes(r.texto), b = quitarTildes(r.donde), puntos = 0;
                        for (var i = 0; i < palabras.length; i++) {
                            var p = palabras[i];
                            if (a.indexOf(p) === 0) puntos += 6;
                            else if (a.indexOf(" " + p) > -1) puntos += 4;
                            else if (a.indexOf(p) > -1) puntos += 3;
                            else if (b.indexOf(p) > -1) puntos += 1;
                            else return null;
                        }
                        if (r.tipo === "tema") puntos += 2;
                        return { r: r, p: puntos };
                    }).filter(Boolean).sort(function (x, y) { return y.p - x.p; })
                      .slice(0, 40).map(function (x) { return x.r; });
                }

                seleccion = 0;
                pintar();
            });
        }

        function ir(i) {
            var r = resultados[i];
            if (r) location.href = r.url;
        }

        campo.addEventListener("input", buscar);

        campo.addEventListener("keydown", function (e) {
            if (e.key === "ArrowDown") { e.preventDefault(); seleccion = Math.min(seleccion + 1, resultados.length - 1); pintar(); }
            else if (e.key === "ArrowUp") { e.preventDefault(); seleccion = Math.max(seleccion - 1, 0); pintar(); }
            else if (e.key === "Enter") { e.preventDefault(); ir(seleccion); }
            else if (e.key === "Escape") { cerrarBuscador(); }
        });

        lista.addEventListener("click", function (e) {
            var li = e.target.closest("li[data-i]");
            if (li) ir(+li.getAttribute("data-i"));
        });

        lista.addEventListener("mousemove", function (e) {
            var li = e.target.closest("li[data-i]");
            if (li && +li.getAttribute("data-i") !== seleccion) {
                seleccion = +li.getAttribute("data-i");
                lista.querySelectorAll(".activo").forEach(function (x) { x.classList.remove("activo"); });
                li.classList.add("activo");
            }
        });

        buscador.querySelector(".buscador-fondo").addEventListener("click", cerrarBuscador);
        buscador.querySelector(".buscador-cerrar").addEventListener("click", cerrarBuscador);

        buscador.buscar = buscar;
    }

    function abrirBuscador() {
        if (!buscador) crearBuscador();
        buscador.classList.add("abierto");
        document.documentElement.classList.add("sin-scroll");
        var campo = buscador.querySelector("input");
        campo.value = "";
        buscador.buscar();
        setTimeout(function () { campo.focus(); }, 30);
    }

    function cerrarBuscador() {
        if (!buscador) return;
        buscador.classList.remove("abierto");
        document.documentElement.classList.remove("sin-scroll");
        marcarPestana();
    }

    window.abrirBuscador = abrirBuscador;


    /* =====================================================
       7. PORTADA: saludo, racha, próximo examen, reto
          del día y calculadora de nota PAU
    ===================================================== */

    function hoyClave(d) {
        d = d || new Date();
        return d.getFullYear() + "-" + dosCifras(d.getMonth() + 1) + "-" + dosCifras(d.getDate());
    }

    function saludoYRacha() {

        var ahora = new Date();
        var h = ahora.getHours();
        var saludo = h < 6 ? "Buenas noches" : h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
        var fecha = ahora.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

        var el = document.getElementById("saludo");
        if (el) el.textContent = el.classList.contains("corto") ? saludo : saludo + " · " + fecha;

        var fh = document.getElementById("fecha-hoy");
        if (fh) fh.textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);

        /* Racha de días seguidos entrando en la web (solo en este dispositivo) */
        var racha = { dia: "", n: 0 };
        try { racha = JSON.parse(leer("racha-web") || "null") || racha; } catch (e) {}

        var hoy = hoyClave(ahora);
        var ayer = hoyClave(new Date(ahora.getTime() - 86400000));

        if (racha.dia !== hoy) {
            racha.n = racha.dia === ayer ? racha.n + 1 : 1;
            racha.dia = hoy;
            guardar("racha-web", JSON.stringify(racha));
        }

        var r = document.getElementById("racha");
        if (r && racha.n >= 2) {
            r.hidden = false;
            r.textContent = racha.n + " días seguidos";
            r.title = "Días seguidos que has entrado en la web desde este dispositivo";
        }
    }


    /* Próximo examen: solo el más cercano que esté en cuenta atrás */

    function proximoExamen() {

        var caja = document.getElementById("proximo-examen");
        var bento = document.getElementById("bento");
        if (!caja) return;

        cargarTemas().then(function (datos) {

            var ahora = Date.now();
            var futuros = datos.temas
                .filter(function (t) { return t.fecha && t.fecha > ahora; })
                .sort(function (a, b) { return a.fecha - b.fecha; });

            if (!futuros.length) {
                caja.hidden = true;
                if (bento) bento.classList.add("sin-examen");
                return;
            }

            var t = futuros[0];
            var sig = futuros[1];

            caja.setAttribute("data-curso-card", t.curso);
            caja.innerHTML =
                '<p class="b-etiqueta">Próximo examen · ' + t.curso + '.º Bach</p>' +
                '<h2 class="b-examen-titulo"><a href="' + t.url + '">' + t.titulo + '</a></h2>' +
                '<p class="b-examen-fecha">' + new Date(t.fecha).toLocaleString("es-ES", FORMATO_FECHA) + ' h</p>' +
                '<div class="ep-cuenta" data-fecha="' + t.fecha + '">' +
                '<div><strong>--</strong><small>días</small></div>' +
                '<div><strong>--</strong><small>horas</small></div>' +
                '<div><strong>--</strong><small>min</small></div>' +
                '<div><strong>--</strong><small>seg</small></div>' +
                '</div>' +
                (sig ? '<p class="b-examen-sig">Después: ' + sig.titulo.replace(/^Tema\s+\d+\s*:\s*/i, "") + ' · ' +
                    new Date(sig.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "long" }) + '</p>' : "");

            /* La cuenta atrás se muestra en la sección «Ahora», no en la cabecera */
            caja.hidden = true;

            var ir = document.getElementById("hero-ir");
            if (ir) {
                ir.href = t.url;
                ir.firstElementChild.textContent = "Preparar el examen";
            }
            if (bento) bento.classList.remove("sin-examen");
            actualizarCuentas();

        }).catch(function () {
            caja.hidden = true;
            if (bento) bento.classList.add("sin-examen");
        });
    }


    /* Reto del día: una pregunta distinta cada día */

    var RETOS = [
        ["Si A es una matriz 2×3 y B es 3×4, ¿qué dimensión tiene A·B?", ["3×3", "2×4", "4×2", "No se pueden multiplicar"], 1,
         "Se multiplican filas de A por columnas de B: el resultado tiene las filas de A (2) y las columnas de B (4)."],
        ["¿Cuánto vale el determinante de la matriz (2 1 / 4 3)?", ["2", "10", "−2", "6"], 0,
         "2·3 − 1·4 = 6 − 4 = 2."],
        ["Una matriz cuadrada A tiene inversa si y solo si…", ["Es simétrica", "Su determinante es distinto de 0", "Tiene algún cero", "Su determinante es 1"], 1,
         "A es invertible ⇔ |A| ≠ 0. Si |A| = 0, la matriz es singular."],
        ["¿A qué es igual (A·B)ᵗ?", ["Aᵗ·Bᵗ", "Bᵗ·Aᵗ", "A·B", "(B·A)⁻¹"], 1,
         "La traspuesta de un producto invierte el orden: (A·B)ᵗ = Bᵗ·Aᵗ."],
        ["Un sistema con 3 incógnitas tiene rg(A) = rg(A*) = 2. ¿Cómo es?", ["Incompatible", "Compatible determinado", "Compatible indeterminado", "No se puede saber"], 2,
         "Por Rouché-Frobenius: rangos iguales ⇒ compatible; como 2 < 3 incógnitas, tiene infinitas soluciones."],
        ["En programación lineal, si la región factible está acotada, el óptimo se alcanza…", ["En el centro de la región", "En algún vértice de la región", "Siempre en el origen", "Fuera de la región"], 1,
         "La función objetivo alcanza su máximo y su mínimo en vértices de la región factible (o en todo un lado entre dos vértices)."],
        ["A y B son independientes, con P(A) = 0,5 y P(B) = 0,4. ¿Cuánto vale P(A∩B)?", ["0,9", "0,1", "0,2", "0,45"], 2,
         "Si son independientes, P(A∩B) = P(A)·P(B) = 0,5·0,4 = 0,2."],
        ["P(A) = 0,5, P(B) = 0,4 y P(A∩B) = 0,1. ¿Cuánto vale P(A∪B)?", ["0,9", "0,8", "1", "0,7"], 1,
         "P(A∪B) = P(A) + P(B) − P(A∩B) = 0,5 + 0,4 − 0,1 = 0,8."],
        ["¿Para qué sirve el teorema de Bayes?", ["Para sumar probabilidades incompatibles", "Para calcular la probabilidad de una causa sabiendo el resultado", "Para tipificar una normal", "Para calcular combinaciones"], 1,
         "Bayes calcula probabilidades «a posteriori»: P(causa | resultado observado)."],
        ["Si Z sigue una N(0, 1), ¿cuánto vale P(Z ≤ 0)?", ["0", "0,5", "1", "0,8413"], 1,
         "La normal es simétrica respecto de su media, 0: deja la mitad de la probabilidad a cada lado."],
        ["Lanzas una moneda dos veces. ¿Probabilidad de obtener al menos una cara?", ["1/2", "1/4", "3/4", "2/3"], 2,
         "Por el contrario: 1 − P(ninguna cara) = 1 − 1/4 = 3/4."],
        ["En una población N(μ, σ), la media muestral de muestras de tamaño n sigue…", ["N(μ, σ)", "N(μ, σ/√n)", "N(μ/n, σ)", "N(0, 1)"], 1,
         "La media muestral tiene la misma media μ y una desviación típica menor: σ/√n."],
        ["Con el mismo nivel de confianza, si aumentamos el tamaño de la muestra, el error máximo…", ["Aumenta", "Disminuye", "No cambia", "Se duplica"], 1,
         "E = z·σ/√n: al crecer n, el denominador crece y el error disminuye."],
        ["¿Qué valor crítico z(α/2) corresponde a un nivel de confianza del 95 %?", ["1,645", "1,96", "2,575", "0,95"], 1,
         "Con 95 % de confianza, α = 0,05 y deja 0,025 en cada cola: z = 1,96."],
        ["¿Cuánto vale el límite cuando x → ∞ de (3x² + 1)/(x² − 5)?", ["0", "∞", "3", "−1/5"], 2,
         "Mismo grado arriba y abajo: el límite es el cociente de los coeficientes principales, 3/1 = 3."],
        ["¿Cuál es la derivada de f(x) = x³?", ["3x²", "x²", "3x³", "x⁴/4"], 0,
         "Regla de la potencia: (xⁿ)' = n·xⁿ⁻¹, así que (x³)' = 3x²."],
        ["Si f'(a) = 0 y f''(a) > 0, en x = a la función tiene…", ["Un máximo relativo", "Un mínimo relativo", "Un punto de inflexión", "Una asíntota"], 1,
         "Derivada nula y segunda derivada positiva (curva cóncava hacia arriba): mínimo relativo."],
        ["¿Qué asíntota vertical tiene f(x) = 1/(x − 2)?", ["x = 0", "y = 2", "x = 2", "No tiene"], 2,
         "El denominador se anula en x = 2 y el numerador no: ahí la función tiende a ±∞."],
        ["¿Cuánto vale ∫ 2x dx?", ["2", "x² + C", "2x² + C", "x + C"], 1,
         "Una primitiva de 2x es x², porque (x²)' = 2x. No olvides la constante C."],
        ["¿Cuál es el área bajo f(x) = x entre x = 0 y x = 2?", ["1", "2", "4", "8"], 1,
         "∫₀² x dx = [x²/2]₀² = 4/2 − 0 = 2. Es un triángulo de base 2 y altura 2."],
        ["¿Cuál es la derivada de f(x) = e²ˣ?", ["e²ˣ", "2e²ˣ", "2x·e²ˣ", "e²ˣ/2"], 1,
         "Regla de la cadena: (eᵘ)' = u'·eᵘ, con u = 2x y u' = 2."],
        ["f es continua en [a, b] y f(a)·f(b) < 0. ¿Qué asegura el teorema de Bolzano?", ["Que f es derivable", "Que f tiene un máximo", "Que existe c en (a, b) con f(c) = 0", "Que f es creciente"], 2,
         "Si cambia de signo y es continua, la gráfica tiene que cortar al eje X entre a y b."],
        ["¿En qué valor de x tiene un mínimo f(x) = x² − 4x?", ["x = 0", "x = 4", "x = 2", "x = −2"], 2,
         "f'(x) = 2x − 4 = 0 ⇒ x = 2, y f''(x) = 2 > 0: es un mínimo (el vértice de la parábola)."],
        ["¿Cuál es la inversa de la matriz (1 0 / 0 2)?", ["(1 0 / 0 2)", "(1 0 / 0 1/2)", "(−1 0 / 0 −2)", "(0 1 / 2 0)"], 1,
         "Para una matriz diagonal, la inversa tiene en la diagonal los inversos: 1 y 1/2."]
    ];

    function retoDelDia() {

        var caja = document.getElementById("reto-dia");
        if (!caja) return;

        var hoy = new Date();
        var n = Math.floor((Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - Date.UTC(2026, 0, 1)) / 86400000);
        var reto = RETOS[((n % RETOS.length) + RETOS.length) % RETOS.length];
        var clave = hoyClave(hoy);

        var estado = {};
        try { estado = JSON.parse(leer("reto-web") || "{}") || {}; } catch (e) {}

        caja.innerHTML =
            '<p class="b-etiqueta">Reto del día <span class="reto-aciertos" hidden></span></p>' +
            '<p class="reto-pregunta"></p>' +
            '<div class="reto-opciones"></div>' +
            '<p class="reto-explicacion" hidden></p>';

        caja.querySelector(".reto-pregunta").textContent = reto[0];

        var opciones = caja.querySelector(".reto-opciones");
        reto[1].forEach(function (texto, i) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "reto-opcion";
            b.innerHTML = '<span class="reto-letra">' + "ABCD"[i] + '</span><span></span>';
            b.lastChild.textContent = texto;
            b.addEventListener("click", function () { responder(i, true); });
            opciones.appendChild(b);
        });

        function pintarAciertos() {
            var a = caja.querySelector(".reto-aciertos");
            if (estado.aciertos > 0) {
                a.hidden = false;
                a.textContent = "· " + estado.aciertos + (estado.aciertos === 1 ? " acierto" : " aciertos");
            }
        }

        function responder(i, nuevo) {
            var botones = opciones.querySelectorAll(".reto-opcion");
            botones.forEach(function (b, j) {
                b.disabled = true;
                if (j === reto[2]) b.classList.add("correcta");
                else if (j === i) b.classList.add("fallo");
            });
            var acierto = i === reto[2];
            var exp = caja.querySelector(".reto-explicacion");
            exp.hidden = false;
            exp.innerHTML = '<strong>' + (acierto ? "¡Correcto!" : "Casi…") + '</strong> ';
            exp.appendChild(document.createTextNode(reto[3]));
            caja.classList.add(acierto ? "acertado" : "fallado");

            if (nuevo) {
                estado.aciertos = (estado.aciertos || 0) + (acierto ? 1 : 0);
                estado.dia = clave;
                estado.elegida = i;
                guardar("reto-web", JSON.stringify(estado));
                setTimeout(comprobarLogros, 900);
            }
            pintarAciertos();
        }

        pintarAciertos();
        if (estado.dia === clave && typeof estado.elegida === "number") responder(estado.elegida, false);
    }


    /* Calculadora de nota PAU (reglas de Andalucía) */

    var calculadora = null;

    function numero(v) {
        if (v === "" || v === null || v === undefined) return null;
        var n = parseFloat(String(v).replace(",", "."));
        return isNaN(n) ? null : Math.max(0, Math.min(10, n));
    }

    function f3(n) {
        return n.toLocaleString("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    }

    function crearCalculadora() {

        calculadora = document.createElement("div");
        calculadora.className = "buscador calc-pau";
        calculadora.setAttribute("role", "dialog");
        calculadora.setAttribute("aria-modal", "true");
        calculadora.setAttribute("aria-label", "Calculadora de nota PAU");

        function campo(id, etiqueta, extra) {
            return '<label class="cp-campo"><span>' + etiqueta + '</span>' +
                '<input id="' + id + '" type="text" inputmode="decimal" placeholder="0,00" autocomplete="off">' + (extra || "") + '</label>';
        }

        function peso(id, def) {
            return '<select id="' + id + '" aria-label="Ponderación">' +
                '<option value="0"' + (def === 0 ? " selected" : "") + '>No pondera</option>' +
                '<option value="0.1"' + (def === 0.1 ? " selected" : "") + '>× 0,1</option>' +
                '<option value="0.2"' + (def === 0.2 ? " selected" : "") + '>× 0,2</option></select>';
        }

        calculadora.innerHTML =
            '<div class="buscador-fondo"></div>' +
            '<div class="buscador-caja cp-caja">' +
            '<div class="cp-cabecera"><div><p class="b-etiqueta">PAU · Andalucía</p><h2>Calcula tu nota</h2></div>' +
            '<button type="button" class="cp-cerrar" aria-label="Cerrar">×</button></div>' +
            '<div class="cp-cuerpo">' +
            '<section><h3>1 · Bachillerato</h3>' + campo("cp-bach", "Nota media de Bachillerato") + '</section>' +
            '<section><h3>2 · Fase de acceso</h3><div class="cp-rejilla">' +
            campo("cp-lengua", "Lengua Castellana y Literatura II") +
            campo("cp-historia", "Historia de España o Filosofía") +
            campo("cp-idioma", "Lengua extranjera II") +
            campo("cp-mates", "Matemáticas Aplicadas a las CCSS II") +
            '</div></section>' +
            '<section><h3>3 · Fase de admisión <small>(opcional)</small></h3>' +
            '<p class="cp-ayuda">Cuentan como mucho las dos materias que más sumen, aprobadas con un 5 o más. Las ponderaciones de cada grado están en «Información PAU».</p>' +
            '<div class="cp-fila"><span>Matemáticas CCSS II (de la fase de acceso)</span>' + peso("cp-pm", 0.2) + '</div>' +
            '<div class="cp-fila">' + campo("cp-m1", "Otra materia") + peso("cp-p1", 0.2) + '</div>' +
            '<div class="cp-fila">' + campo("cp-m2", "Otra materia") + peso("cp-p2", 0.1) + '</div>' +
            '</section>' +
            '</div>' +
            '<div class="cp-resultado">' +
            '<div class="cp-nota"><small>Nota de acceso</small><strong id="cp-acceso">—</strong><span>sobre 10</span></div>' +
            '<div class="cp-nota cp-nota-adm"><small>Nota de admisión</small><strong id="cp-admision">—</strong><span>sobre 14</span></div>' +
            '<p class="cp-mensaje" id="cp-mensaje">Rellena tus notas para ver el resultado.</p>' +
            '</div>' +
            '<p class="cp-aviso">Cálculo orientativo: 60 % media de Bachillerato + 40 % fase de acceso (mínimo 4); la nota de acceso debe llegar a 5. Admisión: + hasta dos materias × 0,1 o 0,2.</p>' +
            '</div>';

        document.body.appendChild(calculadora);

        var ids = ["cp-bach", "cp-lengua", "cp-historia", "cp-idioma", "cp-mates", "cp-m1", "cp-m2", "cp-pm", "cp-p1", "cp-p2"];
        var guardado = {};
        try { guardado = JSON.parse(leer("calc-pau") || "{}") || {}; } catch (e) {}
        ids.forEach(function (id) {
            var el = calculadora.querySelector("#" + id);
            if (guardado[id] !== undefined) el.value = guardado[id];
            el.addEventListener("input", calcular);
            el.addEventListener("change", calcular);
        });

        function v(id) { return calculadora.querySelector("#" + id).value; }

        function calcular() {

            var datos = {};
            ids.forEach(function (id) { datos[id] = v(id); });
            guardar("calc-pau", JSON.stringify(datos));

            var bach = numero(v("cp-bach"));
            var ex = ["cp-lengua", "cp-historia", "cp-idioma", "cp-mates"].map(function (id) { return numero(v(id)); });
            var acc = calculadora.querySelector("#cp-acceso");
            var adm = calculadora.querySelector("#cp-admision");
            var msg = calculadora.querySelector("#cp-mensaje");
            var res = calculadora.querySelector(".cp-resultado");

            res.classList.remove("ok", "mal");

            if (bach === null || ex.some(function (n) { return n === null; })) {
                acc.textContent = "—";
                adm.textContent = "—";
                msg.textContent = "Rellena la media de Bachillerato y las cuatro notas de la fase de acceso.";
                return;
            }

            var fase = Math.round((ex[0] + ex[1] + ex[2] + ex[3]) / 4 * 1000) / 1000;
            var acceso = 0.6 * bach + 0.4 * fase;

            acc.textContent = f3(acceso);

            if (fase < 4) {
                adm.textContent = "—";
                msg.textContent = "La fase de acceso sale " + f3(fase) + ": necesitas al menos un 4 de media en los cuatro exámenes.";
                res.classList.add("mal");
                return;
            }

            if (acceso < 5) {
                adm.textContent = "—";
                msg.textContent = "La nota de acceso no llega a 5. Fase de acceso: " + f3(fase) + ".";
                res.classList.add("mal");
                return;
            }

            var candidatas = [
                { n: ex[3], p: +v("cp-pm") },
                { n: numero(v("cp-m1")), p: +v("cp-p1") },
                { n: numero(v("cp-m2")), p: +v("cp-p2") }
            ].filter(function (c) { return c.n !== null && c.n >= 5 && c.p > 0; })
             .map(function (c) { return c.n * c.p; })
             .sort(function (a, b) { return b - a; })
             .slice(0, 2);

            var extra = candidatas.reduce(function (s, x) { return s + x; }, 0);

            adm.textContent = f3(acceso + extra);
            msg.textContent = "¡Aprobada! Fase de acceso: " + f3(fase) +
                (extra > 0 ? " · La fase de admisión suma " + f3(extra) + " puntos." : " · Añade materias de admisión para subir hasta 14.");
            res.classList.add("ok");
        }

        calculadora.querySelector(".buscador-fondo").addEventListener("click", cerrarCalculadora);
        calculadora.querySelector(".cp-cerrar").addEventListener("click", cerrarCalculadora);
        calculadora.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarCalculadora(); });

        calcular();
    }

    function abrirCalculadora() {
        if (!calculadora) crearCalculadora();
        calculadora.classList.add("abierto");
        document.documentElement.classList.add("sin-scroll");
        setTimeout(function () { var c = calculadora.querySelector("input"); if (c && !c.value) c.focus(); }, 40);
    }

    function cerrarCalculadora() {
        if (!calculadora) return;
        calculadora.classList.remove("abierto");
        document.documentElement.classList.remove("sin-scroll");
    }


    /* =====================================================
       8. CABECERAS: menú transparente arriba, migas de pan,
          número gigante de fondo y la animación de la portada
    ===================================================== */

    /* El menú es transparente mientras estamos sobre la cabecera */
    function marcarArriba() {
        html.classList.toggle("arriba", window.scrollY < 24);
    }
    marcarArriba();
    window.addEventListener("scroll", marcarArriba, { passive: true });


    /* Cabeceras de temas, vídeos, calculadoras, exámenes, juegos y reels */
    function prepararCabeceras() {

        var cab = document.querySelector(".tema-header, .videos-header, .cabecera, .games-header, .reels-header, .cumple-cabecera");
        if (!cab || cab.classList.contains("banda")) return;
        cab.classList.add("banda");

        var curso = html.getAttribute("data-curso");
        var textoCurso = curso ? curso + ".º Bachillerato" : "";
        var num = "";

        var h1 = cab.querySelector("h1");
        var etiqueta = cab.querySelector(".videos-label");
        var origen = (etiqueta ? etiqueta.textContent : "") + " " + (h1 ? h1.textContent : "");
        var m = /tema\s*(\d+)/i.exec(origen);
        if (m) num = (m[1].length < 2 ? "0" : "") + m[1];

        if (pagina === "calculadora") num = "fx";
        if (num) cab.setAttribute("data-num", num);

        /* «Tema 1: Números reales» → «Tema 1» encima y «Números reales» grande */
        if (h1 && cab.classList.contains("tema-header")) {
            var t = h1.textContent.replace(/\s+/g, " ").trim();
            var partes = /^(Tema\s*\d+)\s*[:.·-]\s*(.+)$/i.exec(t);
            if (partes) {
                h1.innerHTML = '<span class="h1-pre"></span><span class="h1-txt"></span>';
                h1.firstChild.textContent = partes[1];
                h1.lastChild.textContent = partes[2];
            }
        }

        /* «Videos YouTube · Probabilidad» → «Tema 2 · Vídeos de YouTube» encima y «Probabilidad» grande */
        if (h1 && cab.classList.contains("videos-header") && h1.textContent.indexOf("·") > -1) {
            var trozosH1 = h1.textContent.replace(/\s+/g, " ").trim().split("·");
            var tipo = trozosH1.shift().trim().replace(/^Videos?\s+YouTube$/i, "Vídeos de YouTube").replace(/^Videos\b/i, "Vídeos");
            var resto = trozosH1.join("·").trim();
            h1.innerHTML = '<span class="h1-pre"></span><span class="h1-txt"></span>';
            h1.firstChild.textContent = (m ? "Tema " + m[1] + " · " : "") + tipo;
            h1.lastChild.textContent = resto;
            if (etiqueta) etiqueta.style.display = "none";
        }

        /* Migas de pan */
        var migas = document.createElement("nav");
        migas.className = "migas";
        migas.setAttribute("aria-label", "Estás aquí");

        var trozos = [['Inicio', raiz]];
        if (textoCurso) trozos.push([textoCurso + " · CCSS " + (curso === "1" ? "I" : "II"), null]);

        if (/videosyoutube|videospropios/.test(ruta) && m) {
            trozos.push(["Tema " + m[1], new URL("../tema" + m[1] + ".html", location.href).href]);
            trozos.push([/videospropios/.test(ruta) ? "Vídeos propios" : "Vídeos", null]);
        } else if (cab.classList.contains("tema-header") && m) {
            trozos.push(["Tema " + m[1], null]);
        } else if (pagina === "calculadora") {
            trozos.push(["Calculadoras", null]);
        } else if (/examenes\.html$/.test(ruta)) {
            trozos.push(["Exámenes del curso", null]);
        } else if (/juegos\.html$/.test(ruta)) {
            trozos.push(["Juegos", null]);
        } else if (/reels\.html$/.test(ruta)) {
            trozos.push(["Reels", null]);
        } else if (pagina === "cumpleanos") {
            trozos.push(["Cumpleaños", null]);
        }

        trozos.forEach(function (tr, i) {
            if (i) {
                var sep = document.createElement("span");
                sep.className = "migas-sep";
                sep.textContent = "/";
                migas.appendChild(sep);
            }
            var el = document.createElement(tr[1] && i < trozos.length - 1 ? "a" : "span");
            if (el.tagName === "A") el.href = tr[1];
            el.textContent = tr[0];
            migas.appendChild(el);
        });

        cab.insertBefore(migas, cab.firstChild);

        /* Que la banda empiece justo arriba del todo, debajo del menú,
           aunque la página tenga márgenes propios */
        function pegarArriba() {
            cab.style.marginTop = "";
            var arriba = cab.getBoundingClientRect().top + window.scrollY;
            if (Math.abs(arriba) > 1) {
                var actual = parseFloat(getComputedStyle(cab).marginTop) || 0;
                cab.style.marginTop = (actual - arriba) + "px";
            }
        }
        pegarArriba();
        window.addEventListener("load", pegarArriba);
        window.addEventListener("resize", pegarArriba);
    }


    /* ---------- La animación de la portada ---------- */

    function lienzoHero() {

        var lienzo = document.querySelector(".hero-lienzo");
        if (!lienzo || !lienzo.getContext) return;

        var hero = lienzo.parentElement;
        var ctx = lienzo.getContext("2d");
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var W = 0, H = 0, movil = false;
        var raton = null;
        var visible = true;
        var t0 = performance.now();

        var SIMBOLOS = ["∑", "∫", "π", "σ", "μ", "√", "Δ", "∞", "≈", "x̄", "P(A|B)", "eˣ", "f'(x)", "lím", "±", "≤", "n!", "∂"];
        var flotantes = [];
        var particulas = [];

        function preparar() {
            var r = hero.getBoundingClientRect();
            W = r.width;
            H = r.height;
            movil = W < 760;
            lienzo.width = Math.round(W * dpr);
            lienzo.height = Math.round(H * dpr);
            lienzo.style.width = W + "px";
            lienzo.style.height = H + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            flotantes = [];
            var n = movil ? 9 : 18;
            for (var i = 0; i < n; i++) {
                flotantes.push({
                    s: SIMBOLOS[i % SIMBOLOS.length],
                    x: Math.random() * W,
                    y: Math.random() * H,
                    v: 6 + Math.random() * 10,
                    a: .05 + Math.random() * .09,
                    t: 14 + Math.random() * 22,
                    f: Math.random() * Math.PI * 2
                });
            }

            particulas = [];
            var p = movil ? 26 : 54;
            for (var j = 0; j < p; j++) {
                particulas.push({ u: Math.random(), v: .02 + Math.random() * .05, r: .8 + Math.random() * 1.8 });
            }
        }

        /* Zona del dibujo: a la derecha en ordenador, abajo en el móvil */
        function zona() {
            if (movil) return { x0: -W * .1, x1: W * 1.1, base: H - 70, alto: H * .3 };
            /* En el ordenador la campana ocupa la franja baja, por debajo
               de la tarjeta del examen y por encima de la cinta */
            var techo = H * .45;
            var tarjeta = hero.querySelector(".hero-examen:not([hidden])");
            if (tarjeta) {
                var rh = hero.getBoundingClientRect(), rt = tarjeta.getBoundingClientRect();
                techo = rt.bottom - rh.top + 34;          /* la campana no sube más que esto */
            }
            var base = H - 76;
            return { x0: W * .3, x1: W * 1.04, base: base, alto: Math.max(110, Math.min(230, base - techo)) };
        }

        /* Colores de la curva: siguen el color elegido por el alumno */
        var col = { a: [122, 92, 255], b: [91, 140, 255] }, cuadro = 0;

        function hexRgb(h) {
            h = (h || "").trim().replace("#", "");
            if (h.length !== 6) return null;
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
        }

        function leerColores() {
            var cs = getComputedStyle(document.documentElement);
            var a = hexRgb(cs.getPropertyValue("--c1")), b = hexRgb(cs.getPropertyValue("--c2"));
            if (a && b) {
                /* un poco más claros para que brillen sobre el fondo oscuro */
                col.a = a.map(function (v) { return Math.round(v + (255 - v) * .25); });
                col.b = b.map(function (v) { return Math.round(v + (255 - v) * .25); });
            }
        }

        function rgba(c, o) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + o + ")"; }

        leerColores();

        function gauss(x, m, s) {
            return Math.exp(-((x - m) * (x - m)) / (2 * s * s));
        }

        function dibujar(ahora) {

            var t = (ahora - t0) / 1000;
            if (++cuadro % 30 === 0) leerColores();
            var z = zona();
            var m = Math.sin(t * .17) * .18;
            var s = .2 + Math.sin(t * .23) * .05 + .03;

            function X(u) { return z.x0 + (u + 1) / 2 * (z.x1 - z.x0); }
            function Y(v) { return z.base - v * z.alto; }

            ctx.clearRect(0, 0, W, H);

            /* símbolos que flotan */
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            flotantes.forEach(function (f) {
                var y = (f.y - t * f.v) % (H + 60);
                if (y < -30) y += H + 60;
                if (y < 90) return;   /* que no asomen por detrás del menú */
                var x = f.x + Math.sin(t * .3 + f.f) * 14;
                ctx.font = "500 " + f.t + "px Poppins, Inter, sans-serif";
                ctx.fillStyle = "rgba(200, 190, 255," + f.a + ")";
                ctx.fillText(f.s, x, y);
            });

            /* histograma de fondo */
            var barras = movil ? 18 : 26;
            for (var b = 0; b < barras; b++) {
                var u0 = -1 + b * 2 / barras, u1 = u0 + 2 / barras;
                var h = gauss((u0 + u1) / 2, m, s);
                var x0 = X(u0) + 1.5, x1 = X(u1) - 1.5;
                var g = ctx.createLinearGradient(0, Y(h), 0, z.base);
                g.addColorStop(0, rgba(col.a, .16));
                g.addColorStop(1, rgba(col.a, .02));
                ctx.fillStyle = g;
                ctx.fillRect(x0, Y(h), x1 - x0, z.base - Y(h));
            }

            /* eje */
            ctx.strokeStyle = "rgba(255, 255, 255, .14)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(z.x0, z.base + .5);
            ctx.lineTo(z.x1, z.base + .5);
            ctx.stroke();

            /* área de ±1σ */
            ctx.beginPath();
            ctx.moveTo(X(m - s), z.base);
            for (var a = m - s; a <= m + s; a += .01) ctx.lineTo(X(a), Y(gauss(a, m, s)));
            ctx.lineTo(X(m + s), z.base);
            ctx.closePath();
            var ga = ctx.createLinearGradient(0, Y(1), 0, z.base);
            ga.addColorStop(0, rgba(col.b, .35));
            ga.addColorStop(1, rgba(col.b, .02));
            ctx.fillStyle = ga;
            ctx.fill();

            /* media */
            ctx.setLineDash([4, 6]);
            ctx.strokeStyle = "rgba(255, 255, 255, .25)";
            ctx.beginPath();
            ctx.moveTo(X(m), Y(1));
            ctx.lineTo(X(m), z.base);
            ctx.stroke();
            ctx.setLineDash([]);

            /* curva secundaria (más suave) */
            ctx.beginPath();
            for (var k = -1; k <= 1.0001; k += .01) {
                var yk = gauss(k, -m * .8, s * 1.9) * .55;
                if (k === -1) ctx.moveTo(X(k), Y(yk)); else ctx.lineTo(X(k), Y(yk));
            }
            ctx.strokeStyle = "rgba(90, 200, 255, .28)";
            ctx.lineWidth = 1.2;
            ctx.stroke();

            /* curva principal con brillo */
            var gl = ctx.createLinearGradient(z.x0, 0, z.x1, 0);
            gl.addColorStop(0, rgba(col.a, 1));
            gl.addColorStop(.5, rgba(col.b, 1));
            gl.addColorStop(1, rgba(col.a, 1));
            ctx.beginPath();
            for (var q = -1; q <= 1.0001; q += .005) {
                var yq = gauss(q, m, s);
                if (q === -1) ctx.moveTo(X(q), Y(yq)); else ctx.lineTo(X(q), Y(yq));
            }
            ctx.strokeStyle = gl;
            ctx.lineWidth = 2.6;
            ctx.shadowColor = rgba(col.b, .9);
            ctx.shadowBlur = 16;
            ctx.stroke();
            ctx.shadowBlur = 0;

            /* partículas que recorren la curva */
            particulas.forEach(function (p) {
                p.u = (p.u + p.v * .016) % 1;
                var x = p.u * 2 - 1;
                var px = X(x), py = Y(gauss(x, m, s));
                ctx.beginPath();
                ctx.arc(px, py, p.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255, 255, 255, .85)";
                ctx.shadowColor = rgba(col.a, 1);
                ctx.shadowBlur = 8;
                ctx.fill();
            });
            ctx.shadowBlur = 0;

            /* al pasar el ratón: f(x) en ese punto */
            if (raton && raton.x > z.x0 && raton.x < z.x1) {
                var ux = (raton.x - z.x0) / (z.x1 - z.x0) * 2 - 1;
                var fx = gauss(ux, m, s);
                var py2 = Y(fx);
                ctx.strokeStyle = "rgba(255, 255, 255, .35)";
                ctx.setLineDash([2, 4]);
                ctx.beginPath();
                ctx.moveTo(raton.x, z.base);
                ctx.lineTo(raton.x, py2);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.arc(raton.x, py2, 5, 0, Math.PI * 2);
                ctx.fillStyle = "#fff";
                ctx.shadowColor = rgba(col.a, 1);
                ctx.shadowBlur = 18;
                ctx.fill();
                ctx.shadowBlur = 0;

                var etiqueta = "f(x) = " + fx.toFixed(3).replace(".", ",");
                ctx.font = "600 13px Inter, sans-serif";
                var ancho = ctx.measureText(etiqueta).width + 20;
                var lx = Math.min(raton.x + 12, W - ancho - 8), ly = py2 - 36;

                /* Si la etiqueta choca con la tarjeta del examen, va debajo del punto */
                var tarjeta = hero.querySelector(".hero-examen:not([hidden])");
                if (tarjeta) {
                    var rh = hero.getBoundingClientRect(), rt = tarjeta.getBoundingClientRect();
                    var tx0 = rt.left - rh.left - 6, tx1 = rt.right - rh.left + 6;
                    var ty0 = rt.top - rh.top - 6, ty1 = rt.bottom - rh.top + 6;
                    var choca = lx < tx1 && lx + ancho > tx0 && ly < ty1 && ly + 26 > ty0;
                    if (choca) ly = py2 + 14;
                }
                ctx.fillStyle = "rgba(20, 18, 40, .85)";
                ctx.strokeStyle = "rgba(255, 255, 255, .18)";
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(lx, ly, ancho, 26, 8); else ctx.rect(lx, ly, ancho, 26);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = "#fff";
                ctx.textAlign = "left";
                ctx.fillText(etiqueta, lx + 10, ly + 13.5);
            }
        }

        function bucle(ahora) {
            if (visible && !document.hidden) dibujar(ahora);
            if (!movimientoReducido) requestAnimationFrame(bucle);
        }

        preparar();

        if ("ResizeObserver" in window) {
            new ResizeObserver(function () { preparar(); if (movimientoReducido) dibujar(performance.now()); }).observe(hero);
        } else {
            window.addEventListener("resize", preparar);
        }

        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(hero);
        }

        hero.addEventListener("pointermove", function (e) {
            if (e.pointerType === "touch") return;
            var r = hero.getBoundingClientRect();
            raton = { x: e.clientX - r.left, y: e.clientY - r.top };
        });
        hero.addEventListener("pointerleave", function () { raton = null; });

        if (movimientoReducido) {
            t0 = performance.now() - 4000;
            dibujar(performance.now());
        } else {
            requestAnimationFrame(bucle);
        }

        /* Cuando lleguen las fuentes, redibuja los símbolos con Poppins */
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { if (movimientoReducido) dibujar(performance.now()); });
        }
    }


    /* Saludo con gracia según la hora (cabecera de la portada).
       Cada franja tiene varias versiones que van rotando por días. */

    var SALUDOS = [
        /* [desde la hora, hasta la hora, [saludo, coletilla]…] */
        [0, 6, [
            ["Buenas noches, noctámbulo.", "Ya que estás despierto, un ejercicio rápido… y a dormir, que el cerebro también estudia mientras duermes."],
            ["Hola, búho nocturno.", "A estas horas solo quedan despiertos los astrónomos, los panaderos y tú."],
            ["Buenas noches, trasnochador.", "Dato: dormir bien mejora la memoria. Repasa un poco y a la cama."],
            ["¿Todavía despierto?", "La probabilidad de que mañana tengas sueño acaba de subir bastante."],
            ["Hola, noctámbulo.", "Las estrellas y tú. Un vistazo rápido y a descansar."],
            ["Buenas noches.", "Si no puedes dormir, cuenta ovejas… o resuelve un sistema 3×3."]
        ]],
        [6, 9, [
            ["Buenos días, madrugador.", "Tú y el sol, los primeros en ponerse en marcha."],
            ["Buenos días, gente madrugadora.", "Café, Cola Cao o lo que haga falta: hoy toca darlo todo."],
            ["Arriba, madrugador.", "Las mañanas tempranas tienen algo de superpoder."],
            ["Buenos días.", "Aún no son ni las nueve y ya estás aquí. Eso tiene mérito."],
            ["Buenos días, valiente.", "Abrir los apuntes antes del desayuno es de otro nivel."],
            ["Hola, madrugador.", "Mientras otros apagan el despertador, tú ya vas por delante."]
        ]],
        [9, 14, [
            ["Buenos días.", "Cabeza fresca, mañana por delante: el mejor momento para entender algo nuevo."],
            ["Buenos días, crack.", "Las matrices no se van a multiplicar solas."],
            ["Hola, buenos días.", "Hoy es un buen día para que algo que no entendías, por fin haga clic."],
            ["Buenos días.", "¿Escapada de un minuto entre clase y clase? Aprovéchalo."],
            ["Hola, ¿qué tal la mañana?", "Si va regular, un ejercicio bien resuelto la arregla bastante."],
            ["Buenos días.", "Hoy se derivan funciones, no responsabilidades."]
        ]],
        [14, 17, [
            ["Buenas tardes.", "Hora de la siesta… o de unas derivadas. Tú decides."],
            ["Buenas tardes, campeón.", "Después de comer, un repaso ligero entra mejor de lo que parece."],
            ["Hola, buenas tardes.", "Sobremesa con estadística: más entretenida de lo que suena."],
            ["Buenas tardes.", "La digestión va lenta, pero tu cabeza puede ir rápida."],
            ["Hola, buenas tardes.", "Cinco minutos de repaso ahora valen por media hora el día antes del examen."],
            ["Buenas tardes.", "Siesta corta, repaso corto, y la tarde es tuya."]
        ]],
        [17, 21, [
            ["Buenas tardes.", "Momento perfecto para repasar un poco y quitártelo de encima."],
            ["Buenas tardes, crack.", "Un rato de mates ahora y la tarde entera es tuya."],
            ["Hola, buenas tardes.", "Merienda, apuntes y a por ello."],
            ["Buenas tardes.", "Primero los deberes, luego el móvil. Bueno… ya estás en el móvil, pero en la web correcta."],
            ["Hola, buenas tardes.", "La constancia es la variable que más pesa en la nota final."],
            ["Buenas tardes.", "Un ejercicio al día y el examen se vuelve mucho más pequeño."]
        ]],
        [21, 24, [
            ["Buenas noches.", "Último repaso del día y a descansar, que mañana también hay clase."],
            ["Buenas noches, noctámbulo.", "Lo que repases ahora, tu cerebro lo ordena mientras duermes."],
            ["Buenas noches, búho.", "Un ejercicio más y a dormir. Palabra de profe."],
            ["Buenas noches.", "Repaso exprés antes de dormir: el truco que casi nadie usa."],
            ["Hola, buenas noches.", "Mañana tu yo del futuro te agradecerá estos minutos."],
            ["Buenas noches.", "Cierra el día con algo que ya domines. Sienta genial."]
        ]]
    ];

    var SALUDOS_ESPECIALES = {
        viernes: [["¡Por fin viernes!", "Un vistazo rápido a lo de la semana y a disfrutar del finde."],
                  ["¡Viernes!", "Deja el repaso hecho hoy y el fin de semana será tuyo."]],
        sabado:  [["Feliz sábado.", "Hoy toca descansar… aunque un repasito ligero no hace daño a nadie."],
                  ["¿En sábado por aquí?", "Eso es compromiso. Un poco y a disfrutar."]],
        domingo: [["Feliz domingo.", "El clásico domingo de repaso. Mejor ahora que el lunes a primera hora."],
                  ["Buen domingo.", "Preparar la semana hoy es empezar el lunes con ventaja."]]
    };

    /* Coletillas según el día de la semana: «Buenos días, Lucía. Feliz miércoles: …» */
    var DIAS_SEMANA = [
        /* domingo */ ["Feliz domingo. El clásico domingo de repaso: mejor hoy que el lunes a primera hora.",
                       "Feliz domingo. Prepara la semana hoy y el lunes empezarás con ventaja.",
                       "Feliz domingo. Descansa bien, que mañana arranca otra semana."],
        /* lunes */   ["Feliz lunes: semana nueva, página en blanco.",
                       "Feliz lunes. Empezar con ganas es la mitad del trabajo.",
                       "Feliz lunes. Un café, buena música y a por la semana."],
        /* martes */  ["Feliz martes. La semana ya ha arrancado: tú también.",
                       "Feliz martes. Buen día para ese ejercicio que se te resistía.",
                       "Feliz martes. Ni lunes ni viernes: el día perfecto para avanzar."],
        /* miércoles */["Feliz miércoles: ya estamos a mitad de semana.",
                       "Feliz miércoles. Ecuador de la semana: desde aquí, todo cuesta abajo.",
                       "Feliz miércoles. Media semana hecha; la otra media, a por ella."],
        /* jueves */  ["Feliz jueves. Casi viernes: un último empujón.",
                       "Feliz jueves. Lo que hagas hoy, mañana no tendrás que hacerlo.",
                       "Feliz jueves. La semana ya huele a fin de semana."],
        /* viernes */ ["¡Feliz viernes! Un repaso rápido y a disfrutar del finde.",
                       "Feliz viernes. Cierra la semana con algo bien hecho.",
                       "¡Por fin viernes! Has llegado: ahora toca descansar."],
        /* sábado */  ["Feliz sábado. Hoy toca descansar… aunque un repasito no hace daño a nadie.",
                       "Feliz sábado. ¿En sábado por aquí? Eso es compromiso.",
                       "Feliz sábado. Disfruta del día: el lunes queda muy lejos."]
    ];

    /* Domingo de Pascua (algoritmo de Gauss/Butcher) para la Semana Santa */
    function pascua(an) {
        var a = an % 19, b = Math.floor(an / 100), c = an % 100, d = Math.floor(b / 4), e = b % 4,
            f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
            i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
            mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(an, mes - 1, dia);
    }

    /* Fechas especiales: si hoy es una de ellas, se usa siempre */
    function saludoEspecial(f) {
        var d = f.getDate(), m = f.getMonth() + 1, an = f.getFullYear();
        var hoy = new Date(an, m - 1, d).getTime();
        var p = pascua(an).getTime(), dia = 86400000;

        if (an === 2027 && m === 6 && d >= 1 && d <= 3) return ["¡Mucha suerte en la PAU!", "Respira, lee bien cada enunciado y confía en todo lo que has trabajado."];
        if (an === 2027 && m === 5 && d === 31) return ["Mañana empieza la PAU.", "Repaso ligero, mochila preparada y a dormir pronto. ¡Tú puedes!"];
        if (m === 10 && d === 31) return ["¡Feliz Halloween!", "Lo único que da miedo de verdad es dejarlo todo para el último día. 🎃"];
        if (m === 11 && d === 1) return ["Feliz día festivo.", "Hoy no hay clase: descansa, que te lo has ganado."];
        if (m === 12 && (d === 6 || d === 7 || d === 8)) return ["¡Feliz puente!", "Disfruta de estos días… y si te aburres, aquí tienes tus tarjetas."];
        if (m === 12 && d === 24) return ["¡Feliz Nochebuena!", "Hoy toca familia y comida rica. Las mates pueden esperar."];
        if (m === 12 && d === 25) return ["¡Feliz Navidad!", "Que Papá Noel te traiga muchas cosas… y una calculadora con pilas nuevas. 🎄"];
        if (m === 12 && d === 31) return ["¡Feliz Nochevieja!", "Doce uvas, doce campanadas y un año entero por delante."];
        if (m === 1 && d === 1) return ["¡Feliz año nuevo!", "Año nuevo, propósito nuevo: este curso, a por todas."];
        if (m === 1 && d === 6) return ["¡Feliz día de Reyes!", "Ojalá te hayan traído lo que pediste… y no carbón. 👑"];
        if ((m === 12 && d >= 22) || (m === 1 && d <= 7)) return ["¡Felices fiestas!", "Turrón, familia y, si te apetece, un repaso sin agobios."];
        if (m === 2 && d === 14) return ["Feliz San Valentín.", "Las matemáticas también se quieren: x nunca va sin su y. 💜"];
        if (m === 2 && d === 28) return ["¡Feliz Día de Andalucía!", "Verdiblanca y festiva: disfruta del día. 💚"];
        if (m === 3 && d === 14) return ["¡Feliz Día de π!", "3,14159… Hoy es el día más matemático del año."];
        if (hoy >= p - 7 * dia && hoy <= p) return ["Felices vacaciones de Semana Santa.", "Descansa, y antes de volver, un repaso ligero para no oxidarte."];
        if (m === 4 && d === 23) return ["Feliz Día del Libro.", "Los apuntes también cuentan como lectura, ¿no? 📚"];
        return null;
    }

    function ocurrenciaDelDia() {

        var el = document.getElementById("ocurrencia");
        if (!el) return;

        var ahora = new Date();
        var h = ahora.getHours();
        var dia = ahora.getDay();           /* 0 domingo … 6 sábado */
        var ultimo = leer("saludo-ultimo");
        var par = saludoEspecial(ahora);

        if (!par) {
            var base = h < 6 ? "Buenas noches." : h < 14 ? "Buenos días." : h < 21 ? "Buenas tardes." : "Buenas noches.";
            var opciones = null;
            for (var i = 0; i < SALUDOS.length; i++) {
                if (h >= SALUDOS[i][0] && h < SALUDOS[i][1]) { opciones = SALUDOS[i][2]; break; }
            }

            /* La mitad de las veces, el saludo del día de la semana (de 7:00 a 23:00) */
            if (h >= 7 && h < 23 && Math.random() < .5) {
                opciones = DIAS_SEMANA[dia].map(function (c) { return [base, c]; });
            } else if (dia === 5 && h >= 15 && h < 21) opciones = SALUDOS_ESPECIALES.viernes;
            else if (dia === 6 && h >= 9 && h < 21) opciones = SALUDOS_ESPECIALES.sabado;
            else if (dia === 0 && h >= 9 && h < 21) opciones = SALUDOS_ESPECIALES.domingo;

            /* Uno al azar en cada visita, sin repetir el último que se vio */
            var candidatos = opciones.filter(function (o) { return o[1] !== ultimo; });
            if (!candidatos.length) candidatos = opciones;
            par = candidatos[Math.floor(Math.random() * candidatos.length)];
        }
        guardar("saludo-ultimo", par[1]);

        el.innerHTML = '<strong class="saludo-hora"></strong> <span class="saludo-coletilla"></span>';
        el.firstChild.textContent = par[0];
        el.lastChild.textContent = par[1];
    }


    /* =====================================================
       9. HERRAMIENTAS: selector de calculadoras, calculadora
          de la normal y «añadir el examen al calendario»
    ===================================================== */

    /* Ventana genérica (usa el mismo estilo que el buscador) */
    function crearVentana(clase, etiqueta, titulo, cuerpo) {
        var v = document.createElement("div");
        v.className = "buscador ventana " + clase;
        v.setAttribute("role", "dialog");
        v.setAttribute("aria-modal", "true");
        v.setAttribute("aria-label", titulo);
        v.innerHTML =
            '<div class="buscador-fondo"></div>' +
            '<div class="buscador-caja cp-caja">' +
            '<div class="cp-cabecera"><div><p class="b-etiqueta">' + etiqueta + '</p><h2>' + titulo + '</h2></div>' +
            '<button type="button" class="cp-cerrar" aria-label="Cerrar">×</button></div>' +
            cuerpo + '</div>';
        document.body.appendChild(v);

        function cerrar() {
            v.classList.remove("abierto");
            document.documentElement.classList.remove("sin-scroll");
        }
        v.querySelector(".buscador-fondo").addEventListener("click", cerrar);
        v.querySelector(".cp-cerrar").addEventListener("click", cerrar);
        /* Esc cierra la ventana aunque el foco se haya ido fuera */
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && v.classList.contains("abierto")) cerrar();
        });

        v.abrir = function () {
            v.classList.add("abierto");
            document.documentElement.classList.add("sin-scroll");
            var foco = v.querySelector("input, a, button.cp-cerrar");
            if (foco) setTimeout(function () { foco.focus(); }, 40);
        };
        return v;
    }


    /* ---------- Selector de calculadoras ---------- */

    var ventanaCalculadoras = null;

    function abrirCalculadoras() {
        if (!ventanaCalculadoras) {
            var modelos = [
                ["calculadora570.html", "Casio FX-570SP CW", "La blanca. Vídeos paso a paso para cada tema."],
                ["calculadora991.html", "Casio FX-991", "Vídeos paso a paso para cada tema."],
                ["calculadoraclasswiz.html", "Casio ClassWiz", "Vídeos paso a paso para cada tema."]
            ];
            var cuerpo = '<div class="cp-cuerpo"><p class="cp-ayuda">¿Qué calculadora tienes? Elige tu modelo y verás cómo hacer con ella cada tipo de ejercicio.</p><div class="calc-lista">' +
                modelos.map(function (m) {
                    return '<a class="calc-opcion" href="' + raiz + 'calculadoras/' + m[0] + '">' +
                        '<span class="calc-icono"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm2 3v3h6V5H9zm0 6h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z"/></svg></span>' +
                        '<span class="calc-texto"><strong>' + m[1] + '</strong><small>' + m[2] + '</small></span>' +
                        '<span class="calc-flecha">→</span></a>';
                }).join("") + '</div></div>';
            ventanaCalculadoras = crearVentana("v-calculadoras", "Ayuda", "Calculadoras", cuerpo);
        }
        ventanaCalculadoras.abrir();
    }


    /* ---------- Calculadora de la normal ---------- */

    /* Φ(z): función de distribución de la N(0,1) (error < 1e-7) */
    function phi(z) {
        var t = 1 / (1 + 0.2316419 * Math.abs(z));
        var d = 0.3989422804014327 * Math.exp(-z * z / 2);
        var p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
        return z > 0 ? 1 - p : p;
    }

    /* Φ⁻¹(p): inversa (algoritmo de Acklam, error < 1.2e-9) */
    function phiInv(p) {
        var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
        var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
        var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
        var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
        var q, r;
        if (p < 0.02425) {
            q = Math.sqrt(-2 * Math.log(p));
            return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
        }
        if (p > 1 - 0.02425) {
            q = Math.sqrt(-2 * Math.log(1 - p));
            return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
        }
        q = p - 0.5;
        r = q * q;
        return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }

    /* Como en la tabla: z con 2 decimales y probabilidades con 4 */
    function r2(n) { return Math.round(n * 100) / 100; }
    function r4(n) { return Math.round(n * 10000) / 10000; }
    function phiTabla(z) { return r4(phi(r2(z))); }

    function fmt(n, dec) {
        return n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }

    function leerNum(v) {
        if (v === "" || v === null || v === undefined) return null;
        var n = parseFloat(String(v).replace(",", ".").replace("−", "-"));
        return isNaN(n) ? null : n;
    }

    var ventanaNormal = null;

    function abrirNormal() {
        setTimeout(function () { desbloquear("calculista"); }, 1200);

        if (!ventanaNormal) {

            var cuerpo =
                '<div class="cp-cuerpo">' +
                '<div class="nm-modos" role="tablist">' +
                '<button type="button" class="nm-modo activo" data-modo="menor">P(X ≤ x)</button>' +
                '<button type="button" class="nm-modo" data-modo="mayor">P(X ≥ x)</button>' +
                '<button type="button" class="nm-modo" data-modo="entre">P(a ≤ X ≤ b)</button>' +
                '<button type="button" class="nm-modo" data-modo="inversa">Buscar x</button>' +
                '</div>' +
                '<div class="cp-rejilla nm-campos">' +
                '<label class="cp-campo"><span>Media μ</span><input id="nm-mu" inputmode="decimal" value="0" autocomplete="off"></label>' +
                '<label class="cp-campo"><span>Desviación típica σ</span><input id="nm-sigma" inputmode="decimal" value="1" autocomplete="off"></label>' +
                '<label class="cp-campo nm-x"><span>Valor x</span><input id="nm-x" inputmode="decimal" value="1,96" autocomplete="off"></label>' +
                '<label class="cp-campo nm-a" hidden><span>Desde a</span><input id="nm-a" inputmode="decimal" value="-1" autocomplete="off"></label>' +
                '<label class="cp-campo nm-b" hidden><span>Hasta b</span><input id="nm-b" inputmode="decimal" value="1" autocomplete="off"></label>' +
                '<label class="cp-campo nm-p" hidden><span>Probabilidad P(X ≤ x)</span><input id="nm-p" inputmode="decimal" value="0,975" autocomplete="off"></label>' +
                '</div>' +
                '<svg class="nm-grafica" viewBox="0 0 400 150" aria-hidden="true"></svg>' +
                '</div>' +
                '<div class="cp-resultado nm-resultado">' +
                '<div class="cp-nota cp-nota-adm"><small id="nm-etq">Probabilidad</small><strong id="nm-res">—</strong></div>' +
                '<p class="cp-mensaje" id="nm-paso"></p>' +
                '</div>' +
                '<p class="cp-aviso">Tipificamos con Z = (X − μ) / σ y usamos la N(0, 1). Como en la tabla: z con 2 decimales y probabilidades con 4.</p>';

            ventanaNormal = crearVentana("v-normal", "Distribución normal", "Calculadora de la normal", cuerpo);

            var modo = "menor";
            var V = ventanaNormal;

            V.querySelectorAll(".nm-modo").forEach(function (b) {
                b.addEventListener("click", function () {
                    modo = b.getAttribute("data-modo");
                    V.querySelectorAll(".nm-modo").forEach(function (x) { x.classList.toggle("activo", x === b); });
                    V.querySelector(".nm-x").hidden = !(modo === "menor" || modo === "mayor");
                    V.querySelector(".nm-a").hidden = modo !== "entre";
                    V.querySelector(".nm-b").hidden = modo !== "entre";
                    V.querySelector(".nm-p").hidden = modo !== "inversa";
                    calcular();
                });
            });

            V.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", calcular); });

            function val(id) { return leerNum(V.querySelector("#" + id).value); }

            function dibujar(mu, s, desde, hasta, marca) {
                var svg = V.querySelector(".nm-grafica");
                var W = 400, base = 132, alto = 112;
                function X(z) { return W / 2 + z * (W / 8); }
                function Y(z) { return base - Math.exp(-z * z / 2) * alto; }
                var curva = "", area = "";
                for (var z = -4; z <= 4.0001; z += .05) curva += (z === -4 ? "M" : "L") + X(z).toFixed(1) + " " + Y(z).toFixed(1);
                var z0 = Math.max(-4, desde), z1 = Math.min(4, hasta);
                if (z1 > z0) {
                    area = "M" + X(z0).toFixed(1) + " " + base;
                    for (var w = z0; w <= z1 + 1e-9; w += .025) area += "L" + X(Math.min(w, z1)).toFixed(1) + " " + Y(Math.min(w, z1)).toFixed(1);
                    area += "L" + X(z1).toFixed(1) + " " + base + "Z";
                }
                var marcas = "";
                (marca || []).forEach(function (m) {
                    if (m < -4 || m > 4) return;
                    marcas += '<line x1="' + X(m) + '" y1="' + Y(m) + '" x2="' + X(m) + '" y2="' + (base + 4) + '" class="nm-marca"/>' +
                        '<text x="' + X(m) + '" y="' + (base + 15) + '" class="nm-txt">' + fmt(mu + m * s, 2) + '</text>';
                });
                svg.innerHTML =
                    '<path d="' + area + '" class="nm-area"/>' +
                    '<path d="' + curva + '" class="nm-curva"/>' +
                    '<line x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '" class="nm-eje"/>' + marcas;
            }

            function calcular() {
                var mu = val("nm-mu"), s = val("nm-sigma");
                var res = V.querySelector("#nm-res"), paso = V.querySelector("#nm-paso"), etq = V.querySelector("#nm-etq");

                if (mu === null || s === null || s <= 0) {
                    res.textContent = "—";
                    paso.textContent = "La desviación típica tiene que ser un número mayor que 0.";
                    return;
                }

                if (modo === "menor" || modo === "mayor") {
                    var x = val("nm-x");
                    if (x === null) { res.textContent = "—"; paso.textContent = "Escribe el valor x."; return; }
                    var z = r2((x - mu) / s);
                    var p = modo === "menor" ? phiTabla(z) : r4(1 - phiTabla(z));
                    etq.textContent = modo === "menor" ? "P(X ≤ " + fmt(x, 2) + ")" : "P(X ≥ " + fmt(x, 2) + ")";
                    res.textContent = fmt(p, 4);
                    paso.textContent = "Z = (" + fmt(x, 2) + " − " + fmt(mu, 2) + ") / " + fmt(s, 2) + " = " + fmt(z, 2) +
                        (modo === "menor" ? "  →  P(Z ≤ " + fmt(z, 2) + ") = " + fmt(p, 4) : "  →  1 − " + fmt(phiTabla(z), 4) + " = " + fmt(p, 4));
                    dibujar(mu, s, modo === "menor" ? -4 : z, modo === "menor" ? z : 4, [z]);
                }

                if (modo === "entre") {
                    var a = val("nm-a"), b = val("nm-b");
                    if (a === null || b === null) { res.textContent = "—"; paso.textContent = "Escribe a y b."; return; }
                    if (a > b) { var tmp = a; a = b; b = tmp; }
                    var za = r2((a - mu) / s), zb = r2((b - mu) / s);
                    var pe = r4(phiTabla(zb) - phiTabla(za));
                    etq.textContent = "P(" + fmt(a, 2) + " ≤ X ≤ " + fmt(b, 2) + ")";
                    res.textContent = fmt(pe, 4);
                    paso.textContent = "P(" + fmt(za, 2) + " ≤ Z ≤ " + fmt(zb, 2) + ") = " + fmt(phiTabla(zb), 4) + " − " + fmt(phiTabla(za), 4) + " = " + fmt(pe, 4);
                    dibujar(mu, s, za, zb, [za, zb]);
                }

                if (modo === "inversa") {
                    var pr = val("nm-p");
                    if (pr === null || pr <= 0 || pr >= 1) { res.textContent = "—"; paso.textContent = "La probabilidad tiene que estar entre 0 y 1 (por ejemplo 0,975)."; return; }
                    var zi = phiInv(pr);
                    var xi = mu + zi * s;
                    etq.textContent = "Valor x con P(X ≤ x) = " + fmt(pr, 4);
                    res.textContent = fmt(xi, 4);
                    paso.textContent = "z = " + fmt(zi, 4) + "  →  x = μ + z·σ = " + fmt(mu, 2) + " + " + fmt(zi, 4) + " · " + fmt(s, 2) + " = " + fmt(xi, 4);
                    dibujar(mu, s, -4, zi, [zi]);
                }
            }

            calcular();
        }
        ventanaNormal.abrir();
    }


    /* ---------- Añadir el examen al calendario ---------- */

    function botonCalendario(caja, t) {
        if (!caja || caja.querySelector(".ep-calendario")) return;

        function f(d) {
            return d.getFullYear() + dosCifras(d.getMonth() + 1) + dosCifras(d.getDate()) + "T" +
                dosCifras(d.getHours()) + dosCifras(d.getMinutes()) + "00";
        }

        var ini = new Date(t.fecha);
        var fin = new Date(t.fecha + 60 * 60 * 1000);
        var titulo = "Examen de Matemáticas CCSS · " + t.titulo;
        var detalle = "Repasa el tema aquí: " + t.url;

        /* Google Calendar: funciona en cualquier móvil u ordenador */
        var google = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
            "&text=" + encodeURIComponent(titulo) +
            "&dates=" + f(ini) + "/" + f(fin) +
            "&ctz=Europe/Madrid" +
            "&details=" + encodeURIComponent(detalle);

        /* Archivo .ics: calendario del iPhone, Outlook, etc. */
        function ics() {
            return [
                "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//IES El Molinillo//Matematicas CCSS//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
                "BEGIN:VEVENT",
                "UID:examen-" + t.fecha + "@matematicas-ccss",
                "DTSTAMP:" + f(new Date()),
                "DTSTART;TZID=Europe/Madrid:" + f(ini),
                "DTEND;TZID=Europe/Madrid:" + f(fin),
                "SUMMARY:" + titulo.replace(/[,;]/g, "\\$&"),
                "DESCRIPTION:" + detalle.replace(/[,;]/g, "\\$&"),
                "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Mañana tienes examen de Matemáticas", "END:VALARM",
                "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", "DESCRIPTION:Queda una semana para el examen de Matemáticas", "END:VALARM",
                "END:VEVENT", "END:VCALENDAR"
            ].join("\r\n");
        }

        function descargarIcs() {
            var archivo = new Blob([ics()], { type: "text/calendar;charset=utf-8" });
            var nombre = "examen-matematicas.ics";

            /* En el móvil, mejor el menú «Compartir»: deja guardarlo en el calendario */
            try {
                var fichero = new File([archivo], nombre, { type: "text/calendar" });
                if (navigator.canShare && navigator.canShare({ files: [fichero] }) && /android|iphone|ipad/i.test(navigator.userAgent)) {
                    navigator.share({ files: [fichero], title: titulo }).catch(function () {});
                    return;
                }
            } catch (e) {}

            var url = URL.createObjectURL(archivo);
            var a = document.createElement("a");
            a.href = url;
            a.download = nombre;
            document.body.appendChild(a);
            a.click();
            setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
        }

        var cont = document.createElement("div");
        cont.className = "ep-cal";
        cont.innerHTML =
            '<button type="button" class="ep-calendario" aria-expanded="false">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 8v9H5v-9h14zm-8 2v2H9v2h2v2h2v-2h2v-2h-2v-2h-2z"/></svg>' +
            '<span>Al calendario</span></button>' +
            '<div class="ep-cal-menu" hidden>' +
            '<a class="ep-cal-op" target="_blank" rel="noopener">Google Calendar <small>Android y ordenador</small></a>' +
            '<button type="button" class="ep-cal-op ep-cal-ics">iPhone, Outlook u otros <small>con aviso 1 semana y 1 día antes</small></button>' +
            '</div>';
        caja.appendChild(cont);

        var boton = cont.querySelector(".ep-calendario");
        var menu = cont.querySelector(".ep-cal-menu");
        cont.querySelector("a.ep-cal-op").href = google;

        boton.addEventListener("click", function (e) {
            e.stopPropagation();
            menu.hidden = !menu.hidden;
            boton.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
        });
        cont.querySelector(".ep-cal-ics").addEventListener("click", function () { descargarIcs(); menu.hidden = true; desbloquear("previsor"); });
        cont.querySelector("a.ep-cal-op").addEventListener("click", function () { menu.hidden = true; desbloquear("previsor"); });
        document.addEventListener("click", function (e) { if (!cont.contains(e.target)) menu.hidden = true; });
    }


    /* =====================================================
       10. MÓVIL: barra inferior de pestañas y paneles
           que suben desde abajo (solo se ven en pantallas
           estrechas; en el ordenador no aparece nada)
    ===================================================== */

    var ICONOS = {
        inicio: '<path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/>',
        temas: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zm16 0h-4a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h5z"/>',
        buscar: '<path d="M10 2a8 8 0 016.32 12.9l5.39 5.4-1.41 1.4-5.4-5.39A8 8 0 1110 2zm0 2a6 6 0 100 12 6 6 0 000-12z"/>',
        herramientas: '<path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm1 3v4h10V5zm0 7v2h2v-2zm4 0v2h2v-2zm4 0v6h2v-6zm-8 4v2h2v-2zm4 0v2h2v-2z"/>',
        mas: '<path d="M5 10a2 2 0 110 4 2 2 0 010-4zm7 0a2 2 0 110 4 2 2 0 010-4zm7 0a2 2 0 110 4 2 2 0 010-4z"/>',
        estrella: '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/>'
    };

    function icono(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONOS[n] + '</svg>'; }

    /* Panel inferior genérico */
    var panelAbierto = null;

    function panel(id, titulo, html) {
        var p = document.getElementById(id);
        if (!p) {
            p = document.createElement("div");
            p.id = id;
            p.className = "hoja";
            p.setAttribute("role", "dialog");
            p.setAttribute("aria-modal", "true");
            p.setAttribute("aria-label", titulo);
            p.innerHTML = '<div class="hoja-fondo"></div><div class="hoja-caja"><div class="hoja-asa"></div>' +
                '<div class="hoja-cab"><h2></h2><button type="button" class="hoja-cerrar" aria-label="Cerrar">×</button></div>' +
                '<div class="hoja-cuerpo"></div></div>';
            p.querySelector("h2").textContent = titulo;
            document.body.appendChild(p);
            p.querySelector(".hoja-fondo").addEventListener("click", cerrarPanel);
            p.querySelector(".hoja-cerrar").addEventListener("click", cerrarPanel);

            /* Deslizar hacia abajo para cerrar */
            var caja = p.querySelector(".hoja-caja"), y0 = null, dy = 0;
            caja.addEventListener("touchstart", function (e) {
                /* solo al arrastrar la barrita o el título; el resto hace scroll normal */
                if (!e.target.closest(".hoja-asa, .hoja-cab") || e.target.closest("button")) { y0 = null; return; }
                y0 = e.touches[0].clientY; dy = 0;
            }, { passive: true });
            caja.addEventListener("touchmove", function (e) {
                if (y0 === null) return;
                dy = Math.max(0, e.touches[0].clientY - y0);
                caja.style.transform = "translateY(" + dy + "px)";
            }, { passive: true });
            caja.addEventListener("touchend", function () {
                if (y0 === null) return;
                caja.style.transform = "";
                if (dy > 90) cerrarPanel();
                y0 = null;
            });
        }
        if (html !== undefined) p.querySelector(".hoja-cuerpo").innerHTML = html;
        return p;
    }

    function abrirPanel(p) {
        if (panelAbierto && panelAbierto !== p) panelAbierto.classList.remove("abierto");
        panelAbierto = p;
        p.classList.add("abierto");
        html.classList.add("sin-scroll");
    }

    function cerrarPanel() {
        if (!panelAbierto) return;
        panelAbierto.classList.remove("abierto");
        panelAbierto = null;
        html.classList.remove("sin-scroll");
        marcarPestana();
    }

    function fila(href, titulo, sub, extra) {
        return '<a class="hoja-fila" href="' + href + '"' + (extra || "") + '><span class="hf-txt"><strong></strong><small></small></span><span class="hf-flecha">›</span></a>'
            .replace("<strong></strong>", "<strong>" + titulo + "</strong>")
            .replace("<small></small>", sub ? "<small>" + sub + "</small>" : "");
    }

    function boton(accion, titulo, sub, ic) {
        return '<button type="button" class="hoja-fila" data-accion="' + accion + '">' +
            (ic ? '<span class="hf-ic">' + ic + '</span>' : "") +
            '<span class="hf-txt"><strong>' + titulo + '</strong>' + (sub ? '<small>' + sub + '</small>' : '') + '</span><span class="hf-flecha">›</span></button>';
    }

    /* --- Temas --- */
    function panelTemas() {
        var p = panel("hoja-temas", "Temas", '<p class="hoja-cargando">Cargando temas…</p>');
        abrirPanel(p);
        cargarTemas().then(function (datos) {
            var ahora = Date.now();
            var html2 = "";
            [2, 1].forEach(function (curso) {
                var lista = datos.temas.filter(function (t) { return t.curso === curso; });
                if (!lista.length) return;
                var dentro = lista.map(function (t) {
                    var partes = /^(Tema\s*\d+)\s*[:.·-]?\s*(.*)$/i.exec(t.titulo) || [null, t.titulo, ""];
                    var aviso = t.fecha && t.fecha > ahora ?
                        ' <em class="hf-examen">Examen ' + new Date(t.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) + '</em>' : "";
                    var nt = novedadesDeTema(t.url);
                    var esNuevo = nt.some(function (n) { return n.tipo === "tema"; });
                    var nuevo = esNuevo ? ' <em class="hf-nuevo">Nuevo</em>'
                        : nt.length ? ' <em class="hf-nuevo">' + nt.length + (nt.length === 1 ? " novedad" : " novedades") + '</em>' : "";
                    return '<a class="hoja-fila hf-tema" href="' + t.url + '"><span class="hf-num">' + (partes[1].replace(/\D/g, "")) + '</span>' +
                        '<span class="hf-txt"><strong>' + (partes[2] || partes[1]) + nuevo + '</strong>' + aviso + '</span><span class="hf-flecha">›</span></a>';
                }).join("");
                html2 += curso === 2
                    ? '<p class="hoja-grupo">2.º Bachillerato · CCSS II</p>' + dentro
                    : '<details class="hoja-desplegable"><summary>1.º Bachillerato · CCSS I <small>curso pasado</small></summary>' + dentro + '</details>';
            });
            p.querySelector(".hoja-cuerpo").innerHTML = html2;
            /* abrir el panel cuenta como «visto» */

        });
    }

    /* --- Herramientas --- */
    function panelHerramientas() {
        var p = panel("hoja-herramientas", "Herramientas",
            boton("normal", "Calculadora de la normal", "P(Z ≤ z), entre dos valores y valor crítico", icono("herramientas")) +
            boton("nota", "¿Qué nota necesito?", "Nota de acceso y de admisión de la PAU", icono("herramientas")) +
            boton("calculadoras", "Ayuda con tu calculadora", "FX-570 · FX-991 · ClassWiz", icono("herramientas")) +
            boton("repaso", "Tarjetas de repaso", "Preguntas clave de cada tema para girar", icono("temas")) +
            boton("media", "Mi media", "Tus notas y lo que necesitas en el siguiente", icono("herramientas")) +
            '<p class="hoja-grupo">También</p>' +
            fila(raiz + "examenes.html", "Exámenes del curso", "Enunciados y soluciones") +
            fila("https://www.emestrada.org/", "Exámenes de la PAU", "EMESTRADA", ' target="_blank" rel="noopener"'));
        abrirPanel(p);
    }

    /* --- Más --- */
    function panelMas() {
        var enlaces = "";
        document.querySelectorAll("#menu-container .menu-contenido > a").forEach(function (a) {
            var t = a.textContent.replace(/\s+/g, " ").trim();
            if (/^inicio$/i.test(t)) return;
            var ext = a.target === "_blank" ? ' target="_blank" rel="noopener"' : "";
            enlaces += fila(a.href, t, "", ext);
        });
        var noche = html.getAttribute("data-tema") === "noche";
        var p = panel("hoja-mas", "Más",
            '<p class="hoja-grupo hg-primero">Herramientas</p>' +
            boton("normal", "Calculadora de la normal", "P(Z ≤ z), entre dos valores y valor crítico", icono("herramientas")) +
            boton("repaso", "Tarjetas de repaso", "Preguntas clave de cada tema", icono("temas")) +
            boton("nota", "¿Qué nota necesito?", "Nota de acceso y de admisión de la PAU", icono("herramientas")) +
            boton("media", "Mi media", "Tus notas por criterios y competencias", icono("herramientas")) +
            boton("calculadoras", "Ayuda con tu calculadora", "FX-570 · FX-991 · ClassWiz", icono("herramientas")) +
            '<p class="hoja-grupo">Secciones</p>' +
            fila(raiz + "examenes.html", "Exámenes del curso", "Enunciados y soluciones") +
            enlaces +
            '<p class="hoja-grupo">Ajustes</p>' +
            '<div class="hoja-fila hf-color"><span class="hf-txt"><strong>Tu color</strong><small>Cambia el color de toda la web</small></span>' + selectorColores() + '</div>' +
            boton("quien", (miPerfil() && miPerfil().nombre) ? "Eres " + miPerfil().nombre : "¿Quién eres?",
                (miPerfil() && miPerfil().nombre) ? "Toca para cambiarlo" : "Elige tu nombre para que la web te salude") +
            '<button type="button" class="hoja-fila" data-accion="tema"><span class="hf-txt"><strong>Modo noche</strong><small>Fondo oscuro, ideal por la noche</small></span>' +
            '<span class="interruptor' + (noche ? " on" : "") + '"><span></span></span></button>');
        abrirPanel(p);
    }

    /* Acciones de los botones dentro de los paneles */
    document.addEventListener("click", function (e) {
        var b = e.target.closest(".hoja [data-accion]");
        if (!b) return;
        var acc = b.getAttribute("data-accion");
        if (acc === "tema") {
            var nuevo = html.getAttribute("data-tema") === "noche" ? "claro" : "noche";
            aplicarTema(nuevo);
            guardar("tema-web", nuevo);
            var sw = b.querySelector(".interruptor");
            if (sw) sw.classList.toggle("on", nuevo === "noche");
            return;
        }
        cerrarPanel();
        if (acc === "normal") abrirNormal();
        if (acc === "nota") abrirCalculadora();
        if (acc === "calculadoras") abrirCalculadoras();
        if (acc === "quien") abrirQuienEres();
        if (acc === "media") abrirMedia();
        if (acc === "favs") { setTimeout(panelFavs, 10); }
        if (acc === "repaso") { setTimeout(panelRepaso, 10); }
    });

    /* Barra de pestañas */
    function marcarPestana(activa) {
        var barra = document.querySelector(".tabbar");
        if (!barra) return;
        if (!activa) {
            activa = pagina === "inicio" ? "inicio"
                : (html.getAttribute("data-curso") || pagina === "calculadora") ? "temas" : "";
        }
        barra.querySelectorAll(".tab").forEach(function (t) {
            t.classList.toggle("activa", t.getAttribute("data-tab") === activa);
        });
    }

    function barraInferior() {
        if (pagina === "juego" || document.querySelector(".tabbar")) return;
        var nav = document.createElement("nav");
        nav.className = "tabbar";
        nav.setAttribute("aria-label", "Navegación");
        nav.innerHTML =
            '<a class="tab" data-tab="inicio" href="' + raiz + 'index.html">' + icono("inicio") + '<span>Inicio</span></a>' +
            '<button class="tab" type="button" data-tab="temas">' + icono("temas") + '<span>Temas</span></button>' +
            '<button class="tab tab-buscar" type="button" data-tab="buscar">' + icono("buscar") + '<span>Buscar</span></button>' +
            '<button class="tab" type="button" data-tab="favs">' + icono("estrella") + '<span>Favoritos</span></button>' +
            '<button class="tab" type="button" data-tab="mas">' + icono("mas") + '<span>Más</span></button>';
        document.body.appendChild(nav);
        html.classList.add("con-tabbar");

        nav.addEventListener("click", function (e) {
            var t = e.target.closest("button.tab");
            if (!t) return;
            var cual = t.getAttribute("data-tab");
            if (panelAbierto && panelAbierto.id === "hoja-" + cual) { cerrarPanel(); return; }
            marcarPestana(cual);
            if (cual === "temas") panelTemas();
            if (cual === "herramientas") panelHerramientas();
            if (cual === "favs") panelFavs();
            if (cual === "mas") panelMas();
            if (cual === "buscar") { cerrarPanel(); abrirBuscador(); }
        });

        marcarPestana();
    }

    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarPanel(); });


    /* =====================================================
       11. ¿QUIÉN ERES? Nombre del alumno y su cumpleaños.
           Se elige de la lista de Cumpleaños y se guarda
           SOLO en su dispositivo (no se envía a ningún sitio).
    ===================================================== */

    function miPerfil() {
        try { return JSON.parse(leer("perfil-web") || "null"); } catch (e) { return null; }
    }

    function cargarClase() {
        return fetch(raiz + "cumpleanos.html", { cache: "no-cache" })
            .then(function (r) { return r.text(); })
            .then(function (t) {
                var doc = new DOMParser().parseFromString(t, "text/html");
                var lista = [];
                doc.querySelectorAll(".cumple").forEach(function (c) {
                    var n = c.querySelector(".nombre"), f = c.querySelector(".fecha");
                    if (!n || !f) return;
                    var nombre = limpiar(n.textContent);
                    var m = /(\d{1,2})\/(\d{1,2})/.exec(f.textContent);
                    if (nombre && m) lista.push({ nombre: nombre, dia: +m[1], mes: +m[2] });
                });
                /* Nombre corto: el nombre de pila (con inicial si hay dos iguales) */
                var cuenta = {};
                lista.forEach(function (a) { var p = a.nombre.split(" ")[0]; cuenta[p] = (cuenta[p] || 0) + 1; });
                lista.forEach(function (a) {
                    var partes = a.nombre.split(" ");
                    a.corto = cuenta[partes[0]] > 1 && partes[1] ? partes[0] + " " + partes[1].charAt(0) + "." : partes[0];
                });
                lista.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, "es"); });
                /* El profe, el primero de la lista */
                lista.unshift({ nombre: "Miguel Ángel", corto: "Miguel Ángel", profe: true });
                return lista;
            });
    }

    function esMiCumple(p) {
        if (!p || !p.dia) return false;
        var h = new Date();
        return h.getDate() === p.dia && h.getMonth() + 1 === p.mes;
    }

    var ventanaQuien = null;

    function abrirQuienEres() {
        if (!ventanaQuien) {
            ventanaQuien = crearVentana("v-quien", "Solo en tu móvil", "¿Quién eres?",
                '<div class="cp-cuerpo">' +
                '<p class="cp-ayuda">Elige tu nombre y la web te saludará a ti (y el día de tu cumple habrá sorpresa). Se guarda únicamente en este dispositivo: no se envía a ningún sitio.</p>' +
                '<label class="cp-campo"><span>Busca tu nombre</span><input id="quien-buscar" type="search" autocomplete="off" placeholder="Escribe para filtrar…"></label>' +
                '<div class="quien-lista"><p class="hoja-cargando">Cargando la clase…</p></div>' +
                '</div>' +
                '<div class="quien-pie"><button type="button" class="quien-anonimo">Prefiero no decirlo</button></div>');

            var listaEl = ventanaQuien.querySelector(".quien-lista");
            var buscar = ventanaQuien.querySelector("#quien-buscar");
            var alumnos = [];

            function pintar() {
                var q = quitarTildes(buscar.value.trim());
                var actual = miPerfil();
                listaEl.innerHTML = "";
                alumnos.filter(function (a) { return !q || quitarTildes(a.nombre).indexOf(q) > -1; }).forEach(function (a) {
                    var b = document.createElement("button");
                    b.type = "button";
                    b.className = "quien-op" + (actual && actual.nombre === a.nombre ? " elegido" : "");
                    b.innerHTML = '<span class="quien-ini"></span><span class="quien-nom"></span>';
                    b.firstChild.textContent = a.nombre.charAt(0);
                    b.lastChild.textContent = a.nombre;
                    if (a.profe) {
                        b.classList.add("quien-profe");
                        var et = document.createElement("small");
                        et.textContent = "Profe";
                        b.appendChild(et);
                    }
                    b.addEventListener("click", function () {
                        guardar("perfil-web", JSON.stringify(a));
                        ventanaQuien.querySelector(".cp-cerrar").click();
                        aplicarPerfil(true);
                    });
                    listaEl.appendChild(b);
                });
                if (!listaEl.children.length) listaEl.innerHTML = '<p class="hoja-cargando">No aparece nadie con ese nombre.</p>';
            }

            cargarClase().then(function (l) { alumnos = l; pintar(); })
                .catch(function () { listaEl.innerHTML = '<p class="hoja-cargando">No se ha podido cargar la lista.</p>'; });
            buscar.addEventListener("input", pintar);

            ventanaQuien.querySelector(".quien-anonimo").addEventListener("click", function () {
                guardar("perfil-web", JSON.stringify({ anonimo: true }));
                ventanaQuien.querySelector(".cp-cerrar").click();
                aplicarPerfil(true);
            });
        }
        ventanaQuien.abrir();
    }

    /* Personaliza la portada con el nombre y, si toca, el cumpleaños */
    function aplicarPerfil(recienElegido) {
        var p = miPerfil();
        var el = document.getElementById("ocurrencia");
        var hola = el && el.querySelector(".saludo-hora");
        var aviso = document.getElementById("quien-aviso");

        if (aviso) aviso.remove();

        if (!el) return;

        if (!p) {
            /* Invitación discreta, solo en la portada */
            var a = document.createElement("button");
            a.type = "button";
            a.id = "quien-aviso";
            a.className = "quien-aviso";
            a.innerHTML = '<span class="qa-punto"></span>¿Quién eres? <u>Elige tu nombre</u> y la web te saludará a ti';
            a.addEventListener("click", abrirQuienEres);
            el.parentNode.insertBefore(a, el.parentNode.firstChild);
            return;
        }

        if (p.anonimo || !p.corto || !hola) return;

        if (esMiCumple(p)) {
            el.innerHTML = '<strong class="saludo-hora"></strong> <span class="saludo-coletilla"></span>';
            el.firstChild.textContent = "¡Feliz cumpleaños, " + p.corto + "! 🎉";
            el.lastChild.textContent = "Hoy las mates pueden esperar un poquito: disfruta tu día.";
            confeti();
        } else {
            /* «Buenas tardes, crack.» → «Buenas tardes, Lucía.» */
            var t = hola.textContent.trim();
            var final = /[?!]$/.test(t) ? t.slice(-1) : ".";
            var base = t.indexOf(",") > -1 ? t.slice(0, t.indexOf(",")) : t.replace(/[.?!]+$/, "");
            hola.textContent = base + ", " + p.corto + (final === "." && /\.$/.test(p.corto) ? "" : final);
            if (!el.querySelector(".quien-cambiar")) {
                var cambiar = document.createElement("button");
                cambiar.type = "button";
                cambiar.className = "quien-cambiar";
                cambiar.textContent = "¿No eres " + p.corto + "?";
                cambiar.addEventListener("click", abrirQuienEres);
                el.appendChild(cambiar);
            } else {
                el.querySelector(".quien-cambiar").textContent = "¿No eres " + p.corto + "?";
            }
            if (recienElegido) {
                hola.classList.remove("saludo-nuevo");
                void hola.offsetWidth;
                hola.classList.add("saludo-nuevo");
            }
        }
    }

    /* Confeti (solo el día de su cumpleaños) */
    function confeti() {
        if (movimientoReducido) return;
        var c = document.createElement("canvas");
        c.className = "confeti";
        document.body.appendChild(c);
        var ctx = c.getContext("2d"), W = c.width = innerWidth, H = c.height = innerHeight;
        var colores = ["#7048ff", "#2f6bff", "#ff6a45", "#3ddc97", "#ffc94d", "#ff7ab6"];
        var trozos = [];
        for (var i = 0; i < 160; i++) {
            trozos.push({
                x: W / 2 + (Math.random() - .5) * 120, y: H * .35,
                vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4,
                g: .32 + Math.random() * .1, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
                w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: colores[i % colores.length]
            });
        }
        var t0 = performance.now();
        (function paso(t) {
            ctx.clearRect(0, 0, W, H);
            trozos.forEach(function (p) {
                p.vy += p.g; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
                ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.cos(p.r * 2));
                ctx.restore();
            });
            if (t - t0 < 4200) requestAnimationFrame(paso); else c.remove();
        })(t0);
    }


    /* =====================================================
       12. TU ESPACIO: «Sigue donde lo dejaste», logros y
           «Mi media». Todo se guarda solo en el dispositivo.
    ===================================================== */

    function leerJSON(clave, def) {
        try { var v = JSON.parse(leer(clave) || "null"); return v === null ? def : v; } catch (e) { return def; }
    }

    /* ---------- Historial para «Sigue donde lo dejaste» ---------- */

    function apuntarVisita(titulo, sub, url) {
        guardar("ultimo-web", JSON.stringify({ titulo: titulo, sub: sub, url: url, t: Date.now() }));
    }

    function registrarVisita() {
        var h1 = document.querySelector(".banda h1, h1");
        var titulo = h1 ? limpiar(h1.querySelector(".h1-txt") ? h1.querySelector(".h1-txt").textContent : h1.textContent) : document.title;
        var pre = h1 && h1.querySelector(".h1-pre") ? limpiar(h1.querySelector(".h1-pre").textContent) : "";
        var curso = html.getAttribute("data-curso");

        if (html.getAttribute("data-cabecera") === "si" && (curso || pagina === "calculadora")) {
            var sub = (curso ? curso + ".º Bach · " : "") + (pre || (pagina === "calculadora" ? "Calculadora" : ""));
            apuntarVisita(titulo, sub, location.href.split("#")[0].split("?")[0]);

            /* temas distintos visitados (para el logro «Explorador») */
            if (document.querySelector(".tema-header")) {
                var vistos = leerJSON("temas-vistos", []);
                if (vistos.indexOf(location.pathname) === -1) { vistos.push(location.pathname); guardar("temas-vistos", JSON.stringify(vistos)); }
            }

            /* al abrir un vídeo concreto, lo apunta con su enlace directo */
            document.querySelectorAll("details").forEach(function (d, i) {
                d.addEventListener("toggle", function () {
                    if (!d.open) return;
                    var s = d.querySelector("summary");
                    apuntarVisita(limpiar(s && s.textContent), sub + " · " + titulo, location.href.split("#")[0].split("?")[0] + "?abrir=" + i);
                });
            });

            /* al abrir un PDF del tema */
            document.querySelectorAll("a.btn-tema").forEach(function (a) {
                a.addEventListener("click", function () {
                    var t = a.querySelector(".titulo");
                    apuntarVisita(limpiar(t && t.textContent) + " · " + titulo, sub, a.href);
                });
            });
        }
    }

    function pintarContinuar() {
        var u = leerJSON("ultimo-web", null);
        var lead = document.querySelector(".hero-lead");
        if (!u || !lead || Date.now() - u.t > 21 * 86400000) return;

        var a = document.createElement("a");
        a.className = "continuar";
        a.href = u.url;
        if (/^https?:/.test(u.url) && u.url.indexOf(location.host) === -1) { a.target = "_blank"; a.rel = "noopener"; }
        a.innerHTML =
            '<span class="ct-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>' +
            '<span class="ct-txt"><small>Sigue donde lo dejaste</small><strong></strong><em></em></span>' +
            '<span class="ct-fl">→</span>';
        a.querySelector("strong").textContent = u.titulo;
        a.querySelector("em").textContent = u.sub || "";
        lead.parentNode.insertBefore(a, lead.nextSibling);
    }


    /* ---------- Logros ---------- */

    var LOGROS = [
        { id: "madrugador", ic: "🌅", nombre: "Madrugador", pista: "Entra antes de las 8:00" },
        { id: "buho", ic: "🦉", nombre: "Búho nocturno", pista: "Entra entre las 23:00 y las 5:00" },
        { id: "finde", ic: "🛋️", nombre: "Ni el finde", pista: "Entra un sábado o un domingo" },
        { id: "racha3", ic: "🔥", nombre: "En racha", pista: "3 días seguidos entrando" },
        { id: "racha7", ic: "☄️", nombre: "Imparable", pista: "7 días seguidos entrando" },
        { id: "reto1", ic: "🎯", nombre: "Primer acierto", pista: "Acierta un reto del día" },
        { id: "reto10", ic: "🧠", nombre: "Cerebrito", pista: "Acierta 10 retos del día" },
        { id: "explorador", ic: "🧭", nombre: "Explorador", pista: "Visita 5 temas distintos" },
        { id: "previsor", ic: "📅", nombre: "Previsor", pista: "Añade un examen a tu calendario" },
        { id: "calculista", ic: "📈", nombre: "Calculista", pista: "Usa la calculadora de la normal" },
        { id: "repaso", ic: "🃏", nombre: "Memoria de elefante", pista: "Completa un mazo de tarjetas" }
    ];

    function misLogros() { return leerJSON("logros-web", {}); }

    function desbloquear(id) {
        var l = misLogros();
        if (l[id]) return;
        l[id] = Date.now();
        guardar("logros-web", JSON.stringify(l));
        var def = LOGROS.filter(function (x) { return x.id === id; })[0];
        if (def) avisoLogro(def);
        pintarLogros();
    }

    var colaLogros = [], mostrandoLogro = false;

    function avisoLogro(def) {
        colaLogros.push(def);
        if (!mostrandoLogro) siguienteLogro();
    }

    function siguienteLogro() {
        var def = colaLogros.shift();
        if (!def) { mostrandoLogro = false; return; }
        mostrandoLogro = true;
        var t = document.createElement("div");
        t.className = "logro-toast";
        t.innerHTML = '<span class="lt-ic"></span><span><small>Logro desbloqueado</small><strong></strong></span>';
        t.firstChild.textContent = def.ic;
        t.querySelector("strong").textContent = def.nombre;
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.classList.add("visible"); });
        setTimeout(function () { t.classList.remove("visible"); setTimeout(function () { t.remove(); siguienteLogro(); }, 450); }, 3200);
    }

    function comprobarLogros() {
        var ahora = new Date(), h = ahora.getHours(), d = ahora.getDay();
        if (h >= 5 && h < 8) desbloquear("madrugador");
        if (h >= 23 || h < 5) desbloquear("buho");
        if (d === 0 || d === 6) desbloquear("finde");
        var racha = leerJSON("racha-web", { n: 0 });
        if (racha.n >= 3) desbloquear("racha3");
        if (racha.n >= 7) desbloquear("racha7");
        var reto = leerJSON("reto-web", {});
        if (reto.aciertos >= 1) desbloquear("reto1");
        if (reto.aciertos >= 10) desbloquear("reto10");
        if (leerJSON("temas-vistos", []).length >= 5) desbloquear("explorador");
    }

    function pintarLogros() {
        var caja = document.getElementById("logros");
        if (!caja) return;
        var l = misLogros();
        var n = LOGROS.filter(function (x) { return l[x.id]; }).length;
        caja.querySelector(".lg-cuenta").textContent = n + " de " + LOGROS.length;
        caja.querySelector(".lg-barra span").style.width = (n / LOGROS.length * 100) + "%";
        caja.querySelector(".lg-rejilla").innerHTML = LOGROS.map(function (x) {
            var si = !!l[x.id];
            return '<div class="lg' + (si ? " si" : "") + '" title="' + x.pista + '">' +
                '<span class="lg-ic">' + (si ? x.ic : "🔒") + '</span>' +
                '<strong>' + x.nombre + '</strong><small>' + (si ? "¡Conseguido!" : x.pista) + '</small></div>';
        }).join("");
    }


    /* ---------- Mi media (Andalucía: media de competencias específicas) ----------
       El profe pone nota a cada CRITERIO. La nota de cada COMPETENCIA ESPECÍFICA
       es la media de sus criterios, y la nota final es la media de las
       competencias. Si cambian los criterios, basta con editar esta lista. */

    var COMPETENCIAS = [
        ["1", "Resolución de problemas", [["1.1", "Estrategias y herramientas para resolver problemas"], ["1.2", "Obtener todas las soluciones y describir el proceso"]]],
        ["2", "Comprobación y razonamiento", [["2.1", "Comprobar la validez de las soluciones"], ["2.2", "Elegir la solución más adecuada al contexto"]]],
        ["3", "Conjeturas e investigación", [["3.1", "Formular conjeturas y plantear problemas"], ["3.2", "Investigar con herramientas tecnológicas"]]],
        ["4", "Pensamiento computacional", [["4.1", "Modelizar y resolver con pensamiento computacional"]]],
        ["5", "Conexiones matemáticas", [["5.1", "Conectar ideas matemáticas entre sí"]]],
        ["6", "Matemáticas en contexto", [["6.1", "Resolver problemas de otros ámbitos"], ["6.2", "Valorar la aportación de las matemáticas"]]],
        ["7", "Representación", [["7.1", "Representar ideas con las herramientas adecuadas"], ["7.2", "Usar distintas formas de representación"]]],
        ["8", "Comunicación", [["8.1", "Comunicar con orden, terminología y rigor"], ["8.2", "Usar el lenguaje matemático con precisión"]]],
        ["9", "Destrezas personales y sociales", [["9.1", "Gestionar emociones y aprender del error"], ["9.2", "Perseverar y aceptar la crítica razonada"], ["9.3", "Trabajar en equipo"]]]
    ];

    /* Los exámenes se guardan así: [{ nombre, notas: { "1.1": "7", "2.1": "6,5" } }]
       y de ahí se sacan todas las notas de cada criterio. */
    function misExamenes() {
        var ex = leerJSON("examenes-media", null);
        if (ex) return ex;
        /* notas apuntadas con la versión anterior (por criterio) → un examen */
        var viejas = leerJSON("notas-criterios", null), notas = {}, hay = false;
        if (viejas) Object.keys(viejas).forEach(function (k) {
            var v = textosDe(viejas[k]);
            if (v.length) { notas[k] = v[0]; hay = true; }
        });
        return hay ? [{ nombre: "Notas anteriores", notas: notas }] : [];
    }

    function misNotas() {
        var porCriterio = {};
        misExamenes().forEach(function (e) {
            Object.keys(e.notas || {}).forEach(function (k) {
                if (String(e.notas[k]).trim() === "") return;
                (porCriterio[k] = porCriterio[k] || []).push(e.notas[k]);
            });
        });
        return porCriterio;
    }

    /* «6 7,5» → [6, 7.5] (se pueden poner varias notas de un mismo criterio) */
    function notasDe(valor) {
        var lista = Array.isArray(valor) ? valor : String(valor || "").split(/[\s;\/|]+/);
        return lista.map(leerNum).filter(function (n) { return n !== null && n >= 0 && n <= 10; });
    }

    function textosDe(valor) {
        if (Array.isArray(valor)) return valor;
        return String(valor || "").split(/[\s;\/|]+/).filter(function (x) { return x !== ""; });
    }

    function mediaDe(lista) {
        return lista.length ? lista.reduce(function (a, b) { return a + b; }, 0) / lista.length : null;
    }

    function calcularCompetencias(notas) {
        var res = COMPETENCIAS.map(function (ce) {
            var crit = ce[2].map(function (c) { return mediaDe(notasDe(notas[c[0]])); }).filter(function (n) { return n !== null; });
            return { id: ce[0], nombre: ce[1], nota: mediaDe(crit), criterios: crit.length };
        });
        var conNota = res.filter(function (r) { return r.nota !== null; });
        return { ces: res, final: mediaDe(conNota.map(function (r) { return r.nota; })), n: conNota.length };
    }

    function pintarMediaTile() {
        var el = document.getElementById("media-num");
        if (!el) return;
        var r = calcularCompetencias(misNotas());
        el.textContent = r.final !== null ? fmt(r.final, 2) : "—";
        var sub = document.getElementById("media-sub");
        if (sub) sub.textContent = r.n ? r.n + " de " + COMPETENCIAS.length + " competencias con nota" : "Apunta las notas de tus criterios";
    }

    var ventanaMedia = null;

    function abrirMedia() {
        if (!ventanaMedia) {
            ventanaMedia = crearVentana("v-media", "Solo en tu móvil", "Mi media",
                '<div class="cp-cuerpo">' +
                '<p class="cp-ayuda">Añade cada examen, marca los criterios que evalúa y pon la nota de cada uno. Cada criterio es la media de sus notas, cada competencia la media de sus criterios y tu nota la media de las competencias, como se evalúa en Andalucía.</p>' +
                '<div class="ex-lista"></div>' +
                '<button type="button" class="md-anadir ex-nuevo">+ Añadir examen</button>' +
                '<details class="ex-resumen"><summary>Ver mis notas por competencias</summary><div class="ex-ces"></div></details>' +
                '</div>' +
                '<div class="cp-resultado nm-resultado"><div class="cp-nota cp-nota-adm"><small>Tu nota (media de competencias)</small><strong id="md-media">—</strong></div>' +
                '<p class="cp-mensaje" id="md-detalle"></p></div>' +
                '<p class="cp-aviso">Orientativo. Las competencias sin ninguna nota todavía no cuentan en la media.</p>');

            var V = ventanaMedia;
            var lista = V.querySelector(".ex-lista");
            var examenes = misExamenes();
            var abierto = examenes.length ? -1 : 0;

            var DESCR = {};
            COMPETENCIAS.forEach(function (ce) { ce[2].forEach(function (c) { DESCR[c[0]] = c[1]; }); });

            function guardarTodo() {
                guardar("examenes-media", JSON.stringify(examenes));
                recalcular();
                pintarMediaTile();
            }

            function mediaExamen(e) {
                return mediaDe(Object.keys(e.notas || {}).map(function (k) { return leerNum(e.notas[k]); })
                    .filter(function (n) { return n !== null; }));
            }

            function pintar() {
                lista.innerHTML = "";
                if (!examenes.length) {
                    lista.innerHTML = '<p class="ex-vacio">Todavía no has apuntado ningún examen.</p>';
                }
                examenes.forEach(function (e, idx) {
                    e.notas = e.notas || {};
                    var sel = Object.keys(e.notas);
                    var card = document.createElement("div");
                    card.className = "ex-card" + (idx === abierto ? " abierto" : "");

                    var m = mediaExamen(e);
                    card.innerHTML =
                        '<div class="ex-cab">' +
                        '<button type="button" class="ex-plegar" aria-label="Abrir o cerrar"><span class="ex-flecha">›</span></button>' +
                        '<input class="ex-nombre" placeholder="Nombre del examen" autocomplete="off">' +
                        '<span class="ex-info">' + sel.length + (sel.length === 1 ? " criterio" : " criterios") + (m !== null ? " · " + fmt(m, 2) : "") + '</span>' +
                        '<button type="button" class="ex-borrar" aria-label="Borrar examen">×</button>' +
                        '</div>' +
                        '<div class="ex-cuerpo">' +
                        '<p class="ex-sub">¿Qué criterios evalúa?</p>' +
                        '<div class="ex-chips">' + COMPETENCIAS.map(function (ce) {
                            return '<div class="ex-grupo"><span class="ex-ce">CE ' + ce[0] + '</span>' + ce[2].map(function (c) {
                                return '<button type="button" class="ex-chip' + (sel.indexOf(c[0]) > -1 ? " si" : "") + '" data-c="' + c[0] + '" title="' + c[1] + '">' + c[0] + '</button>';
                            }).join("") + '</div>';
                        }).join("") + '</div>' +
                        (sel.length ? '<div class="ex-todas"><span>Misma nota para todos</span><input class="ex-misma" inputmode="decimal" placeholder="—" autocomplete="off"></div>' : '') +
                        '<div class="ex-notas">' + sel.sort().map(function (c) {
                            return '<label class="ex-fila"><span class="crit-cod">' + c + '</span><span class="crit-txt">' + (DESCR[c] || "") + '</span>' +
                                '<input data-c="' + c + '" inputmode="decimal" placeholder="—" autocomplete="off"></label>';
                        }).join("") + '</div>' +
                        '</div>';

                    var nom = card.querySelector(".ex-nombre");
                    nom.value = e.nombre || "";
                    nom.addEventListener("input", function () { e.nombre = nom.value; guardarTodo(); });

                    card.querySelector(".ex-plegar").addEventListener("click", function () {
                        abierto = abierto === idx ? -1 : idx; pintar();
                    });
                    card.querySelector(".ex-info").addEventListener("click", function () {
                        abierto = abierto === idx ? -1 : idx; pintar();
                    });

                    card.querySelector(".ex-borrar").addEventListener("click", function () {
                        if (!window.confirm("¿Borrar «" + (e.nombre || "este examen") + "»?")) return;
                        examenes.splice(idx, 1); abierto = -1; guardarTodo(); pintar();
                    });

                    card.querySelectorAll(".ex-chip").forEach(function (ch) {
                        ch.addEventListener("click", function () {
                            var c = ch.getAttribute("data-c");
                            if (c in e.notas) delete e.notas[c]; else e.notas[c] = "";
                            abierto = idx; guardarTodo(); pintar();
                        });
                    });

                    card.querySelectorAll(".ex-notas input").forEach(function (inp) {
                        inp.value = e.notas[inp.getAttribute("data-c")] || "";
                        inp.addEventListener("input", function () {
                            e.notas[inp.getAttribute("data-c")] = inp.value;
                            guardarTodo();
                            var mm = mediaExamen(e), n = Object.keys(e.notas).length;
                            card.querySelector(".ex-info").textContent = n + (n === 1 ? " criterio" : " criterios") + (mm !== null ? " · " + fmt(mm, 2) : "");
                        });
                    });

                    var misma = card.querySelector(".ex-misma");
                    if (misma) misma.addEventListener("input", function () {
                        card.querySelectorAll(".ex-notas input").forEach(function (inp) {
                            inp.value = misma.value;
                            e.notas[inp.getAttribute("data-c")] = misma.value;
                        });
                        guardarTodo();
                    });

                    lista.appendChild(card);
                });
            }

            V.querySelector(".ex-nuevo").addEventListener("click", function () {
                examenes.push({ nombre: "", notas: {} });
                abierto = examenes.length - 1;
                guardarTodo(); pintar();
                var ult = lista.lastElementChild;
                if (ult) { ult.scrollIntoView({ block: "nearest" }); ult.querySelector(".ex-nombre").focus(); }
            });

            function recalcular() {
                var r = calcularCompetencias(misNotas());
                V.querySelector(".ex-ces").innerHTML = r.ces.map(function (ce) {
                    return '<div class="ex-ce-fila' + (ce.nota !== null && ce.nota < 5 ? " baja" : "") + '"><span class="ce-num">CE ' + ce.id + '</span><span>' + ce.nombre + '</span><strong>' +
                        (ce.nota !== null ? fmt(ce.nota, 2) : "—") + '</strong></div>';
                }).join("");
                V.querySelector("#md-media").textContent = r.final !== null ? fmt(r.final, 2) : "—";
                V.querySelector("#md-detalle").textContent = r.n
                    ? "Media de " + r.n + (r.n === 1 ? " competencia" : " competencias") + " con nota."
                    : "Todavía no hay notas.";
            }

            pintar();
            recalcular();
        }
        ventanaMedia.abrir();
    }


    /* =====================================================
       13. TARJETAS DE REPASO (contenido en tarjetas.js)
    ===================================================== */

    var promesaTarjetas = null;

    function cargarTarjetas() {
        if (window.TARJETAS) return Promise.resolve(window.TARJETAS);
        if (promesaTarjetas) return promesaTarjetas;
        promesaTarjetas = new Promise(function (ok, mal) {
            var sc = document.createElement("script");
            sc.src = raiz + "tarjetas.js?v=2";
            sc.onload = function () { ok(window.TARJETAS || {}); };
            sc.onerror = mal;
            document.head.appendChild(sc);
        });
        return promesaTarjetas;
    }

    function claveTema(url) {
        var m = /(ccss[12])\/tema(\d+)\.html/.exec(url || "");
        return m ? m[1] + "/tema" + m[2] : null;
    }

    function barajar(a) {
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }

    /* ---------- Repetición espaciada (como Duolingo / Anki) ----------
       Cada tarjeta está en una «caja» del 0 al 5. Si la aciertas sube de
       caja y vuelve a salir más tarde (1, 3, 7, 14 o 30 días); si la fallas
       vuelve a la caja 0 y sale hoy. Se guarda solo en el dispositivo. */

    var INTERVALOS = [0, 1, 3, 7, 14, 30];

    function hoyNum() {
        var d = new Date();
        return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    }

    function memoria() { return leerJSON("srs-web", {}); }
    function claveCarta(mazo, carta) { return mazo + "|" + carta[0]; }

    function pendientesDe(mazo, cartas, mem) {
        var hoy = hoyNum();
        return cartas.filter(function (c) { var m = mem[claveCarta(mazo, c)]; return m && m.d <= hoy; });
    }

    /* Ordena un mazo: primero las pendientes de hoy, luego las nuevas y al final el resto */
    function ordenarMazo(mazo, cartas) {
        var mem = memoria(), hoy = hoyNum(), pend = [], nuevas = [], resto = [];
        cartas.forEach(function (c) {
            var m = mem[claveCarta(mazo, c)];
            if (!m) nuevas.push(c); else if (m.d <= hoy) pend.push(c); else resto.push(c);
        });
        return barajar(pend).concat(barajar(nuevas), barajar(resto));
    }

    function anotar(key, acierto, falladaAntes) {
        var mem = memoria(), m = mem[key] || { b: 0, d: 0 };
        if (acierto) m.b = falladaAntes ? 1 : Math.min(5, m.b + 1);
        else m.b = 0;
        m.d = hoyNum() + INTERVALOS[m.b];
        mem[key] = m;
        guardar("srs-web", JSON.stringify(mem));
    }

    /* Todas las tarjetas pendientes hoy de los temas publicados */
    function repasoDeHoy() {
        return Promise.all([cargarTarjetas(), cargarTemas()]).then(function (r) {
            var todas = r[0], mem = memoria(), lista = [];
            r[1].temas.forEach(function (t) {
                var k = claveTema(t.url);
                if (!todas[k]) return;
                pendientesDe(k, todas[k], mem).forEach(function (c) { lista.push({ mazo: k, carta: c }); });
            });
            return lista;
        });
    }

    var ventanaRepaso = null;

    /* abrirRepaso("ccss2/tema3", "Probabilidad")  o  abrirRepaso(null, "Repaso de hoy", [{mazo, carta}…]) */
    function abrirRepaso(clave, titulo, listaHoy) {
        cargarTarjetas().then(function (todas) {
            var items;
            if (listaHoy) items = barajar(listaHoy.slice());
            else {
                if (!todas[clave] || !todas[clave].length) return;
                items = ordenarMazo(clave, todas[clave]).map(function (c) { return { mazo: clave, carta: c }; });
            }
            if (!items.length) return;

            if (!ventanaRepaso) {
                ventanaRepaso = crearVentana("v-repaso", "Repaso rápido", "Tarjetas",
                    '<div class="cp-cuerpo rp-cuerpo">' +
                    '<div class="rp-progreso"><div class="rp-barra"><span></span></div><span class="rp-cuenta"></span></div>' +
                    '<div class="rp-escena"><button type="button" class="rp-tarjeta" aria-live="polite">' +
                    '<span class="rp-cara rp-frente"><small>Pregunta</small><span class="rp-estado"></span><span class="rp-texto"></span><em>Toca para ver la respuesta</em></span>' +
                    '<span class="rp-cara rp-dorso"><small>Respuesta</small><span class="rp-texto"></span></span>' +
                    '</button></div>' +
                    '<div class="rp-botones" hidden><button type="button" class="rp-otra">Repasar otra vez</button><button type="button" class="rp-se">¡Me la sé!</button></div>' +
                    '<div class="rp-fin" hidden><span class="rp-fin-ic">🎉</span><h3>¡Mazo completado!</h3><p></p><button type="button" class="b-boton rp-reiniciar">Empezar de nuevo</button></div>' +
                    '</div>');
            }

            var V = ventanaRepaso;
            V.querySelector(".cp-cabecera h2").textContent = titulo || "Tarjetas";

            var original = items.slice();
            var cola = items.slice(), total = items.length, sabidas = 0, intentos = 0, falladas = {};
            var tarjeta = V.querySelector(".rp-tarjeta");
            var botones = V.querySelector(".rp-botones");
            var fin = V.querySelector(".rp-fin");

            function mostrar() {
                V.querySelector(".rp-barra span").style.width = (sabidas / total * 100) + "%";
                V.querySelector(".rp-cuenta").textContent = sabidas + " de " + total + " sabidas";
                if (!cola.length) {
                    tarjeta.parentNode.hidden = true;
                    botones.hidden = true;
                    fin.hidden = false;
                    fin.querySelector("h3").textContent = listaHoy ? "¡Repaso de hoy hecho!" : "¡Mazo completado!";
                    fin.querySelector("p").textContent = (listaHoy ? "Has repasado las " + total + " tarjetas pendientes" : "Te sabes las " + total + " tarjetas") +
                        (intentos > total ? " (con " + (intentos - total) + " repasos extra)." : " a la primera. ¡Brutal!") +
                        " Las que has acertado volverán dentro de unos días para que no se te olviden.";
                    if (!listaHoy) desbloquear("repaso");
                    pintarRepasoHoy();
                    return;
                }
                tarjeta.parentNode.hidden = false;
                fin.hidden = true;
                tarjeta.classList.remove("girada");
                botones.hidden = true;
                var it = cola[0];
                var m = memoria()[claveCarta(it.mazo, it.carta)];
                var estado = tarjeta.querySelector(".rp-estado");
                estado.textContent = !m ? "Nueva" : m.d <= hoyNum() ? "Toca repasarla" : "Ya la sabías";
                estado.className = "rp-estado " + (!m ? "nueva" : m.d <= hoyNum() ? "toca" : "sabida");
                tarjeta.querySelector(".rp-frente .rp-texto").textContent = it.carta[0];
                tarjeta.querySelector(".rp-dorso .rp-texto").textContent = it.carta[1];
            }

            tarjeta.onclick = function () {
                tarjeta.classList.toggle("girada");
                botones.hidden = !tarjeta.classList.contains("girada");
            };
            V.querySelector(".rp-se").onclick = function () {
                var it = cola.shift(), k = claveCarta(it.mazo, it.carta);
                intentos++; sabidas++;
                anotar(k, true, !!falladas[k]);
                mostrar();
            };
            V.querySelector(".rp-otra").onclick = function () {
                var it = cola.shift(), k = claveCarta(it.mazo, it.carta);
                intentos++;
                if (!falladas[k]) anotar(k, false);
                falladas[k] = true;
                cola.splice(Math.min(cola.length, 3), 0, it);   /* vuelve a salir pronto */
                mostrar();
            };
            V.querySelector(".rp-reiniciar").onclick = function () { cola = barajar(original.slice()); sabidas = 0; intentos = 0; falladas = {}; mostrar(); };
            V.onkeydown = function (e) {
                if (e.key === " " && e.target === tarjeta) return;
                if (e.key === " ") { e.preventDefault(); tarjeta.click(); }
                if (!botones.hidden && e.key === "1") V.querySelector(".rp-otra").click();
                if (!botones.hidden && e.key === "2") V.querySelector(".rp-se").click();
            };

            mostrar();
            V.abrir();
            setTimeout(function () { tarjeta.focus(); }, 60);
        });
    }

    /* Aviso «Tienes N tarjetas para repasar hoy» (portada) */
    function pintarRepasoHoy() {
        var hueco = document.getElementById("repaso-hoy");
        if (!hueco) return;
        repasoDeHoy().then(function (lista) {
            if (!lista.length) { hueco.hidden = true; return; }
            hueco.hidden = false;
            hueco.innerHTML = '<span class="rh-ic">🃏</span><span class="rh-txt"><strong>Tienes ' + lista.length +
                (lista.length === 1 ? ' tarjeta' : ' tarjetas') + ' para repasar hoy</strong><small>Las que fallaste o te toca recordar. Unos minutos y listo.</small></span>' +
                '<span class="b-boton rh-boton">Repasar</span>';
            hueco.onclick = function () { abrirRepaso(null, "Repaso de hoy", lista); };
        }).catch(function () {});
    }

    /* En cada página de tema: bloque «Repaso rápido» */
    function repasoEnTema() {
        var clave = claveTema(location.pathname);
        var col = document.querySelector(".tema-columnas");
        if (!clave || !col) return;
        cargarTarjetas().then(function (todas) {
            var mazo = todas[clave];
            if (!mazo) return;
            var h1 = document.querySelector(".tema-header .h1-txt") || document.querySelector(".tema-header h1");
            var titulo = h1 ? limpiar(h1.textContent) : "Repaso";
            var bloque = document.createElement("section");
            bloque.className = "repaso-tema";
            bloque.innerHTML =
                '<div class="rt-pila"><span></span><span></span><span class="rt-top">?</span></div>' +
                '<div class="rt-txt"><p class="b-etiqueta">Repaso rápido</p><h2>Tarjetas del tema</h2>' +
                '<p>' + mazo.length + ' preguntas clave con su respuesta. Gíralas, marca las que te sabes y repite las que no.</p>' +
                '<button type="button" class="b-boton">Empezar el repaso <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6z"/></svg></button></div>';
            bloque.querySelector("button").addEventListener("click", function () { abrirRepaso(clave, titulo); });
            var pend = pendientesDe(clave, mazo, memoria()).length;
            if (pend) {
                var chip = document.createElement("span");
                chip.className = "rt-pendientes";
                chip.textContent = pend + (pend === 1 ? " para repasar hoy" : " para repasar hoy");
                bloque.querySelector(".b-etiqueta").appendChild(chip);
            }
            col.parentNode.insertBefore(bloque, col.nextSibling);
        }).catch(function () {});
    }

    /* Botón «Repasar este tema» en la tarjeta del próximo examen */
    function repasoEnExamen(caja, t) {
        var clave = claveTema(t.url);
        if (!clave || !caja) return;
        cargarTarjetas().then(function (todas) {
            if (!todas[clave] || caja.querySelector(".ep-repasar")) return;
            var b = document.createElement("button");
            b.type = "button";
            b.className = "ep-calendario ep-repasar";
            b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h12v14H4zM8 2h12v14h-2V4H8z"/></svg><span>Repasar tarjetas</span>';
            b.addEventListener("click", function () { abrirRepaso(clave, t.titulo.replace(/^Tema\s+\d+\s*:\s*/i, "")); });
            var cal = caja.querySelector(".ep-cal");
            if (cal) { cal.classList.add("ep-acciones-fila"); cal.insertBefore(b, cal.firstChild.nextSibling); } else caja.appendChild(b);
        }).catch(function () {});
    }

    /* Panel del móvil «Herramientas» → lista de mazos */
    function panelRepaso() {
        var p = panel("hoja-repaso", "Tarjetas de repaso", '<p class="hoja-cargando">Cargando…</p>');
        abrirPanel(p);
        Promise.all([cargarTarjetas(), cargarTemas(), repasoDeHoy()]).then(function (r) {
            var todas = r[0], temas = r[1].temas, hoy = r[2];
            window.__repasoHoy = hoy;
            p.querySelector(".hoja-cuerpo").innerHTML = (hoy.length ?
                '<button type="button" class="hoja-fila hf-hoy" data-accion-hoy="1"><span class="hf-num">🃏</span><span class="hf-txt"><strong>Repaso de hoy</strong><small>' +
                hoy.length + (hoy.length === 1 ? ' tarjeta pendiente' : ' tarjetas pendientes') + '</small></span><span class="hf-flecha">›</span></button><p class="hoja-grupo">Por temas</p>' : '') +
                temas.filter(function (t) { return todas[claveTema(t.url)]; }).map(function (t) {
                var partes = /^(Tema\s*\d+)\s*[:.·-]?\s*(.*)$/i.exec(t.titulo) || [null, t.titulo, ""];
                return '<button type="button" class="hoja-fila hf-tema" data-mazo="' + claveTema(t.url) + '" data-titulo="' + (partes[2] || partes[1]).replace(/"/g, "&quot;") + '">' +
                    '<span class="hf-num">' + partes[1].replace(/\D/g, "") + '</span><span class="hf-txt"><strong>' + (partes[2] || partes[1]) + '</strong><small>' +
                    todas[claveTema(t.url)].length + ' tarjetas</small></span><span class="hf-flecha">›</span></button>';
            }).join("");
        });
    }

    document.addEventListener("click", function (e) {
        if (e.target.closest("[data-accion-hoy]")) { cerrarPanel(); abrirRepaso(null, "Repaso de hoy", window.__repasoHoy || []); }
    });

    document.addEventListener("click", function (e) {
        var b = e.target.closest("[data-mazo]");
        if (!b) return;
        cerrarPanel();
        abrirRepaso(b.getAttribute("data-mazo"), b.getAttribute("data-titulo"));
    });


    /* =====================================================
       14. PERSONALIZACIÓN: color, favoritos y novedades
    ===================================================== */

    /* ---------- Color de la web ---------- */

    var COLORES = [
        ["violeta", "Violeta", "#7048ff", "#2f6bff"],
        ["azul", "Azul", "#2563eb", "#06b6d4"],
        ["verde", "Verde", "#059669", "#14b8a6"],
        ["coral", "Coral", "#e8432c", "#f59e0b"],
        ["rosa", "Rosa", "#db2777", "#8b5cf6"]
    ];

    function aplicarColor(id) {
        if (!id || id === "violeta") html.removeAttribute("data-color");
        else html.setAttribute("data-color", id);
        document.querySelectorAll(".color-op").forEach(function (b) {
            b.classList.toggle("si", b.getAttribute("data-col") === (id || "violeta"));
        });
    }

    aplicarColor(leer("color-web"));

    function selectorColores() {
        var actual = leer("color-web") || "violeta";
        return '<div class="colores">' + COLORES.map(function (c) {
            return '<button type="button" class="color-op' + (c[0] === actual ? " si" : "") + '" data-col="' + c[0] + '" aria-label="Color ' + c[1] + '" title="' + c[1] + '"' +
                ' style="background:linear-gradient(135deg,' + c[2] + ',' + c[3] + ')"></button>';
        }).join("") + '</div>';
    }

    document.addEventListener("click", function (e) {
        var b = e.target.closest(".color-op");
        if (!b) return;
        var id = b.getAttribute("data-col");
        guardar("color-web", id);
        aplicarColor(id);
    });

    function pintarColorTile() {
        var t = document.getElementById("tu-color");
        if (t) t.querySelector(".tc-colores").innerHTML = selectorColores();
    }


    /* ---------- Favoritos ---------- */

    function misFavs() { return leerJSON("favs-web", []); }

    function esFav(url) { return misFavs().some(function (f) { return f.url === url; }); }

    function alternarFav(fav) {
        var l = misFavs(), i = -1;
        l.forEach(function (f, j) { if (f.url === fav.url) i = j; });
        if (i > -1) l.splice(i, 1); else l.unshift(fav);
        guardar("favs-web", JSON.stringify(l.slice(0, 40)));
        return i === -1;
    }

    var SVG_ESTRELLA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';

    function botonFav(fav) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "fav" + (esFav(fav.url) ? " si" : "");
        b.innerHTML = SVG_ESTRELLA;
        b.setAttribute("aria-label", "Guardar en favoritos");
        b.title = "Guardar en favoritos";
        b.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var ahora = alternarFav(fav);
            b.classList.toggle("si", ahora);
            b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
        });
        return b;
    }

    /* Estrellas en los PDF de los temas y en cada apartado de vídeos */
    function estrellas() {
        var cab = document.querySelector(".banda h1");
        var titulo = cab ? limpiar((cab.querySelector(".h1-txt") || cab).textContent) : document.title;
        var curso = html.getAttribute("data-curso");
        var pre = cab && cab.querySelector(".h1-pre") ? limpiar(cab.querySelector(".h1-pre").textContent) : "";
        var sub = (curso ? curso + ".º Bach · " : "") + (pre ? pre + " · " : "") + titulo;
        var base = location.href.split("#")[0].split("?")[0];

        document.querySelectorAll("a.btn-tema").forEach(function (a) {
            if (a.querySelector(".fav") || /btn-deshabilitado/.test(a.className)) return;
            var t = a.querySelector(".titulo");
            a.appendChild(botonFav({ url: a.href, titulo: limpiar(t && t.textContent), sub: sub, externo: a.target === "_blank" }));
        });

        document.querySelectorAll("details.video-section, details.tema").forEach(function (d, i) {
            var s = d.querySelector("summary");
            if (!s || s.querySelector(".fav")) return;
            var idx = Array.prototype.indexOf.call(document.querySelectorAll("details"), d);
            s.appendChild(botonFav({ url: base + "?abrir=" + idx, titulo: limpiar(s.textContent), sub: sub }));
        });
    }

    function listaFavsHTML(max) {
        var l = misFavs().slice(0, max || 40);
        if (!l.length) return '<p class="fav-vacio">Toca la <span class="fav-mini">' + SVG_ESTRELLA + '</span> de cualquier vídeo o PDF y aparecerá aquí.</p>';
        return l.map(function (f) {
            return '<a class="fav-fila" href="' + f.url + '"' + (f.externo ? ' target="_blank" rel="noopener"' : '') + '>' +
                '<span class="fav-mini si">' + SVG_ESTRELLA + '</span><span class="fav-txt"><strong></strong><small></small></span><span class="hf-flecha">›</span></a>'
                .replace("<strong></strong>", "<strong>" + escaparHTML(f.titulo) + "</strong>")
                .replace("<small></small>", "<small>" + escaparHTML(f.sub || "") + "</small>");
        }).join("");
    }

    function escaparHTML(t) {
        return String(t || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
    }

    function pintarFavsTile() {
        var t = document.getElementById("mis-favs");
        if (t) t.querySelector(".mf-lista").innerHTML = listaFavsHTML(6);
    }

    function panelFavs() {
        abrirPanel(panel("hoja-favs", "Mis favoritos", listaFavsHTML()));
    }


    /* ---------- Novedades: temas nuevos, vídeos nuevos y fechas de examen ---------- */

    function huellaWeb(datos) {
        var h = { temas: {}, videos: [], recursos: {} };
        datos.temas.forEach(function (t) {
            h.temas[t.url] = t.fecha || 0;
            /* botones de cada tema: título → enlace */
            var r = {};
            (t.recursos || []).forEach(function (x) { if (!/videosyoutube|videospropios/.test(x.url)) r[x.titulo] = x.url; });
            h.recursos[t.url] = r;
        });
        datos.videos.forEach(function (v) { if (v.tipo === "video") h.videos.push(v.url.split("?")[0] + "|" + v.texto); });
        return h;
    }

    function misNovedades() { return leerJSON("novedades-web", []); }

    function comprobarNovedades() {
        if (pagina === "juego") return;
        cargarTemas().then(function (datos) {
            /* Si alguna página no se pudo leer, mejor no comparar: evita avisos que faltan o falsos */
            if (datos.incompleto) { pintarNovedades(); marcarNovedadesEnPagina(); return; }
            var ahora = huellaWeb(datos);
            var antes = leerJSON("visto-web", null);
            guardar("visto-web", JSON.stringify(ahora));
            if (!antes) { pintarNovedades(); return; }   /* primera visita: nada es «nuevo» */

            var nov = misNovedades();
            function añadir(n) { if (!nov.some(function (x) { return x.clave === n.clave; })) nov.push(n); }
            function corto(t) { return t.titulo; }

            datos.temas.forEach(function (t) {
                if (!(t.url in antes.temas)) {
                    añadir({ clave: "tema|" + t.url, tipo: "tema", url: t.url, tema: t.url,
                        texto: "Nuevo: " + corto(t) + (t.fecha && t.fecha > Date.now() ? " · examen el " + new Date(t.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "long" }) : "") });
                } else if (t.fecha && t.fecha !== antes.temas[t.url] && t.fecha > Date.now()) {
                    añadir({ clave: "fecha|" + t.url + "|" + t.fecha, tipo: "fecha", url: t.url, tema: t.url,
                        texto: "Fecha de examen: " + corto(t).replace(/:.*$/, "") + " · " + new Date(t.fecha).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) });
                }
            });

            /* Botones nuevos o con el enlace cambiado (PDF, carpetas…) */
            if (antes.recursos) datos.temas.forEach(function (t) {
                var previos = antes.recursos[t.url];
                if (!previos) return;   /* tema nuevo: ya se avisa arriba */
                var actuales = ahora.recursos[t.url] || {};
                var nombre = corto(t).replace(/:.*$/, "");
                Object.keys(actuales).forEach(function (tit) {
                    if (!(tit in previos)) {
                        añadir({ clave: "rec|" + t.url + "|" + tit + "|" + actuales[tit], tipo: "pdf", url: t.url, tema: t.url,
                            recurso: tit, estado: "nuevo", texto: "Nuevo en " + nombre + ": " + tit });
                    } else if (previos[tit] !== actuales[tit]) {
                        añadir({ clave: "rec|" + t.url + "|" + tit + "|" + actuales[tit], tipo: "pdf", url: t.url, tema: t.url,
                            recurso: tit, estado: "actualizado", texto: "Actualizado en " + nombre + ": " + tit });
                    }
                });
            });

            var nuevosVideos = {};
            datos.videos.forEach(function (v) {
                if (v.tipo !== "video") return;
                var k = v.url.split("?")[0] + "|" + v.texto;
                if (antes.videos.indexOf(k) === -1) (nuevosVideos[v.url.split("?")[0]] = nuevosVideos[v.url.split("?")[0]] || []).push(v);
            });
            Object.keys(nuevosVideos).forEach(function (pag) {
                var vs = nuevosVideos[pag];
                añadir({ clave: "videos|" + pag + "|" + vs.map(function (v) { return v.texto; }).join(","), tipo: "video", url: vs[0].url,
                    pagina: pag, videos: vs.map(function (v) { return v.texto; }),
                    texto: (vs.length === 1 ? "Vídeo nuevo: " + vs[0].texto : vs.length + " vídeos nuevos") + " · " + vs[0].donde.split(" · ").slice(1, 3).join(" · ") });
            });

            guardar("novedades-web", JSON.stringify(nov.slice(-12)));
            pintarNovedades();
            marcarNovedadesEnPagina();
        }).catch(function () {});
    }

    /* Novedades de un tema (contando las de sus páginas de vídeos) */
    function novedadesDeTema(urlTema) {
        var base = urlTema.replace(/\/tema(\d+)\.html.*$/, "");
        var num = (/tema(\d+)\.html/.exec(urlTema) || [])[1];
        return misNovedades().filter(function (n) {
            if (n.tema === urlTema) return true;
            var pag = n.pagina || (n.tipo === "video" ? n.url.split("?")[0] : "");
            return pag && pag.indexOf(base + "/") === 0 && new RegExp("/tema" + num + "\\.html$").test(pag);
        });
    }

    /* En la página del tema (o de sus vídeos): señala cada cosa nueva y la da por vista */
    function marcarNovedadesEnPagina() {
        var aqui = location.href.split("#")[0].split("?")[0];
        var nov = misNovedades();
        var vistas = [];

        nov.forEach(function (n) {
            var pag = n.pagina || (n.tipo === "video" ? n.url.split("?")[0] : "");

            if (n.tema === aqui) {
                vistas.push(n.clave);
                if (n.tipo === "pdf") {
                    var nombre = n.recurso || (/:\s*(.+)$/.exec(n.texto) || [])[1];
                    var estado = n.estado || (/^Actualizado/.test(n.texto) ? "actualizado" : "nuevo");
                    document.querySelectorAll("a.btn-tema").forEach(function (a) {
                        var t = a.querySelector(".titulo");
                        if (t && limpiar(t.textContent) === nombre) marcarElemento(a, t, estado === "actualizado" ? "Actualizado" : "Nuevo");
                    });
                }
                if (n.tipo === "fecha") {
                    var h2 = document.querySelector(".aviso-examen h2");
                    if (h2) marcarElemento(document.querySelector(".aviso-examen"), h2, "Fecha nueva");
                }
            }

            /* En el tema: el botón que lleva a esos vídeos avisa de que hay vídeos nuevos */
            if (n.tipo === "video" && pag !== aqui) {
                document.querySelectorAll("a.btn-tema").forEach(function (b) {
                    if (b.href.split("#")[0].split("?")[0] === pag) {
                        var t = b.querySelector(".titulo") || b;
                        var cuantos = (n.videos || []).length;
                        marcarElemento(b, t, cuantos > 1 ? cuantos + " vídeos nuevos" : "Vídeo nuevo");
                    }
                });
            }

            if (n.tipo === "video" && pag === aqui) {
                vistas.push(n.clave);
                document.querySelectorAll("details").forEach(function (d) {
                    var su = d.querySelector("summary");
                    if (su && (n.videos || []).indexOf(limpiar(su.textContent)) > -1) marcarElemento(d, su, "Nuevo");
                });
            }
        });

        if (vistas.length) {
            guardar("novedades-web", JSON.stringify(nov.filter(function (n) { return vistas.indexOf(n.clave) === -1; })));
            pintarNovedades();
        }
    }

    function marcarElemento(caja, dondeEtiqueta, texto) {
        if (!caja || caja.querySelector(".nv-badge")) return;
        caja.classList.add("es-novedad");
        var b = document.createElement("span");
        b.className = "nv-badge" + (texto === "Actualizado" ? " nv-badge-act" : "");
        b.textContent = texto;
        dondeEtiqueta.appendChild(b);
    }

    function borrarNovedades() {
        guardar("novedades-web", "[]");
        pintarNovedades();
    }

    function pintarNovedades() {
        var nov = misNovedades();
        var hay = nov.length > 0;

        /* punto en la pestaña Temas (móvil) y en «CCSS II» del menú (ordenador) */
        var tab = document.querySelector('.tab[data-tab="temas"]');
        if (tab) tab.classList.toggle("con-novedad", hay);
        document.querySelectorAll("#menu-container .menu-dropdown").forEach(function (dd) {
            var algun = false;
            dd.querySelectorAll(".dropdown-content a").forEach(function (a) {
                var n = novedadesDeTema(a.href.split("#")[0].split("?")[0]).length;
                a.classList.toggle("con-novedad", n > 0);
                if (n > 0) algun = true;
            });
            dd.classList.toggle("con-novedad", algun);
        });

        var caja = document.getElementById("novedades-aviso");
        if (!caja) return;
        if (!hay) { caja.hidden = true; return; }
        caja.hidden = false;
        caja.innerHTML = '<div class="nv-cab"><span class="nv-ic">✨</span><strong>Novedades desde tu última visita</strong>' +
            '<button type="button" class="nv-cerrar" aria-label="Marcar como visto">Entendido</button></div>' +
            '<div class="nv-lista">' + nov.map(function (n) {
                return '<a class="nv-item nv-' + n.tipo + '" href="' + n.url + '"><span class="nv-tipo">' +
                    (n.tipo === "tema" ? "Tema" : n.tipo === "fecha" ? "Examen" : n.tipo === "pdf" ? "Material" : "Vídeos") + '</span><span>' + escaparHTML(n.texto) + '</span></a>';
            }).join("") + '</div>';
        caja.querySelector(".nv-cerrar").onclick = borrarNovedades;
        caja.querySelectorAll(".nv-item").forEach(function (a) { a.addEventListener("click", borrarNovedades); });
    }


    /* =====================================================
       15. «AHORA»: el tema que toca, con su material
           (tema del próximo examen; si no hay, el último
           tema publicado de 2.º)
    ===================================================== */

    function temaDeAhora(datos) {
        var ahora = Date.now();
        var futuros = datos.temas.filter(function (t) { return t.fecha && t.fecha > ahora; })
            .sort(function (a, b) { return a.fecha - b.fecha; });
        if (futuros.length) return futuros[0];
        var de2 = datos.temas.filter(function (t) { return t.curso === 2; });
        return de2.length ? de2[de2.length - 1] : datos.temas[datos.temas.length - 1];
    }

    function pintarAhora() {
        var sec = document.getElementById("ahora");
        if (!sec) return;
        cargarTemas().then(function (datos) {
            var t = temaDeAhora(datos);
            if (!t || !t.recursos || !t.recursos.length) return;

            var partes = /^(Tema\s*\d+)\s*[:.·-]?\s*(.*)$/i.exec(t.titulo) || [null, t.titulo, ""];
            document.getElementById("ahora-titulo").textContent = partes[2] || partes[1];

            document.getElementById("ahora-desc").textContent = partes[1] + " · " + t.curso + ".º Bachillerato";

            /* Examen: fecha + cuenta atrás pequeña + calendario y tarjetas */
            var viejo = sec.querySelector(".ah-examen");
            if (viejo) viejo.remove();
            if (t.fecha && t.fecha > Date.now()) {
                var ex = document.createElement("div");
                ex.className = "ah-examen";
                ex.innerHTML =
                    '<span class="ah-ex-et"><span class="ah-punto"></span>Examen · <span class="ah-ex-fecha"></span></span>' +
                    '<div class="ep-cuenta ah-cuenta" data-fecha="' + t.fecha + '">' +
                    '<div><strong>--</strong><small>d</small></div>' +
                    '<div><strong>--</strong><small>h</small></div>' +
                    '<div><strong>--</strong><small>min</small></div>' +
                    '<div><strong>--</strong><small>s</small></div>' +
                    '</div>' +
                    '<div class="ah-acciones"></div>';
                ex.querySelector(".ah-ex-fecha").textContent =
                    new Date(t.fecha).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) + " h";
                sec.querySelector(".seccion-cab").appendChild(ex);
                botonCalendario(ex.querySelector(".ah-acciones"), t);
                repasoEnExamen(ex.querySelector(".ah-acciones"), t);
                actualizarCuentas();
            }

            var grid = document.getElementById("ahora-grid");
            grid.innerHTML = "";
            /* Solo los tres primeros botones del tema; el resto, en «Abrir el tema completo» */
            t.recursos.slice(0, 3).forEach(function (r) {
                var a = document.createElement("a");
                a.className = "ah-item";
                a.href = r.url;
                if (r.fuera) { a.target = "_blank"; a.rel = "noopener"; }
                a.innerHTML = '<span class="ah-ic"></span><span class="ah-txt"><strong></strong><small></small></span>';
                a.querySelector(".ah-ic").textContent = r.ic || "📄";
                a.querySelector("strong").textContent = r.titulo;
                a.querySelector("small").textContent = r.sub || "";
                a.addEventListener("click", function () { apuntarVisita(r.titulo + " · " + partes[1], t.curso + ".º Bach · " + (partes[2] || ""), r.url); });
                grid.appendChild(a);
            });

            var ver = document.createElement("a");
            ver.className = "ah-item ah-ver";
            ver.href = t.url;
            var resto = t.recursos.length - 3;
            ver.innerHTML = '<span class="ah-txt"><strong>Abrir el tema completo</strong><small>' + (resto > 0 ? '+' + resto + ' recursos más, vídeos y tarjetas' : 'Vídeos, curiosidades y tarjetas') + '</small></span><span class="ah-flecha">→</span>';
            grid.appendChild(ver);

            sec.hidden = false;
            prepararAparicion();
        }).catch(function () {});
    }


    /* ---------- Ordenador: ventanas de Favoritos y Ajustes (en el móvil
       están en la barra de abajo y en «Más») ---------- */

    var ventanaFavs = null, ventanaAjustes = null;

    function abrirFavsVentana() {
        if (!ventanaFavs) ventanaFavs = crearVentana("v-favs", "Tus guardados", "Mis favoritos", '<div class="cp-cuerpo fav-cuerpo"></div>');
        ventanaFavs.querySelector(".fav-cuerpo").innerHTML = listaFavsHTML();
        ventanaFavs.abrir();
    }

    function abrirAjustes() {
        if (!ventanaAjustes) {
            ventanaAjustes = crearVentana("v-ajustes", "Solo en este dispositivo", "Ajustes", '<div class="cp-cuerpo aj-cuerpo"></div>');
        }
        var p = miPerfil(), noche = html.getAttribute("data-tema") === "noche";
        var c = ventanaAjustes.querySelector(".aj-cuerpo");
        c.innerHTML =
            '<div class="aj-fila"><span class="aj-txt"><strong>Tu color</strong><small>Cambia el color de toda la web</small></span>' + selectorColores() + '</div>' +
            '<button type="button" class="aj-fila aj-noche"><span class="aj-txt"><strong>Modo noche</strong><small>Fondo oscuro, ideal por la noche</small></span>' +
            '<span class="interruptor' + (noche ? " on" : "") + '"><span></span></span></button>' +
            '<button type="button" class="aj-fila aj-quien"><span class="aj-txt"><strong>' + (p && p.nombre ? "Eres " + escaparHTML(p.nombre) : "¿Quién eres?") + '</strong>' +
            '<small>' + (p && p.nombre ? "Toca para cambiarlo" : "Elige tu nombre para que la web te salude") + '</small></span><span class="hf-flecha">›</span></button>';
        c.querySelector(".aj-noche").onclick = function () {
            var nuevo = html.getAttribute("data-tema") === "noche" ? "claro" : "noche";
            aplicarTema(nuevo);
            guardar("tema-web", nuevo);
            c.querySelector(".interruptor").classList.toggle("on", nuevo === "noche");
        };
        c.querySelector(".aj-quien").onclick = function () { ventanaAjustes.querySelector(".cp-cerrar").click(); abrirQuienEres(); };
        ventanaAjustes.abrir();
    }


    /* =====================================================
       ARRANQUE
    ===================================================== */

    document.addEventListener("DOMContentLoaded", function () {

        prepararCabeceras();

        if (pagina === "inicio") {
            lienzoHero();
            saludoYRacha();
            ocurrenciaDelDia();
            aplicarPerfil(false);
            pintarLogros();
            pintarMediaTile();
            pintarRepasoHoy();
            pintarAhora();
            var bm = document.getElementById("abrir-media");
            if (bm) bm.addEventListener("click", abrirMedia);
            proximoExamen();
            retoDelDia();
            var bc = document.getElementById("abrir-calculadora");
            if (bc) bc.addEventListener("click", abrirCalculadora);
            var bn = document.getElementById("abrir-normal");
            if (bn) bn.addEventListener("click", abrirNormal);
            var bcs = document.getElementById("abrir-calculadoras");
            if (bcs) bcs.addEventListener("click", abrirCalculadoras);
        }

        botonArriba();
        barraInferior();
        registrarVisita();
        repasoEnTema();
        estrellas();
        setTimeout(comprobarNovedades, 900);
        /* el menú llega más tarde: repintar el punto de novedades */
        setTimeout(pintarNovedades, 1500);
        setTimeout(comprobarLogros, 1500);
        abrirApartado();
        prepararAparicion();

        /* Las tarjetas que llegan más tarde (menú, noticias…) también aparecen */
        setTimeout(prepararAparicion, 600);
    });

})();
