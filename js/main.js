/* ==========================================================================
   Escuma — lavandería (SITIO DE DEMOSTRACIÓN, negocio ficticio)
   Concepto «Etiqueta»: el recurso protagonista es el descifrador. Los doce
   símbolos de cuidado son a la vez el sistema visual de la casa y la
   herramienta útil de la página.

   - `has-motion` solo se enciende si GSAP y ScrollTrigger existen de verdad.
   - El descifrador y la fecha de entrega son CONTENIDO: funcionan sin GSAP y
     con movimiento reducido.
   - Lo de «una sola vez» va con IntersectionObserver: un ScrollTrigger con
     once:true no dispara si el elemento ya está en pantalla al crearse.
   ========================================================================== */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var gsapReady = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var motion = gsapReady && !reduce.matches;

  if (gsapReady) {
    gsap.registerPlugin(ScrollTrigger);
    if (motion) raiz.classList.add('has-motion');
  }

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function alEntrar(el, hacer, margen) {
    if (!('IntersectionObserver' in window)) { hacer(); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        hacer();
      });
    }, { rootMargin: margen || '0px 0px -8% 0px' });
    io.observe(el);
  }

  /* ── 1. Scroll suave ─────────────────────────────────────────────────── */
  var lenis = null;
  if (motion && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var destino = document.getElementById(id.slice(1));
      if (!destino) return;
      e.preventDefault();
      cerrarMenu();
      if (lenis) lenis.scrollTo(destino, { offset: -70 });
      else destino.scrollIntoView();
      destino.setAttribute('tabindex', '-1');
      destino.focus({ preventScroll: true });
    });
  });

  /* ── 2. El descifrador (recurso protagonista) ────────────────────────── */
  (function descifrador() {
    var botones = $$('.descifra__simbolo');
    var nombre = $('[data-salida-nombre]');
    var texto = $('[data-salida-texto]');
    if (!botones.length || !nombre) return;

    function elegir(btn) {
      botones.forEach(function (b) {
        var es = b === btn;
        b.classList.toggle('esta-activo', es);
        b.setAttribute('aria-pressed', String(es));
      });
      nombre.textContent = btn.getAttribute('data-nombre');
      texto.textContent = btn.getAttribute('data-texto');
      if (motion) {
        gsap.fromTo([nombre, texto],
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.05, immediateRender: false });
      }
    }
    botones.forEach(function (b) { b.addEventListener('click', function () { elegir(b); }); });
  })();

  /* ── 3. Titulares letra a letra ──────────────────────────────────────── */
  function partir(el) {
    var original = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', original);
    el.textContent = '';
    var letras = [];
    original.split(' ').forEach(function (palabra, i, todas) {
      var cont = document.createElement('span');
      cont.className = 'palabra';
      cont.setAttribute('aria-hidden', 'true');
      palabra.split('').forEach(function (c) {
        var s = document.createElement('span');
        s.className = 'palabra__letra';
        s.textContent = c;
        cont.appendChild(s);
        letras.push(s);
      });
      el.appendChild(cont);
      if (i < todas.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return letras;
  }

  if (motion) {
    $$('[data-char]').forEach(function (el) {
      var letras = partir(el);
      // `y: 0` explícito: GSAP leería un translate heredado del CSS como px
      gsap.set(letras, { y: 0, yPercent: 60, opacity: 0 });
      var anim = { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.015 };
      if (el.closest('.hero')) gsap.to(letras, Object.assign({ delay: 0.15 }, anim));
      else alEntrar(el, function () { gsap.to(letras, anim); });
    });
  }

  /* ── 4. Entradas ─────────────────────────────────────────────────────── */
  if (motion) {
    [['.kicker', 12], ['.indice', 12], ['.parrafo', 14], ['.hero__entrada', 14],
     ['.hero__acciones', 14], ['.etiqueta', 22], ['.descifra__simbolo', 10],
     ['.descifra__salida', 18], ['.tabla tbody tr', 10], ['.servicios__nota', 18],
     ['.maquinas li', 16], ['.cuando__cuenta', 16], ['.pasos li', 12],
     ['.donde', 16], ['.formulario', 18]
    ].forEach(function (par) {
      $$(par[0]).forEach(function (el, i) {
        var enHero = !!el.closest('.hero');
        var ajustes = {
          opacity: 1, y: 0, duration: 0.65, ease: 'power2.out',
          startAt: { y: par[1] },
          delay: enHero ? 0.35 + i * 0.09 : (i % 6) * 0.04
        };
        if (enHero) gsap.to(el, ajustes);
        else alEntrar(el, function () { gsap.to(el, ajustes); });
      });
    });
  }

  /* ── 5. Horarios: estado y fecha de entrega (contenido vivo) ─────────── */
  (function horarios() {
    // Horario ficticio. 0 = domingo. Minutos desde medianoche.
    // El autoservicio abre todos los días; el mostrador, no.
    var AUTOSERVICIO = [420, 1380];                 // 07:00 – 23:00
    var MOSTRADOR = {
      0: [],
      1: [[540, 840], [990, 1200]],
      2: [[540, 840], [990, 1200]],
      3: [[540, 840], [990, 1200]],
      4: [[540, 840], [990, 1200]],
      5: [[540, 840], [990, 1200]],
      6: [[570, 840]]
    };
    var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var estado = $('[data-estado]');
    var filas = $$('[data-horario] > div');
    var entrega = $('[data-entrega]');

    function dd(n) { return String(n).padStart(2, '0'); }
    function txt(m) { return dd(Math.floor(m / 60)) + ':' + dd(m % 60); }

    function refrescar() {
      var ahora = new Date();
      var d = ahora.getDay();
      var min = ahora.getHours() * 60 + ahora.getMinutes();

      if (estado) {
        if (min >= AUTOSERVICIO[0] && min < AUTOSERVICIO[1]) {
          estado.textContent = 'Autoservicio abierto · hasta las ' + txt(AUTOSERVICIO[1]);
          estado.classList.add('esta-abierto');
        } else {
          estado.textContent = 'Cerrado · abre a las ' + txt(AUTOSERVICIO[0]);
          estado.classList.remove('esta-abierto');
        }
      }

      filas.forEach(function (f) {
        var dias = (f.getAttribute('data-dias') || '').split(',');
        f.classList.toggle('es-hoy', dias.indexOf(String(d)) !== -1);
      });

      // Entrega: 24 horas desde ahora, esperando al primer tramo de mostrador.
      if (entrega) {
        var objetivo = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
        for (var intento = 0; intento < 8; intento++) {
          var dd2 = objetivo.getDay();
          var tramos = MOSTRADOR[dd2];
          var m = objetivo.getHours() * 60 + objetivo.getMinutes();
          var hueco = null;
          for (var i = 0; i < tramos.length; i++) {
            if (m <= tramos[i][1] - 30) { hueco = Math.max(m, tramos[i][0]); break; }
          }
          if (hueco !== null) {
            objetivo.setHours(Math.floor(hueco / 60), hueco % 60, 0, 0);
            break;
          }
          objetivo.setDate(objetivo.getDate() + 1);
          objetivo.setHours(0, 0, 0, 0);
        }
        var mismoDia = objetivo.toDateString() === ahora.toDateString();
        var manana = new Date(ahora.getTime() + 86400000);
        var esManana = objetivo.toDateString() === manana.toDateString();
        var cuando = mismoDia ? 'hoy' : (esManana ? 'mañana' : 'el ' + DIAS[objetivo.getDay()] +
          ' ' + objetivo.getDate());
        entrega.textContent = cuando + ' a partir de las ' +
          dd(objetivo.getHours()) + ':' + dd(objetivo.getMinutes());
      }
    }
    refrescar();
    setInterval(refrescar, 30000);
  })();

  /* ── 6. Botones magnéticos ───────────────────────────────────────────── */
  if (motion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('[data-iman]').forEach(function (el) {
      var qx = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      var qy = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var c = el.getBoundingClientRect();
        qx((e.clientX - (c.left + c.width / 2)) * 0.3);
        qy((e.clientY - (c.top + c.height / 2)) * 0.4);
      });
      el.addEventListener('pointerleave', function () { qx(0); qy(0); });
      el.addEventListener('blur', function () { qx(0); qy(0); });
    });
  }

  /* ── 7. Cursor: una burbuja ──────────────────────────────────────────── */
  (function cursor() {
    var el = $('[data-cursor]');
    if (!el || !motion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var texto = $('.cursor__texto', el);
    var qx = gsap.quickTo(el, 'x', { duration: 0.2, ease: 'power3.out' });
    var qy = gsap.quickTo(el, 'y', { duration: 0.2, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) { qx(e.clientX); qy(e.clientY); });

    var zonas = [
      ['.descifra__simbolo', 'qué es'],
      ['.etiqueta', 'tu etiqueta'],
      ['[data-mapa-boton]', 'cargar'],
      ['a, button, input, select', 'venga']
    ];
    document.addEventListener('pointerover', function (e) {
      for (var i = 0; i < zonas.length; i++) {
        if (e.target.closest(zonas[i][0])) {
          el.classList.add('es-grande');
          texto.textContent = zonas[i][1];
          return;
        }
      }
      el.classList.remove('es-grande');
      texto.textContent = '';
    });
  })();

  /* ── 8. Cabecera ─────────────────────────────────────────────────────── */
  (function cabecera() {
    var el = $('[data-cabecera]');
    if (!el) return;
    function mirar() { el.classList.toggle('esta-pegada', window.scrollY > 20); }
    mirar();
    window.addEventListener('scroll', mirar, { passive: true });
  })();

  /* ── 9. Menú móvil ───────────────────────────────────────────────────── */
  var boton = $('[data-menu-boton]');
  var menu = $('[data-menu]');
  function cerrarMenu() {
    if (!boton || !menu) return;
    boton.setAttribute('aria-expanded', 'false');
    menu.classList.remove('esta-abierto');
  }
  if (boton && menu) {
    boton.addEventListener('click', function () {
      var abierto = boton.getAttribute('aria-expanded') === 'true';
      boton.setAttribute('aria-expanded', String(!abierto));
      menu.classList.toggle('esta-abierto', !abierto);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });
  }

  /* ── 10. Mapa solo bajo clic ─────────────────────────────────────────── */
  (function mapa() {
    var caja = $('[data-mapa]');
    var btn = $('[data-mapa-boton]');
    if (!caja || !btn) return;
    btn.addEventListener('click', function () {
      var marco = document.createElement('iframe');
      marco.src = 'https://www.google.com/maps?q=' + encodeURIComponent('Rúa do Pozo 6, Vilagarcía de Arousa') + '&output=embed';
      marco.title = 'Mapa de la dirección de muestra: Rúa do Pozo, 6, Vilagarcía de Arousa';
      marco.loading = 'lazy';
      marco.referrerPolicy = 'no-referrer-when-downgrade';
      btn.remove();
      caja.insertBefore(marco, caja.firstChild);
      if (gsapReady) ScrollTrigger.refresh();
    });
  })();

  /* ── 11. Formulario de recogida (de muestra) ─────────────────────────── */
  (function recogida() {
    var form = $('[data-recogida]');
    if (!form) return;
    var salida = $('[data-recogida-estado]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = form.querySelector('#nombre');
      var tel = form.querySelector('#tel');
      if (!nombre.value.trim()) { salida.textContent = 'Escribe un nombre para la recogida.'; nombre.focus(); return; }
      if (!tel.value.trim()) { salida.textContent = 'Hace falta un teléfono para avisarte al llegar.'; tel.focus(); return; }
      salida.textContent = 'Formulario de demostración: la recogida de ' + nombre.value.trim() + ' no se ha pedido en ningún sitio.';
    });
  })();

  /* ── 12. Aviso de cookies ────────────────────────────────────────────── */
  (function cookies() {
    var banner = $('[data-cookies]');
    if (!banner) return;
    var CLAVE = 'escuma-cookies';
    var visto = null;
    try { visto = localStorage.getItem(CLAVE); } catch (err) { visto = null; }
    if (!visto) banner.hidden = false;
    var ok = $('[data-cookies-ok]', banner);
    if (ok) {
      ok.addEventListener('click', function () {
        banner.hidden = true;
        try { localStorage.setItem(CLAVE, '1'); } catch (err) { /* modo privado */ }
      });
    }
  })();

  /* ── 13. Refrescos ───────────────────────────────────────────────────── */
  if (gsapReady) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
})();
