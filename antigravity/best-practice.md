# 🏡 Buenas Prácticas: Real Estate con Next.js

Guía rápida y condensada de estándares, arquitectura, rendimiento y producto para aplicaciones inmobiliarias de alto impacto.

---

## 🏗️ 1. Arquitectura & Next.js (App Router)

- **RSC por defecto**: Renderiza listados, fichas de propiedad y páginas de agentes en el servidor para minimizar el bundle JavaScript.
- **Client Components aislados**: Limita `'use client'` a interactividad pura (mapas, filtros, sliders, calculadoras).
- **ISR & On-Demand Revalidation**: Sirve propiedades desde CDN con revalidación por eventos (`revalidatePath` / `revalidateTag`) al cambiar precios o estado.
- **Streaming & Suspense**: Usa `loading.tsx` y skeletons refinados para no bloquear el First Contentful Paint (FCP).
- **Server Actions + Zod**: Procesa formularios (contacto, visitas, leads) con validación tipada y segura en el servidor.
- **Filtros URL-First**: Sincroniza siempre el estado de búsqueda en la URL (`SearchParams`) para permitir compartir enlaces, historial y bookmarks.

---

## ⚡ 2. Rendimiento Multimedia & Core Web Vitals

- **LCP con `next/image`**: Asigna `priority` y `fetchPriority="high"` a la imagen principal de cada propiedad.
- **Cero saltos visuales (CLS)**: Implementa `placeholder="blur"` con `blurDataURL` (BlurHash / LQIP) en todas las fotos.
- **Formatos y Tamaños**: Sirve imágenes en AVIF/WebP y define atributos `sizes` responsivos según la cuadrícula.
- **Carga diferida de medios pesados**: Aplica lazy loading bajo demanda en tours 3D (Matterport), recorridos virtuales y videos.
- **Virtualización de listas**: Emplea virtualización (`@tanstack/react-virtual`) en búsquedas con cientos de resultados.

---

## 🔍 3. SEO Técnico & Indexación

- **Metadata Dinámica**: Configura `generateMetadata` con títulos precisos: `[Tipo] en [Operación] en [Ubicación] - [Precio]`.
- **OpenGraph Dinámico**: Genera tarjetas visuales automáticas (`@vercel/og`) con foto, precio y specs para WhatsApp y redes sociales.
- **Schema.org JSON-LD**: Inserta datos estructurados (`RealEstateListing`, `SingleFamilyResidence`, `Offer`, `GeoCoordinates`, `PostalAddress`).
- **Sitemaps Dinámicos**: Implementa `sitemap.ts` paginado para indexar catálogos extensos y landing pages por zona.
- **Control de Indexación**: Usa URLs canónicas y restringe en `robots.ts` combinaciones infinitas de filtros de búsqueda.

---

## 🎨 4. UX / UI & Conversión

- **Vista Híbrida (Split View)**: Listado de propiedades sincronizado en tiempo real con un mapa interactivo.
- **Selectores de Vista**: Ofrece cambio rápido entre Cuadrícula (Grid), Lista detallada (List) y Mapa completo.
- **Mapas con Clustering**: Agrupa pines de propiedades y muestra precios directos en los marcadores.
- **Conversión Directa**:
  - Botón flotante a WhatsApp con mensaje prellenado del inmueble (ID, título y enlace).
  - Agendamiento de visitas con selector de fecha/hora.
  - Tarjeta de agente visible con foto, datos de contacto y reputación.
- **Simulador Hipotecario**: Calculadora interactiva de cuota mensual según enganche, plazo y tasa de interés.
- **Galería Inmersiva**: Lightbox optimizado para móviles con gestos táctiles (swipe) y fotos por categorías.

---

## 🔒 5. Datos, Backend & Seguridad

- **Búsqueda Geoespacial**: Utiliza PostGIS / Supabase (`ST_DWithin`, índices GiST) para búsquedas por radio y polígono.
- **Protección Antispam**: Implementa rate-limiting (`@upstash/ratelimit`) y verificación invisible (Cloudflare Turnstile) en formularios de leads.
- **Seguridad y Roles (RBAC)**: Define permisos estrictos y políticas RLS para clientes, agentes y administradores.

---

## 💡 6. Recomendaciones & Funciones de Alto Valor

- **Staging Virtual con IA**: Muestra espacios vacíos amoblados o remodelados digitalmente en múltiples estilos.
- **Valuación Inteligente (AVM)**: Estimador automático de precio de mercado comparando inmuebles similares de la zona.
- **Búsqueda en Lenguaje Natural**: Barra de búsqueda con IA que entienda peticiones complejas en texto libre.
- **Score de Barrio (Walk Score)**: Métricas de conectividad, colegios, transporte, seguridad y servicios cercanos.
- **Comparador Lado a Lado**: Comparación simultánea de 3-4 propiedades (precio/m², gastos comunes, amenidades).
- **Alertas y Favoritos**: Notificaciones push y por email al bajar de precio o ingresar propiedades similares.
- **Dossier en PDF**: Descarga automática de ficha técnica comercial de la propiedad con el branding de la agencia.
