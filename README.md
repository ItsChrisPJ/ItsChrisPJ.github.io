# Portafolio · Chris Toloza

Sitio estático (HTML + CSS + JS, sin dependencias ni build) publicado con GitHub Pages en
**https://itschrispj.github.io**. Estética Hyprland / Waybar / Tokyo Night.

## Estructura

```
index.html            contenido de toda la página
404.html              página de error con estilo terminal
favicon.svg
robots.txt · sitemap.xml
assets/css/style.css  temas (variables CSS) y estilos
assets/js/main.js     waybar, lanzador Ctrl+K, temas, filtros, animaciones
assets/og.png         imagen que se ve al compartir el link (1200×630)
```

## Cómo editar

- **Textos y proyectos:** todo está en `index.html`, con comentarios `<!-- ===== SECCIÓN ===== -->`.
  Cada proyecto es un `<article class="card project">`.
- **Agregar un proyecto:** copia un `<article>` existente, cambia título/descripción/etiquetas y
  `data-cat="ia escritorio web movil"` (lo usan los filtros).
- **Capturas reales:** reemplaza el `<svg>` dentro de `<div class="shot">` por
  `<img src="assets/img/axioma.png" alt="Captura de Axioma" loading="lazy">`.
- **Colores / temas:** variables al inicio de `assets/css/style.css`
  (`tokyo`, `mocha`, `gruvbox`, `latte`). El tema por defecto está en `<html data-theme="tokyo">`.
- **Email y usuario de GitHub:** constantes `EMAIL` y `GH_USER` al inicio de `assets/js/main.js`
  y los enlaces `mailto:` / `github.com` en `index.html`.

## Probar en local

```bash
python3 -m http.server 8000   # y abrir http://localhost:8000
```

## Detalles

- Accesible: navegación por teclado, `skip-link`, `aria-current`, contraste AA en los 4 temas,
  respeta `prefers-reduced-motion`.
- Funciona sin JavaScript (el JS solo añade animaciones, temas y el lanzador).
- SEO: metadatos Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`.
