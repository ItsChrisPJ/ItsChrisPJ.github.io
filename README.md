# Portafolio · Chris Toloza

Sitio estático (HTML + CSS + JS, sin dependencias ni build) publicado con GitHub Pages en
**https://itschrispj.github.io**. Estética: un café de noche visto desde la calle, con lluvia en el
vidrio, un letrero de neón y los proyectos como comandas colgadas en el riel de la cocina.

## Estructura

```
index.html            contenido de toda la página
404.html              página de error ("Esta mesa no existe")
favicon.svg
robots.txt · sitemap.xml
assets/css/style.css  paleta (variables CSS), tipografías y estilos
assets/js/main.js     entrada, ambiente (lluvia, ciudad, luces, sonido), filtros, comanda
assets/fonts/         tipografías autoalojadas (woff2)
assets/og.png         imagen que se ve al compartir el link (1200×630)
```

## Cómo editar

- **Textos y proyectos:** todo está en `index.html`, con comentarios `<!-- ===== SECCIÓN ===== -->`.
  Cada proyecto es un `<article class="project">` (una "comanda").
- **Agregar un proyecto:** copia un `<article>` existente, cambia título/descripción/etiquetas y
  `data-cat="ia escritorio web movil backend iot cliente"` (lo usan los filtros).
- **Capturas reales:** reemplaza el `<svg>` dentro de `<div class="shot">` por
  `<img src="assets/img/axioma.png" alt="Captura de Axioma" loading="lazy">`.
- **Colores:** variables al inicio de `assets/css/style.css` (noche, luces ámbar y rosa, papel térmico).
- **Comanda del inicio:** bloque `.ticket` dentro de `.printer` en `index.html`.
- **Email:** constante `EMAIL` al inicio de `assets/js/main.js` y los enlaces `mailto:` en `index.html`.

## Ambiente y rendimiento

La primera vez que se entra, un letrero "Cerrado" pide elegir el nivel de efectos
(Completo, Equilibrado o Ligero) y si se quiere sonido de lluvia (generado con Web Audio, sin archivos).
La elección se guarda en el navegador y se cambia con el botón **Ambiente**. El nivel recomendado se
calcula según el equipo y se respeta `prefers-reduced-motion`.

### Ciudad que pasa

Detrás de todo corre una ciudad nocturna en loop (de derecha a izquierda, con capas a distinta
velocidad, calle con farolas, un café encendido y autos que cruzan de vez en cuando). Se dibuja con
canvas en pixel art, sin imágenes ni video. Al bajar del inicio se atenúa para no estorbar la lectura.

- **Velocidad:** campo `speed` de cada capa en `genCity()` y `streetSpeed` (`assets/js/main.js`).
- **Tamaño y densidad de los edificios:** `hMin`, `hMax`, `p` (ventanas encendidas) y `sign` (neones) por capa.
- **Otra ciudad:** cambia la semilla `mulberry(20241110)` en `genCity()`.
- **Dirección:** se invierte cambiando el signo del desplazamiento en `drawCity()`.
- Se apaga en el modo Ligero y con `prefers-reduced-motion` (queda una imagen fija).

## Probar en local

```bash
python3 -m http.server 8000   # y abrir http://localhost:8000
```

## Detalles

- Accesible: navegación por teclado, `skip-link`, `aria-current`, diálogos nativos, contraste AA.
- Funciona sin JavaScript (el JS solo añade la entrada, los efectos y los filtros).
- SEO: metadatos Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`.
- Tipografías: Big Shoulders Display, Figtree, Courier Prime y Sacramento (licencia OFL), autoalojadas.
