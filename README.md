# Loto Scraper HN — Frontend

Panel de administración y extracción de datos de redes sociales. Construido con **React 19 + TypeScript + Vite**, consume un backend en **Django REST Framework** y se despliega en contenedor Docker con Nginx.

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Tecnologías](#tecnologías)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Variables de Entorno](#variables-de-entorno)
5. [Instalación y Desarrollo](#instalación-y-desarrollo)
6. [Build y Despliegue con Docker](#build-y-despliegue-con-docker)
7. [Arquitectura y Flujo de la Aplicación](#arquitectura-y-flujo-de-la-aplicación)
8. [Módulos y Componentes](#módulos-y-componentes)
   - [index.tsx — Punto de Entrada](#indextsx--punto-de-entrada)
   - [App.tsx — Router Interno](#apptsx--router-interno)
   - [types.ts — Tipos Globales](#typests--tipos-globales)
   - [api/axiosConfig.ts — Cliente HTTP](#apiaxiosconfigts--cliente-http)
   - [utils/permissionEvents.ts — Sistema de Eventos](#utilspermissioneventsts--sistema-de-eventos)
   - [components/LoginPage.tsx](#componentsloginpagetsx)
   - [components/Layout.tsx](#componentslayouttsx)
   - [components/Saludos.tsx](#componentssaludostsx)
   - [components/Dashboard.tsx](#componentsdashboardtsx)
   - [components/ScraperView.tsx](#componentsscraperviewtsx)
   - [components/PerfilInfluencer.tsx](#componentsperfilinfluencertsx)
   - [components/SettingsView.tsx](#componentssettingsviewtsx)
   - [components/RoleManage.tsx](#componentsrolemanage)
9. [Configuración de Vite](#configuración-de-vite)
10. [Configuración de TypeScript](#configuración-de-typescript)
11. [Estilos y Tema](#estilos-y-tema)
12. [Autenticación y Seguridad](#autenticación-y-seguridad)
13. [Endpoints del Backend Consumidos](#endpoints-del-backend-consumidos)

---

## Descripción General

**Loto Scraper HN** es un dashboard web que permite:

- Extraer datos públicos de perfiles en **Instagram**, **TikTok**, **X (Twitter)**, **Facebook** y **YouTube**.
- Visualizar métricas en tiempo real: totales extraídos, perfiles únicos, engagement promedio y volumen semanal.
- Consultar el perfil 360 de un influencer: historial de posts, análisis de sentimiento y distribución emocional.
- Gestionar las API Keys de cada plataforma y cambiar contraseñas de usuarios.
- Administrar roles y permisos sobre los usuarios del sistema.

---

## Tecnologías

| Categoría        | Librería / Herramienta           | Versión     |
|------------------|----------------------------------|-------------|
| UI Framework     | React                            | ^19.2.4     |
| Lenguaje         | TypeScript                       | ~5.8.2      |
| Bundler          | Vite                             | ^6.2.0      |
| Estilos          | Tailwind CSS (CDN)               | latest      |
| Iconos           | lucide-react                     | ^0.574.0    |
| Gráficos         | Recharts                         | ^3.7.0      |
| HTTP Client      | Axios                            | ^1.13.6     |
| IA Generativa    | @google/genai (Gemini)           | ^1.41.0     |
| Fuente tipográfica | Inter (Google Fonts)           | —           |
| Contenedor       | Docker + Nginx (alpine)          | —           |

---

## Estructura del Proyecto

```
mutli_frontend_repo/
├── index.html              # Documento HTML raíz, carga Tailwind CSS y fuentes
├── index.tsx               # Punto de montaje de React (ReactDOM.createRoot)
├── App.tsx                 # Router interno + estado global de sesión
├── types.ts                # Tipos e interfaces TypeScript compartidos
├── tsconfig.json           # Configuración del compilador TypeScript
├── vite.config.ts          # Configuración de Vite (puertos, alias, env vars)
├── package.json            # Dependencias y scripts npm
├── Dockerfile              # Build multi-etapa: Node (build) → Nginx (serve)
├── auth-redirect.html      # Página auxiliar para redirecciones OAuth (vacía)
├── metadata.json           # Metadatos del proyecto
├── api/
│   └── axiosConfig.ts      # Instancia Axios centralizada con interceptores JWT
├── auth/                   # Carpeta reservada para módulos de autenticación
├── components/
│   ├── LoginPage.tsx       # Formulario de login y registro
│   ├── Layout.tsx          # Sidebar de navegación y contenedor principal
│   ├── Saludos.tsx         # Pantalla de bienvenida animada post-login
│   ├── Dashboard.tsx       # Vista de métricas y acceso a plataformas
│   ├── ScraperView.tsx     # Motor de extracción de datos por plataforma
│   ├── PerfilInfluencer.tsx# Perfil 360 de un influencer con análisis emocional
│   ├── SettingsView.tsx    # Configuración de API Keys y cambio de contraseña
│   └── RoleManage.tsx      # Gestión de roles y permisos de usuarios
├── utils/
│   ├── permissionEvents.ts # Emisor y receptor de eventos de permisos denegados
│   └── Logo loto-.svg      # Logo de la aplicación
└── public/
    └── favicon.svg         # Ícono de la pestaña del navegador
```

---

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# URL base del backend Django (incluir barra al final es opcional, el código la normaliza)
VITE_API_URL=http://localhost:8000

# API Key de Google Gemini (opcional, para funcionalidades de IA)
GEMINI_API_KEY=your_gemini_api_key

# (Opcional) Para autenticación con Microsoft Entra ID
VITE_ENTRA_CLIENT_ID=your_client_id
VITE_ENTRA_TENANT_ID=your_tenant_id
```

> En Docker, estas variables se pasan como `ARG` en el build y se inyectan en el bundle estático por Vite.

---

## Instalación y Desarrollo

**Requisitos previos:** Node.js ≥ 18, npm.

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd mutli_frontend_repo

# 2. Instalar dependencias
npm install

# 3. Configurar el entorno
cp .env.example .env
# Editar .env con los valores correctos

# 4. Iniciar el servidor de desarrollo
npm run dev
# Acceder en http://localhost:3000
```

| Script          | Descripción                                      |
|-----------------|--------------------------------------------------|
| `npm run dev`   | Servidor de desarrollo en `http://localhost:3000` |
| `npm run build` | Compilación de producción en `/dist`             |
| `npm run preview` | Vista previa del build de producción           |

---

## Build y Despliegue con Docker

El `Dockerfile` usa una **build multi-etapa**:

**Etapa 1 — Build (Node 18 Alpine)**
- Recibe las variables de entorno como `ARG` para que Vite las inyecte en el bundle.
- Ejecuta `npm install` y `npm run build`.
- Genera los archivos estáticos en `/app/dist`.

**Etapa 2 — Serve (Nginx Alpine)**
- Copia `/app/dist` a `/usr/share/nginx/html`.
- Expone el puerto `80`.

```bash
# Build de la imagen
docker build \
  --build-arg VITE_API_URL=https://api.ejemplo.com \
  --build-arg VITE_ENTRA_CLIENT_ID=xxx \
  --build-arg VITE_ENTRA_TENANT_ID=yyy \
  -t loto-scraper-frontend .

# Ejecutar el contenedor
docker run -p 80:80 loto-scraper-frontend
```

---

## Arquitectura y Flujo de la Aplicación

```
index.tsx
    └─ <App /> (StrictMode)
          └─ <AppRouter />
                ├─ [No autenticado]  → <LoginPage />
                ├─ [Post-login]      → <Saludos />  (3.5 s, animación)
                └─ [Autenticado]     → <Layout />
                        ├─ activeTab='dashboard'  → <Dashboard />
                        ├─ activeTab='scraper'    → <ScraperView />
                        ├─ activeTab='perfil'     → <PerfilInfluencer />
                        └─ activeTab='settings'
                                ├─ sub='general'  → <SettingsView />
                                └─ sub='roles'    → <RoleManager />
```

### Flujo de Autenticación

1. Al montar `AppRouter`, se lee `access_token` de `localStorage`.
2. Si existe → usuario autenticado; se restaura el perfil desde `user_profile`.
3. Al hacer login exitoso → se almacenan `access_token`, `refresh_token` y `user_profile` en `localStorage`.
4. Al hacer logout → se limpian los tres items y se vuelve a `LoginPage`.
5. Si cualquier petición retorna **401** → `axiosConfig` limpia el storage y redirige a `/`.
6. Si cualquier petición retorna **403** → se emite el evento global `permission-denied`.

---

## Módulos y Componentes

### index.tsx — Punto de Entrada

Monta la aplicación React en el elemento `#root` del DOM usando `ReactDOM.createRoot`. Envuelve `<App />` en `<React.StrictMode>`.

---

### App.tsx — Router Interno

**Estado global gestionado:**

| Estado                | Tipo                                           | Descripción                                      |
|-----------------------|------------------------------------------------|--------------------------------------------------|
| `ready`               | `boolean`                                      | Indica si la sesión ya fue verificada en localStorage |
| `isAuthenticated`     | `boolean`                                      | Controla si mostrar Login o la app principal     |
| `showWelcome`         | `boolean`                                      | Activa la pantalla de bienvenida post-login      |
| `user`                | `{ displayName, email }`                       | Perfil básico del usuario en sesión              |
| `permissionModalOpen` | `boolean`                                      | Muestra el modal de permiso denegado             |
| `activeTab`           | `'dashboard' \| 'scraper' \| 'perfil' \| 'settings'` | Sección activa del panel                |
| `selectedPlatform`    | `Platform`                                     | Plataforma seleccionada para ScraperView         |
| `activeSettingsTab`   | `'general' \| 'roles'`                         | Sub-tab activa en Settings                       |
| `isDark`              | `boolean`                                      | Modo oscuro (persiste en `sessionStorage`)       |

**Efectos secundarios:**

- **Interceptación global de `fetch`**: parchea `globalThis.fetch` para detectar respuestas `403` y emitir el evento `permission-denied`.
- **Listener de `permission-denied`**: escucha el evento personalizado para abrir el modal con el mensaje de error.
- **Persistencia del tema**: aplica/elimina la clase `dark` en `document.documentElement`.

---

### types.ts — Tipos Globales

```typescript
enum Platform { INSTAGRAM = 'ig', TIKTOK = 'tk', X = 'x' }

interface ApiKeyConfig {
  ig_keys: string;
  x_tk_busqueda: string;
  x_tk_timeline: string;
}

interface ScrapeResult {
  id, platform, username, followers, date,
  likes, comments?, views?, retweets?,
  description, sentiment?
}

interface ScrapingStats {
  totalProcessed, activeTasks, successRate
}
```

---

### api/axiosConfig.ts — Cliente HTTP

Instancia centralizada de Axios configurada con la URL base `VITE_API_URL/api/`.

**Interceptor de request:**
- Adjunta automáticamente el header `Authorization: Bearer <token>` si existe un token en `localStorage`.

**Interceptor de response:**
- `403` o `error = 'No tienes permiso'` → emite el evento `permission-denied`.
- `401` → limpia `localStorage` y redirige a `/` (fuerza re-login).

```typescript
import api from '../api/axiosConfig';

// Ejemplo de uso en un componente
api.get('scraper/get_metrics/').then(res => setMetrics(res.data));
```

---

### utils/permissionEvents.ts — Sistema de Eventos

Implementa un bus de eventos liviano usando la API nativa de `CustomEvent`:

```typescript
export const PERMISSION_DENIED_EVENT = 'permission-denied';

// Emitir el evento (desde axiosConfig o el fetch parchado)
emitPermissionDenied('Mensaje personalizado opcional');

// Escuchar (en App.tsx)
globalThis.addEventListener(PERMISSION_DENIED_EVENT, handler);
```

---

### components/LoginPage.tsx

Formulario con dos modos: **Login** y **Registro**.

**Login**
- Campos: `identifier` (usuario o email) + `password`.
- Hace `POST /api/auth/login/` con `fetch`.
- En éxito: guarda `access_token`, `refresh_token` y `user_profile` en `localStorage`, llama `onLoginSuccess(profile)`.
- Errores: 401 → "Credenciales inválidas"; otros → mensaje genérico.

**Registro**
- Campos: `username`, `email`, `password`, `firstName` (opcional), `lastName` (opcional).
- Validación: contraseña mínimo 8 caracteres.
- Hace `POST /api/auth/register/`.
- En éxito: muestra mensaje de confirmación y cambia al modo login.

**Props:**

| Prop            | Tipo                                | Descripción                         |
|-----------------|-------------------------------------|-------------------------------------|
| `onLoginSuccess`| `(profile: UserProfile) => void`    | Callback al autenticar correctamente |

---

### components/Layout.tsx

Contenedor principal con **sidebar fija** a la izquierda.

**Sidebar incluye:**
- Logotipo + nombre de la aplicación.
- Navegación por pestañas: Dashboard, Extractors, Perfil 360, Configuration.
- Nombre y email del usuario con botón de Logout.
- Indicador de conexión con el backend ("Django API v2.4").
- Toggle de tema claro/oscuro (ícono Sol / Luna).
- Enlace al repositorio de GitHub (ícono).

**Props:**

| Prop            | Tipo                                               | Descripción                        |
|-----------------|----------------------------------------------------|------------------------------------|
| `children`      | `React.ReactNode`                                  | Contenido de la vista activa       |
| `activeTab`     | `'dashboard' \| 'scraper' \| 'perfil' \| 'settings'` | Tab seleccionada                |
| `setActiveTab`  | `(tab) => void`                                    | Cambia la tab activa               |
| `user`          | `{ displayName, email }`                           | Datos del usuario en sesión        |
| `onLogout`      | `() => void`                                       | Limpia sesión                      |
| `isDark`        | `boolean`                                          | Estado del tema                    |
| `onToggleTheme` | `() => void`                                       | Alterna tema claro/oscuro          |

---

### components/Saludos.tsx

Pantalla de bienvenida animada que aparece automáticamente al iniciar sesión.

**Comportamiento:**
- Fase `in` (0 ms): elemento invisible, desplazado hacia abajo.
- Fase `visible` (50 ms): elemento aparece con transición de opacidad y posición.
- Fase `out` (2800 ms): elemento desaparece.
- `onFinish` (3500 ms): se llama al callback para mostrar el dashboard.
- El usuario puede omitir la animación con el botón "Omitir".

**Muestra:**
- Logo de la aplicación.
- Saludo según la hora del día (Buenos días / Buenas tardes / Buenas noches).
- Nombre del usuario.
- Barra de progreso animada con CSS.

**Props:**

| Prop          | Tipo          | Descripción                               |
|---------------|---------------|-------------------------------------------|
| `displayName` | `string`      | Nombre del usuario a mostrar              |
| `onFinish`    | `() => void`  | Callback al terminar la animación         |

---

### components/Dashboard.tsx

Vista principal con métricas en tiempo real y acceso directo a cada plataforma.

**Métricas mostradas** (obtenidas de `GET /api/scraper/get_metrics/`):

| Métrica               | Descripción                                  |
|-----------------------|----------------------------------------------|
| `total_extracted`     | Total de registros extraídos                 |
| `total_profiles`      | Perfiles únicos en la base de datos          |
| `avg_engagement`      | Tasa promedio de engagement                  |
| `platform_distribution` | Distribución de datos por plataforma      |
| `weekly_volume`       | Volumen de extracción por día (últimos 7 días)|
| `users_api_calls`     | Llamadas a la API por usuario                |

**Gráfico de Área**: visualiza `weekly_volume` usando `Recharts` (`AreaChart` + `ResponsiveContainer`).

**Tarjetas de plataforma**: acceso rápido a Instagram, TikTok, X, Facebook y YouTube. Al hacer clic, navega a `ScraperView` con la plataforma preseleccionada.

**Props:**

| Prop               | Tipo                           | Descripción                                |
|--------------------|--------------------------------|--------------------------------------------|
| `onPlatformSelect` | `(platform: Platform) => void` | Navega a ScraperView con la plataforma     |
| `displayName`      | `string?`                      | Nombre del usuario para el saludo          |

---

### components/ScraperView.tsx

Motor de extracción de datos. Es el componente más complejo de la aplicación.

**Funcionalidades:**

- **Selector de plataforma**: cambia entre Instagram (`ig`), TikTok (`tk`), X (`x`), Facebook (`fb`), YouTube (`yt`).
- **Modos de entrada**:
  - *Manual*: textarea donde se pegan usernames o URLs (uno por línea).
  - *Archivo*: carga un `.txt` o `.csv` con los targets.
- **Limpieza de targets** (`cleanTarget`): extrae el username a partir de URLs completas de cualquier plataforma, eliminando parámetros, segmentos irrelevantes y el prefijo `@`.
- **Validación de plataforma** (`isCorrectPlatform`): verifica que las URLs pertenezcan a la plataforma activa.
- **Barra de progreso visual**: se incrementa gradualmente (5% cada 400 ms) mientras hay extracción activa.
- **Polling de resultados**: consulta periódicamente el backend para actualizar el estado de las tareas en curso.
- **Búsqueda en resultados**: filtra los resultados mostrados por term de búsqueda.
- **Descarga CSV**: exporta los resultados actuales a un archivo `.csv`.
- **Historial**: muestra las extracciones previas.
- **Conteo esperado por plataforma** (`getExpectedCount`): indica el número esperado de resultados según la plataforma.

**Estado interno:**

| Estado             | Descripción                                        |
|--------------------|----------------------------------------------------|
| `currentPlatform`  | Plataforma activa para la extracción               |
| `inputMode`        | `'manual'` o `'file'`                              |
| `manualText`       | Contenido del textarea de entrada manual           |
| `isProcessing`     | Indica extracción en curso                         |
| `results`          | Array de `ScrapeResult` obtenidos                  |
| `progress`         | Porcentaje de la barra de progreso (0–100)         |
| `isPolling`        | Activo mientras se esperan resultados del backend  |
| `searchTerm`       | Filtro de búsqueda sobre los resultados            |

---

### components/PerfilInfluencer.tsx

Vista de análisis completo de un influencer individual.

**Búsqueda:**
- Input con autocompletado desde la lista de influencers disponibles (`GET /api/scraper/perfil/`).
- Filtro de la lista con soporte para expresiones regulares (toggle Regex).

**Datos mostrados** (de `InfluencerDetails`):

| Campo                 | Descripción                                          |
|-----------------------|------------------------------------------------------|
| `username`            | Nombre de usuario                                    |
| `total_posts`         | Total de publicaciones registradas                   |
| `latest_platform`     | Última plataforma scrapeada                          |
| `latest_followers`    | Seguidores en la última extracción                   |
| `latest_post_date`    | Fecha del post más reciente                          |
| `last_updated`        | Última actualización del perfil                      |
| `sentimiento_global`  | Sentimiento predominante del contenido               |
| `is_loto`             | Indica si el influencer es relevante para el negocio |
| Emociones (×8)        | Valores de alegría, confianza, miedo, sorpresa, tristeza, aversión, ira, anticipación |
| `posts`               | Array de publicaciones con todos sus campos          |

**Tabla de posts** con filtros avanzados:
- Filtro por campo (`field`) o búsqueda en todos los campos (`all`).
- Texto libre con opción de expresión regular.
- Filtro por rango de fechas (`dateFrom` / `dateTo`).

**Helpers de formato:**
- `formatDate`: formatea fechas ISO a `es-ES` con hora.
- `safeString`: convierte cualquier valor (incluyendo objetos) a string legible.
- `formatWeight`: muestra valores numéricos con 2 decimales.

---

### components/SettingsView.tsx

Panel de configuración con dos sub-pestañas.

**Sub-pestaña: API Keys**

Gestiona las claves de API para cada plataforma mediante `POST /api/scraper/bulk_update/`.

| Campo     | Plataforma         | Descripción                              |
|-----------|--------------------|------------------------------------------|
| `ig_keys` | Instagram          | Claves separadas por comas               |
| `tk_search`| TikTok (búsqueda) | Claves para endpoints de búsqueda        |
| `tk_posts`| TikTok (posts)     | Claves para endpoints de publicaciones   |
| `x_search`| X (búsqueda)       | Claves para endpoints de búsqueda        |
| `x_posts` | X (timeline)       | Claves para endpoints de timeline        |
| `fb_keys` | Facebook           | Claves generales                         |
| `yt_keys` | YouTube            | Claves generales                         |

**Sub-pestaña: Cambiar Contraseña**

Permite cambiar la contraseña de cualquier usuario mediante `POST /api/scraper/change_password/`.

| Campo               | Descripción                                         |
|---------------------|-----------------------------------------------------|
| Identificador       | Username o email del usuario (selector de tipo)     |
| Nueva contraseña    | Mínimo 8 caracteres (toggle de visibilidad)         |

---

### components/RoleManage.tsx

Administración de roles de usuario (disponible en Settings → Roles).

**Roles disponibles:** `Admin_Scraper`, `Colaborador`, `Usuario`, `Gerente`, `Director`.

**Flujo:**
1. Al montar, carga la lista de usuarios desde `GET /scraper/list_users/`.
2. El administrador selecciona un usuario del dropdown y elige un rol.
3. Al enviar, hace `POST /scraper/assign_role/` con `{ username, group_name, clear_existing: true }`.
4. Muestra mensaje de éxito o error según la respuesta.

**Props:**

| Prop    | Tipo     | Descripción                       |
|---------|----------|-----------------------------------|
| `token` | `string` | JWT del administrador en sesión   |

---

## Configuración de Vite

`vite.config.ts` define:

| Configuración                    | Valor                              |
|----------------------------------|------------------------------------|
| Puerto de desarrollo             | `3000`                             |
| Host                             | `0.0.0.0` (accesible en red local) |
| Base URL                         | `/`                                |
| Alias `@`                        | Raíz del proyecto                  |
| Plugin                           | `@vitejs/plugin-react`             |
| Inyección de variables de entorno| `GEMINI_API_KEY`, `VITE_API_URL`   |

---

## Configuración de TypeScript

`tsconfig.json` configura:

- **Target**: `ES2022`
- **Module**: `ESNext` con resolución `bundler` (Vite)
- **JSX**: `react-jsx` (sin importar React en cada archivo)
- **Paths**: `@/*` → raíz del proyecto
- **Flags adicionales**: `isolatedModules`, `allowJs`, `skipLibCheck`, `experimentalDecorators`

---

## Estilos y Tema

La aplicación usa **Tailwind CSS** cargado desde CDN (sin PostCSS), configurado con `darkMode: 'class'`.

**Modo oscuro:**
- Se activa añadiendo la clase `dark` a `<html>`.
- La preferencia se persiste en `sessionStorage` bajo la clave `theme`.
- El estado se inicializa leyendo `sessionStorage` en el primer render.
- `index.html` define overrides CSS globales para las clases más usadas de Tailwind en modo oscuro (ej: `.dark .bg-white`, `.dark .text-slate-900`).

**Efecto glass:**
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

---

## Autenticación y Seguridad

| Aspecto                    | Implementación                                                   |
|----------------------------|------------------------------------------------------------------|
| Almacenamiento de tokens   | `localStorage` (`access_token`, `refresh_token`, `user_profile`)|
| Inyección del token        | Interceptor de Axios (automático en todas las peticiones `api.*`)|
| Expiración de sesión       | Respuesta 401 → limpieza de storage + redirect a `/`            |
| Control de permisos        | Evento global `permission-denied` disparado en respuestas 403   |
| Contraseñas                | Mínimo 8 caracteres validado en cliente y servidor              |

---

## Endpoints del Backend Consumidos

| Método | Endpoint                          | Componente           | Descripción                              |
|--------|-----------------------------------|----------------------|------------------------------------------|
| POST   | `/api/auth/login/`                | LoginPage            | Autenticación, retorna JWT               |
| POST   | `/api/auth/register/`             | LoginPage            | Registro de nuevo usuario                |
| GET    | `/api/scraper/get_metrics/`       | Dashboard            | Métricas globales del sistema            |
| GET    | `/api/scraper/perfil/`            | PerfilInfluencer     | Lista de influencers o detalle de uno    |
| POST   | `/api/scraper/bulk_update/`       | SettingsView         | Actualización masiva de API Keys         |
| POST   | `/api/scraper/change_password/`   | SettingsView         | Cambio de contraseña de usuario          |
| GET    | `/scraper/list_users/`            | RoleManage           | Lista de usuarios del sistema            |
| POST   | `/scraper/assign_role/`           | RoleManage           | Asignación de rol a un usuario           |

---

> **Nota**: la URL base de todos los endpoints se configura mediante la variable de entorno `VITE_API_URL`. El cliente Axios (`api/axiosConfig.ts`) antepone automáticamente `/api/` a todas las rutas relativas.
