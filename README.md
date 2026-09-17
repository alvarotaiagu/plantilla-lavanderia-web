# Escuma — plantilla de lavandería

> **Sitio de demostración.** «Escuma, lavandería» es un **negocio ficticio**. El nombre,
> la dirección (Rúa do Pozo, 6 · Vilagarcía de Arousa), el teléfono (986 00 00 73), el
> horario, los precios, las máquinas y los plazos son **datos de muestra inventados**. No
> corresponden a ningún negocio real. La página lleva `noindex, nofollow` a propósito.

**Demo:** https://alvarotaiagu.github.io/plantilla-lavanderia-web/

---

## El concepto: «Etiqueta»

Toda la información que una lavandería necesita ya está escrita en la etiqueta que pica
en el cuello: a qué temperatura, con lejía o sin ella, secadora sí o no, plancha, seco.
El problema es que **nadie sabe leerla**. Así que la etiqueta es aquí el sistema visual
entero y, de paso, la herramienta útil de la página:

- El hero **es una etiqueta cosida**, con sus dos pespuntes y sus cinco símbolos.
- La primera sección es un **descifrador**: pulsas el símbolo que tienes delante y te
  dice qué significa, en castellano y sin tecnicismos. Es lo que de verdad hace falta.
- Los mismos símbolos son el icono de la casa, el favicon y el 404 (el de «no usar
  secadora», para una página que se ha encogido).

Registro visual: verde jabón sobre blanco verdoso, con el amarillo del autoservicio. Ni
el blanco clínico de la óptica ni el papel crudo de la enoteca.

## Mapa de secciones

| # | Sección | Qué hace |
|---|---|---|
| — | Hero | La etiqueta cosida con sus cinco símbolos |
| 01 | Tu etiqueta | **El descifrador**: doce símbolos y lo que significan |
| 02 | Servicios | Precios por kilo y por prenda, y «lo que no hacemos» |
| 03 | Autoservicio | Las cuatro máquinas con su tamaño, su uso y su precio |
| 04 | Cuándo lo tienes | La fecha de entrega **calculada en vivo** desde la hora que sea |
| 05 | Dónde estamos | Horario **en vivo**, mapa bajo clic y formulario de recogida |

## Recursos de movimiento

1. **Lenis** como único motor de scroll.
2. **El descifrador** — el recurso protagonista: selección de símbolo con salida que
   entra animada, y que funciona igual sin GSAP.
3. **Titulares letra a letra**.
4. **Entradas** escalonadas de símbolos, filas de tabla y máquinas.
5. **Botones magnéticos** y **cursor** en forma de burbuja.
6. **Fecha de entrega y horario en vivo**, con el tramo de hoy resaltado.

## Rendimiento medido

`PerformanceObserver` de `longtask` en la pasada de verificación (Chromium, 1440×900,
recorrido completo con la rueda): **1 tarea larga, de 78 ms, al arrancar** (GSAP +
webfont) y **0 mientras se recorre la página**.

## Cómo reskinearlo a una lavandería real

1. **Los símbolos y el descifrador se generan juntos.** El script `gensimbolos.js` que
   acompaña a la plantilla escribe los doce SVG **y** el HTML de los botones, con su
   `data-nombre` y su `data-texto`. Para cambiar una explicación se toca el script y se
   vuelve a montar: así el dibujo y el texto no se desincronizan nunca.
2. **Precios** — la `<table>` de `#servicios` y la lista de `#autoservicio`.
3. **Horarios** — sección 5 de `js/main.js`: `AUTOSERVICIO` es un único tramo (abre todos
   los días) y `MOSTRADOR` va por día, en minutos desde medianoche, con `0 = domingo`.
   El `<dl>` de `#visita` lleva su `data-dias` para resaltar el de hoy.
4. **El plazo de entrega** se calcula en esa misma sección: 24 horas desde ahora y a
   esperar al primer tramo de mostrador. Si el plazo es otro, se cambia el `24` de
   `24 * 60 * 60 * 1000`.
5. **Datos del negocio** — el `application/ld+json` del `<head>`, la sección «Dónde
   estamos», el `<footer>` y la consulta del mapa (sección 10 de `js/main.js`).
   Quitar `noindex, nofollow` y el sello de demostración.
6. **Paleta y tipografía** — las variables de `:root` en `css/estilo.css`.

## Decisiones tomadas

- **Cero fotografías.** Una lavandería se cuenta mejor con sus símbolos, y así no hay
  fotos de ropa ajena ni créditos pendientes.
- **Los símbolos son genéricos** y se dice en el aviso legal: no reproducen la marca de
  nadie, y las explicaciones son de mostrador, no una norma técnica.
- **El descifrador es contenido, no adorno**: funciona sin GSAP y con
  `prefers-reduced-motion`; lo que se apaga es la animación de la salida.
- **Sin `aggregateRating` ni `review`** en los datos estructurados, y sin testimonios.
- **«Lo que no hacemos»** está escrito en la propia página, que es lo que evita
  discusiones en el mostrador.
- **Lo de «una sola vez» va con `IntersectionObserver`**, no con `ScrollTrigger`
  `once: true`.

## Créditos

Ver [`CREDITOS.md`](CREDITOS.md). No hay fotografías: todo es dibujo propio.

## Técnico

HTML + CSS + un `main.js`. Sin framework, sin build, sin backend, sin npm. GSAP,
ScrollTrigger y Lenis por CDN. Se abre con doble clic en `index.html` y se publica tal
cual en GitHub Pages.
