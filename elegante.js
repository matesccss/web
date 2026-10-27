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

    function pedir(url) {
        return fetch(url, { cache: "no-cache" })
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
            .then(function (t) { return new DOMParser().parseFromString(t, "text/html"); });
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
                        t.recursos.push({ titulo: tit, url: new URL(href, t.url).href });
                    });
                    return t;
                }).catch(function () { t.titulo = t.nombre; t.fecha = null; t.recursos = []; return t; });
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
                }).catch(function () { p.apartados = []; return p; });
            })).then(function (paginasVideo) {

                var datos = { temas: temas, videos: [] };

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

                try { sessionStorage.setItem("indice-web", JSON.stringify({ t: Date.now(), datos: datos })); } catch (e) {}

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

            caja.hidden = false;
            botonCalendario(caja, t);

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

        function gauss(x, m, s) {
            return Math.exp(-((x - m) * (x - m)) / (2 * s * s));
        }

        function dibujar(ahora) {

            var t = (ahora - t0) / 1000;
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
                g.addColorStop(0, "rgba(140, 115, 255, .16)");
                g.addColorStop(1, "rgba(140, 115, 255, .02)");
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
            ga.addColorStop(0, "rgba(120, 140, 255, .35)");
            ga.addColorStop(1, "rgba(120, 140, 255, .02)");
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
            gl.addColorStop(0, "#7a5cff");
            gl.addColorStop(.5, "#5b8cff");
            gl.addColorStop(1, "#ff7a59");
            ctx.beginPath();
            for (var q = -1; q <= 1.0001; q += .005) {
                var yq = gauss(q, m, s);
                if (q === -1) ctx.moveTo(X(q), Y(yq)); else ctx.lineTo(X(q), Y(yq));
            }
            ctx.strokeStyle = gl;
            ctx.lineWidth = 2.6;
            ctx.shadowColor = "rgba(120, 130, 255, .9)";
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
                ctx.shadowColor = "rgba(160, 170, 255, 1)";
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
                ctx.shadowColor = "#9d8cff";
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
            ["Buenas noches, trasnochador.", "Dato: dormir bien mejora la memoria. Repasa un poco y a la cama."]
        ]],
        [6, 9, [
            ["Buenos días, madrugador.", "Tú y el sol, los primeros en ponerse en marcha."],
            ["Buenos días, gente madrugadora.", "Café, Cola Cao o lo que haga falta: hoy toca darlo todo."],
            ["Arriba, madrugador.", "Las mañanas tempranas tienen algo de superpoder."]
        ]],
        [9, 14, [
            ["Buenos días.", "Cabeza fresca, mañana por delante: el mejor momento para entender algo nuevo."],
            ["Buenos días, crack.", "Las matrices no se van a multiplicar solas."],
            ["Hola, buenos días.", "Hoy es un buen día para que algo que no entendías, por fin haga clic."]
        ]],
        [14, 17, [
            ["Buenas tardes.", "Hora de la siesta… o de unas derivadas. Tú decides."],
            ["Buenas tardes, campeón.", "Después de comer, un repaso ligero entra mejor de lo que parece."],
            ["Hola, buenas tardes.", "Sobremesa con estadística: más entretenida de lo que suena."]
        ]],
        [17, 21, [
            ["Buenas tardes.", "Momento perfecto para repasar un poco y quitártelo de encima."],
            ["Buenas tardes, crack.", "Un rato de mates ahora y la tarde entera es tuya."],
            ["Hola, buenas tardes.", "Merienda, apuntes y a por ello."]
        ]],
        [21, 24, [
            ["Buenas noches.", "Último repaso del día y a descansar, que mañana también hay clase."],
            ["Buenas noches, noctámbulo.", "Lo que repases ahora, tu cerebro lo ordena mientras duermes."],
            ["Buenas noches, búho.", "Un ejercicio más y a dormir. Palabra de profe."]
        ]]
    ];

    var SALUDOS_ESPECIALES = {
        viernes: ["¡Por fin viernes!", "Un vistazo rápido a lo de la semana y a disfrutar del finde."],
        sabado: ["Feliz sábado.", "Hoy toca descansar… aunque un repasito ligero no hace daño a nadie."],
        domingo: ["Feliz domingo.", "El clásico domingo de repaso. Mejor ahora que el lunes a primera hora."]
    };

    function ocurrenciaDelDia() {

        var el = document.getElementById("ocurrencia");
        if (!el) return;

        var ahora = new Date();
        var h = ahora.getHours();
        var dia = ahora.getDay();           /* 0 domingo … 6 sábado */
        var n = Math.floor((Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()) - Date.UTC(2026, 0, 1)) / 86400000);

        var par = null;

        if (dia === 5 && h >= 15 && h < 21) par = SALUDOS_ESPECIALES.viernes;
        else if (dia === 6 && h >= 9 && h < 21) par = SALUDOS_ESPECIALES.sabado;
        else if (dia === 0 && h >= 9 && h < 21) par = SALUDOS_ESPECIALES.domingo;

        if (!par) {
            for (var i = 0; i < SALUDOS.length; i++) {
                if (h >= SALUDOS[i][0] && h < SALUDOS[i][1]) {
                    var opciones = SALUDOS[i][2];
                    par = opciones[((n % opciones.length) + opciones.length) % opciones.length];
                    break;
                }
            }
        }

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
        v.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });

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


    /* ---------- Añadir el examen al calendario (.ics) ---------- */

    function botonCalendario(caja, t) {
        if (!caja || caja.querySelector(".ep-calendario")) return;

        function f(d) {
            return d.getFullYear() + dosCifras(d.getMonth() + 1) + dosCifras(d.getDate()) + "T" +
                dosCifras(d.getHours()) + dosCifras(d.getMinutes()) + "00";
        }

        var ini = new Date(t.fecha);
        var fin = new Date(t.fecha + 60 * 60 * 1000);
        var ahora = new Date();
        var titulo = "Examen de Matemáticas CCSS · " + t.titulo;

        var ics = [
            "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//IES El Molinillo//Matematicas CCSS//ES", "CALSCALE:GREGORIAN",
            "BEGIN:VEVENT",
            "UID:examen-" + t.fecha + "@matematicas-ccss",
            "DTSTAMP:" + f(ahora),
            "DTSTART:" + f(ini),
            "DTEND:" + f(fin),
            "SUMMARY:" + titulo.replace(/[,;]/g, "\\$&"),
            "DESCRIPTION:Repasa en " + t.url,
            "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Mañana tienes examen de Matemáticas", "END:VALARM",
            "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", "DESCRIPTION:Queda una semana para el examen de Matemáticas", "END:VALARM",
            "END:VEVENT", "END:VCALENDAR"
        ].join("\r\n");

        var a = document.createElement("a");
        a.className = "ep-calendario";
        a.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
        a.setAttribute("download", "examen-matematicas.ics");
        a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 8v9H5v-9h14zm-8 2v2H9v2h2v2h2v-2h2v-2h-2v-2h-2z"/></svg>' +
            '<span>Añadir a mi calendario</span>';
        a.title = "Te avisará una semana antes y el día anterior";
        caja.appendChild(a);
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
        abrirApartado();
        prepararAparicion();

        /* Las tarjetas que llegan más tarde (menú, noticias…) también aparecen */
        setTimeout(prepararAparicion, 600);
    });

})();
