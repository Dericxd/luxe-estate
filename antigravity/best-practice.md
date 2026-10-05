# 🏡 Buenas Prácticas: Real Estate con Next.js

Guía rápida y condensada de estándares, arquitectura, rendimiento y producto para aplicaciones inmobiliarias de alto impacto.

---

## 🏗️ 1. Arquitectura, Next.js & Data Fetching

- **RSC por defecto (React Server Components)**: Renderiza listados, fichas de propiedad y páginas de agentes en el servidor para minimizar el bundle JavaScript.
- **Client Components aislados**: Limita `'use client'` a interactividad pura (mapas, filtros, sliders, calculadoras).
- **Listados y Búsqueda (SSR)**: Renderizado dinámico leyendo y evaluando `searchParams` en servidor para procesar filtros exactos en tiempo real.
- **Páginas de Propiedades (ISR/Caché Dinámico)**: Sirve propiedades desde CDN usando generación estática con revalidación por eventos (`revalidatePath` / `revalidateTag`) al cambiar precios o estado, combinando velocidad extrema y datos recientes.
- **Páginas Generales (SSG)**: Renderiza de forma 100% estática páginas inmutables como Contacto, Nosotros, Equipo o FAQ.
- **Streaming & Suspense**: Usa `loading.tsx` y skeletons refinados (ej. tarjetas parpadeantes) en lugar de pantallas en blanco para no bloquear el First Contentful Paint (FCP).
- **Server Actions + Zod**: Procesa formularios (contacto, visitas, leads) con validación tipada y segura en el servidor.
- **Paginación en Backend**: Delega siempre la partición de datos (cláusulas `LIMIT` / `OFFSET`) directamente a SQL/Supabase. Evita saturar el cliente trayendo todas las filas al navegador.

---

## ⚡ 2. Rendimiento Multimedia & Assets

- **LCP con `next/image`**: Asigna `priority` y `fetchPriority="high"` a la imagen principal de cada propiedad. Su uso debe ser estricto para asegurar optimización automática a WebP/AVIF y lazy-loading nativo en el resto de imágenes.
- **Cero saltos visuales (CLS)**: Implementa `placeholder="blur"` con `blurDataURL` (BlurHash / LQIP) en todas las fotos pesadas para evitar layout shifts mientras cargan.
- **Formatos y Tamaños**: Define atributos `sizes` responsivos según la cuadrícula y el dispositivo.
- **Componentes Pesados (Mapas)**: Usa `next/dynamic({ ssr: false })` para aplicar carga diferida (lazy loading) forzosa en clientes pesados como Leaflet, Mapbox o Google Maps.
- **CDNs Especializados**: Externaliza siempre el alojamiento de imágenes masivas en plataformas dedicadas (Supabase Storage, AWS S3 o Cloudinary) en lugar del servidor de la aplicación.
- **Virtualización de listas**: Emplea virtualización (`@tanstack/react-virtual`) en búsquedas para renderizar solo lo visible.

---

## 🔍 3. SEO Técnico & Indexación

- **URLs Amigables y Slugs Semánticos**: Construye rutas descriptivas (ej. `/propiedades/casa-baleares-3-recamaras-zapopan`) en lugar de IDs aleatorios (`/propiedades/123e4567`). Esto mejora radicalmente el CTR (Click-Through Rate) en los resultados de Google y aporta palabras clave directamente en la URL.
- **Metadata Dinámica (`generateMetadata`)**: Configura títulos y descripciones exactas por página (ej. `[Tipo] en [Operación] en [Ubicación] - [Precio]`). Esto aumenta la relevancia para búsquedas long-tail muy específicas.
- **OpenGraph & Twitter Cards Dinámicos**: Inyecta imágenes (ej. 1200x630) y resúmenes de la propiedad (precio, recámaras) en `[slug]/page.tsx` usando `@vercel/og`. Dado que gran parte del tráfico inmobiliario ocurre al compartir links por WhatsApp o Facebook, una previsualización atractiva es vital para la captación.
- **Rich Snippets (Schema.org JSON-LD)**: Inserta objetos estructurados (`SingleFamilyResidence`, `Offer`, `PostalAddress`) directamente en tus Server Components usando un tag `<script type="application/ld+json">`. Con la evolución de las búsquedas impulsadas por IA (Google AI Overviews / SGE), estos esquemas permiten a los motores de búsqueda mostrar el precio, la disponibilidad y la imagen directamente en los resultados (Rich Results).
- **Sitemaps Programáticos (`app/sitemap.ts`)**: Implementa sitemaps dinámicos y paginados. Las inmobiliarias actualizan su inventario a diario; un sitemap automático asegura la rápida indexación de nuevas propiedades sin esperas.
- **Control de Indexación y Canónicas**: Usa URLs canónicas (`rel="canonical"`) y restringe en `robots.ts` combinaciones infinitas de filtros de búsqueda para evitar la dilución del PageRank por contenido duplicado.

---

## 🎨 4. UX / UI & Conversión

- **Enfoque Mobile-First**: Garantiza un diseño priorizado para celular. Las galerías de imágenes inmersivas deben reaccionar nativamente a gestos táctiles (swipes).
- **Skeletons de Carga Activos**: En conjunto con `React Suspense`, muestra "esqueletos" de tarjetas mientras se traen los datos para mantener al usuario perceptualmente enganchado.
- **Filtros URL-First & Adherentes**: Sincroniza el estado de búsqueda en la URL (`SearchParams`). Los controles de filtrado siempre deben acompañar al usuario (Bottom Sheet fijo en móvil, Sidebar pegajoso/sticky en escritorio).
- **Debounce en Entradas**: Introduce pausas (ej. 500ms) en barras de búsqueda en texto libre para no bombardear la base de datos con peticiones por cada tecla pulsada.
- **Marcadores con "Optimistic UI"**: Al dar "Favorito" o "Like", cambia el estado visual (corazón rojo) instantáneamente en el cliente antes de que el servidor responda, dando una sensación de latencia cero.
- **Vista Híbrida (Split View)**: Listado de propiedades sincronizado en tiempo real con un mapa interactivo (Mapas con Clustering para agrupar pines).
- **Conversión Directa**: Botones flotantes a WhatsApp (con mensaje prellenado), agendamiento ágil de visitas y tarjeta de agente inmobiliario siempre visible.

---

## 🔒 5. Datos, Backend & Seguridad

- **Inyección de Índices**: Indexa siempre a nivel base de datos las métricas más consultadas (precio, ubicación, habitaciones, tipo de transacción). Evita severamente los *Full Table Scans* en tablas que crecerán a miles de filas.
- **Búsqueda Geoespacial**: Si la aplicación escala, requiere PostGIS (ej. `ST_DWithin` y funciones vectoriales) en Supabase para búsquedas precisas por radio perimetral y polígono.
- **Semántica Racional en Catálogos**: Aísla las comodidades (Amenities) y categorías múltiples en tablas puente normalizadas, nunca como cadenas de texto CSV amontonadas en una sola columna.
- **Protección Antispam**: Implementa rate-limiting (`@upstash/ratelimit`) y verificación invisible (Cloudflare Turnstile) en formularios de leads.
- **Seguridad y Roles (RBAC)**: Define políticas RLS (Row Level Security) estrictas para proteger lo que pueden ver/editar clientes, agentes y administradores.

---

## 🛡️ 6. Cuentas y Privacidad

- **Cookies de Sesión (Server-side)**: Mantén la autenticación limpia y delegada al servidor, enviando tokens únicamente a través de cookies seguras y `HTTP-Only`, gestionadas en el Middleware de Next.js.
- **Restricción de Rutas con Middleware**: Protege paneles de control de agencias y administradores operando desde el Edge Runtime (middleware de Next.js) para bloquear el acceso y redireccionar antes de que se intente renderizar la página protegida.
- **Alta Social Integrada**: Reduce la fricción de registro mediante inicio de sesión OAuth2 limpio, pidiendo los permisos mínimos indispensables con cuentas de Google o Apple.

---

## 🚨 7. Errores y Retención

- **Página de Error Estilizada (`error.tsx`)**: Intercepta fallos de lado del cliente o servidor de forma controlada, ofreciendo una pantalla estética de disculpas con un botón para "Intentar de nuevo", evitando que toda la aplicación colapse (White Screen of Death).
- **Manejo 404 Inteligente (Smart 404)**: Si un cliente entra a una ficha de propiedad que ha sido eliminada, rentada o vendida, **no** muestres una página genérica de "No Encontrado". En su lugar, muestra un mensaje *"Probablemente esta propiedad ya se ocupó, pero aquí tienes X opciones similares por la misma zona y precio"*. Es crítico para la retención de leads.

---

## 💡 8. Recomendaciones & Funciones de Alto Valor

- **Staging Virtual con IA**: Muestra espacios vacíos amoblados o remodelados digitalmente en múltiples estilos.
- **Valuación Inteligente (AVM)**: Estimador automático de precio de mercado comparando inmuebles similares de la zona.
- **Búsqueda en Lenguaje Natural**: Barra de búsqueda con IA que entienda peticiones complejas en texto libre.
- **Score de Barrio (Walk Score)**: Métricas de conectividad, colegios, transporte, seguridad y servicios cercanos.
- **Comparador Lado a Lado**: Comparación simultánea de 3-4 propiedades (precio/m², gastos comunes, amenidades).
- **Alertas y Favoritos**: Notificaciones push y por email al bajar de precio o ingresar propiedades similares.
- **Dossier en PDF**: Descarga automática de ficha técnica comercial de la propiedad con el branding de la agencia.
