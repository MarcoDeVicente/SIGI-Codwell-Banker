# SIGI • Coldwell Banker México

### Sistema de Gestión Integral Inmobiliaria & Motor Predictivo de Matchmaking (PropTech)

**SIGI (Sistema de Gestión Integral Inmobiliaria)** es una plataforma web PropTech diseñada para **Coldwell Banker México** que centraliza la operación comercial, patrimonial y jurídica del mercado inmobiliario de alta gama. El sistema conecta en tiempo real a **Compradores / Arrendatarios**, **Propietarios / Inversionistas** y **Asesores Inmobiliarios** mediante control de acceso basado en roles (RBAC) y el motor de recomendación algorítmica **SIGI Match v4.8**.

## Tabla de Contenidos

1. Problema y Propuesta de Valor

2. Arquitectura y Stack Tecnológico

3. Módulos Principales por Rol (RBAC)

4. Motor de Inteligencia Artificial (SIGI Match v4.8)

5. Seguridad, Validaciones y Cumplimiento Normativo

6. Estructura del Proyecto

7. Instalación y Configuración Local

8. Despliegue en Producción (Vercel)

9. Estándares de Ingeniería de Software Aplicados

## 1. Problema y Propuesta de Valor

En el sector inmobiliario tradicional, los clientes enfrentan una alta carga cognitiva al buscar propiedades entre catálogos genéricos sin personalización, mientras que los asesores y propietarios sufren dispersión operativa entre mensajes, visitas y expedientes legales.

**SIGI Coldwell Banker México** resuelve esta problemática mediante:

* **Personalización Algorítmica:** Reducción del tiempo de búsqueda cruzando presupuesto, zona geográfica, tipología y preferencias de estilo de vida.

* **Operación Centralizada por Perfil:** Interfaces dedicadas y aisladas según el objetivo del usuario (comprar/rentar, administrar patrimonio o gestionar cartera comercial).

* **Certeza Jurídica y Trazabilidad:** Auditoría documental, expedientes digitales verificados y cumplimiento estricto con la legislación mexicana vigente.

## 2. Arquitectura y Stack Tecnológico

| Capa | Tecnología | Descripción | 
| ----- | ----- | ----- | 
| **Frontend & UI** | **Next.js 16 (App Router) + React + TypeScript** | Renderizado híbrido rápido, tipado estricto de extremo a extremo e interfaz minimalista institucional. | 
| **Estilos & Iconografía** | **Tailwind CSS + Lucide Icons** | Sistema de diseño corporativo basado en `#0B1F3A` (Azul Marino), `#F4F7FB` (Fondo Alabastro) y `#10B981` (Esmeralda IA). | 
| **Backend & APIs** | **Next.js Route Handlers + Supabase REST** | Endpoints especializados (`/api/ai-match`, `/api/upload`) y API autogenerada sobre PostgreSQL. | 
| **Base de Datos & Storage** | **Supabase (PostgreSQL + RLS + Buckets)** | Persistencia relacional con políticas *Row Level Security* y almacenamiento multimedia optimizado (`property-media`). | 
| **Despliegue & Seguridad** | **Vercel + HTTPS/TLS** | Integración continua desde GitHub con cifrado nativo en tránsito y variables de entorno seguras. | 

## 3. Módulos Principales por Rol (RBAC)

### Autenticación Unificada y Onboarding (`/registro`, `/login`, `/login-academia`)

* **Registro Multi-Perfil (`/registro`):** Selección de rol desde el alta (`Comprar/Rentar`, `Propietario`, `Asesor`) con validación de formato telefónico mexicano (`+52` a 10 dígitos), auto-limpieza de ejemplos al enfocar (`onFocus`), widget anti-bots tipo *Cloudflare Turnstile* y aceptación obligatoria del Aviso de Privacidad.

* **Login Unificado (`/login`):** Detección automática del rol asociado a la cuenta en Supabase para redirigir exclusivamente al dashboard autorizado.

* **Acceso Institucional (`/login-academia`):** Portal exclusivo para asesores certificados de la *Academia Coldwell Banker México*.

* **Inicio Rápido (SSO):** Integración modal con **Google**, **Apple** y **LinkedIn**.

### Dashboard del Comprador / Arrendatario (`/comprador`)

* **Buscador Inteligente y Filtros Avanzados:** Búsqueda en tiempo real con soporte para espacios, activación con tecla `Enter`, detección automática de ubicación por geolocalización y filtros específicos (recámaras, baños, estacionamientos, superficie en $\text{m}^2$, amenidades y exclusivas SIGI).

* **Rangos Dinámicos Comprar / Rentar:** Ajuste automático de presupuesto (`$1.8M` a `$120M MXN` en venta; `$7,500` a `$45.0M MXN` en renta).

* **Featured Deals Carousel & Ficha Técnica:** Carrusel interactivo tipo acordeón, **Tour Virtual 360° Matterport 4K**, generación de **Dossier Técnico en PDF** estructurado para impresión, mapa real interactivo de **Google Maps**, gestión de **Favoritos** y agenda de **Citas Privadas** con calendario y horarios (`09:00 AM` – `06:00 PM`).

* **Directorio de Asesores (`/propietario/asesores`):** Vinculación directa con asesores certificados o independientes con contacto inmediato por WhatsApp y teléfono.

### Dashboard del Propietario / Inversionista (`/propietario`)

* **Aislamiento de Cuenta y Estados Vacíos:** Cada cuenta nueva inicia limpia sin datos ficticios precargados, mostrando indicadores visuales claros para comenzar a cargar su patrimonio.

* **Gestión Integral de Activos:** Registro de propiedades con superficie total y de construcción ($\text{m}^2$), valuación de mercado, precio de venta o renta y eliminación segura mediante **doble clic** con confirmación modal.

* **Control Jurídico, Ofertas y Visitas:** Seguimiento porcentual del *Expediente Jurídico*, respuesta a ofertas recibidas (`Aceptar`, `Contraoferta`, `Rechazar`), agenda de visitas exportable a **Google Calendar (`.ics`)** y programación de **Llamadas Notariales** (`09:00 AM` – `08:00 PM`).

* **Perfil Verificado:** Edición de datos personales, biografía y carga de foto de perfil con validación de tamaño ($\le 5\text{ MB}$) y detección facial/retrato.

### Dashboard del Asesor Inmobiliario (`/asesor`)

* **Geolocalización y Emparejamiento Regional:** Detección automática de la ciudad real del asesor para restringir el emparejamiento de prospectos e inventario a su plaza operativa.

* **Bandeja Omnicanal de Prospectos:** Gestión en tiempo real de leads provenientes de compradores y propietarios, actualización de estatus de negociación (`Nuevo contacto`, `Visita programada`, `En oferta LOI`, `Cierre notarial`), buscador global de clientes y cálculo de meta financiera mensual.

* **Validación de Identidad Oficial:** Actualización de perfil condicionada a la verificación fotográfica de identificación oficial vigente (INE o Pasaporte) y fotografía de retrato.

### Identidad Institucional (`/sobre-nosotros`)

* Presentación editorial de la trayectoria, liderazgo, misión operativa y comercial, visión y pilares estratégicos de **Coldwell Banker México** en **CDMX**, **Monterrey**, **Querétaro** y **Riviera Maya & Tulum**.

## 4. Motor de Inteligencia Artificial (SIGI Match v4.8)

El endpoint `/api/ai-match` evalúa dinámicamente la compatibilidad entre el perfil de búsqueda del usuario y el catálogo activo de **120 propiedades** distribuidas en las 4 sedes principales (**30 en Querétaro**, **30 en Monterrey**, **30 en CDMX** y **30 en Riviera Maya & Tulum**), junto con una red de **50 asesores** registrados y certificados:

* **Cálculo de Afinidad (`85% – 99% Match`):** Pondera compatibilidad presupuestal, ubicación geográfica, tipología arquitectónica y retorno estimado (*Cap Rate* y plusvalía anual).

* **Explicabilidad Algorítmica:** Desglosa visualmente el cumplimiento por criterios (*Rango Presupuestal*, *Espacio para Home Office & Familia* y *Distancia a Servicios/Colegios*).

## 5. Seguridad, Validaciones y Cumplimiento Normativo

* **Control de Acceso Basado en Roles (RBAC):** Guards de navegación que impiden el acceso cruzado entre paneles no autorizados (`comprador`, `propietario`, `asesor`).

* **Sanitización y Prevención de Ataques:** Consultas parametrizadas mediante Supabase Client para mitigar inyecciones SQL (*SQLi*) y escape automático en React frente a *Cross-Site Scripting* (*XSS*).

* **Integridad en Base de Datos (PostgreSQL Constraints):** Reglas `CHECK` para impedir precios negativos o teléfonos inválidos y restricciones `UNIQUE` en correos electrónicos y folios catastrales.

* **Validación Multimedia:** Restricción estricta de formatos seguros (`.jpg`, `.png`, `.webp`), peso máximo de $5\text{ MB}$ y verificación de retrato/identidad oficial.

* **Cumplimiento Legal Mexicano:**

  * **LFPDPPP:** Consentimiento expreso y registro de marca de tiempo (`privacy_accepted_at`) en todos los formularios de captación de datos.

  * **NOM-247-SE-2021:** Transparencia en información comercial, catastral y dossieres técnicos de inmuebles destinados a casa habitación.

## 6. Estructura del Proyecto

```
SIGI-Codwell-Banker/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai-match/route.ts        # Motor algorítmico SIGI Match v4.8
│   │   │   └── upload/route.ts          # Carga segura de imágenes y documentos
│   │   ├── asesor/page.tsx              # Dashboard operativo del Asesor
│   │   ├── comprador/page.tsx           # Dashboard de búsqueda y Match IA del Comprador
│   │   ├── login/page.tsx               # Login unificado con detección automática de rol
│   │   ├── login-academia/page.tsx      # Acceso exclusivo Academia Coldwell Banker
│   │   ├── propietario/
│   │   │   ├── asesores/page.tsx        # Directorio de Asesores Certificados e Independientes
│   │   │   └── page.tsx                 # Dashboard patrimonial del Propietario
│   │   ├── registro/page.tsx            # Registro multi-rol con validaciones y CAPTCHA
│   │   ├── sobre-nosotros/page.tsx      # Vista institucional Coldwell Banker México
│   │   ├── globals.css                  # Estilos globales y reglas de impresión PDF
│   │   └── layout.tsx                   # Layout raíz y metadatos
│   ├── components/
│   │   ├── Navbar.tsx                   # Barra superior dinámica por rol, buscador y notificaciones
│   │   └── SocialAuthModal.tsx          # Modal SSO (Google, Apple, LinkedIn)
│   └── lib/
│       ├── seedCatalog.ts               # Catálogo semilla de 120 propiedades y 50 asesores
│       ├── store.ts                     # Estado global reactivo y sincronización con Supabase
│       ├── supabase.ts                  # Cliente tipado de Supabase
│       └── validations.ts               # Esquemas de validación, sanitización y detección facial
├── public/                              # Recursos estáticos
├── next.config.ts                       # Configuración de Next.js
├── package.json                         # Dependencias del proyecto
└── README.md                            # Documentación del repositorio

```

## 7. Instalación y Configuración Local

### Prerrequisitos

* **Node.js** `v20.x` o superior

* **npm** `v10.x` o superior

* Una cuenta y proyecto activo en **Supabase**

### Pasos de Ejecución

1. **Clonar el repositorio:**

   ```
   git clone https://github.com/MarcoDeVicente/SIGI-Codwell-Banker.git
   cd SIGI-Codwell-Banker
   
   ```

2. **Instalar dependencias:**

   ```
   npm install
   
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto con tus credenciales públicas de Supabase:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica_anon_o_publishable
   
   ```

4. **Configurar la base de datos en Supabase:**
   Asegúrate de contar con las tablas `profiles`, `properties`, `leads`, `visits`, `property_offers`, `legal_documents` y `notifications`, así como el bucket público `property-media` en Supabase Storage.

5. **Iniciar el servidor de desarrollo:**

   ```
   npm run dev
   
   ```

   Abre <http://localhost:3000> en tu navegador.

## 8. Despliegue en Producción (Vercel)

1. Verifica que la compilación de producción pase sin advertencias críticas:

   ```
   npm run build
   
   ```

2. Sube los cambios confirmados a la rama `main` de GitHub.

3. Importa el repositorio en **Vercel**, registra las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en *Settings → Environment Variables* y ejecuta el despliegue con certificado **HTTPS/TLS** automático.

## 9. Estándares de Ingeniería de Software Aplicados

* **IEEE 830 (Software Requirements Specification):** Trazabilidad completa entre requisitos funcionales (gestión de cartera, emparejamiento IA, expedientes y citas) y requisitos no funcionales (rendimiento, usabilidad y seguridad RBAC).

* **PMBOK (Gestión Ágil del Proyecto):** Planificación incremental por entregables, control de riesgos y aseguramiento de calidad en cada módulo operativo.

**Desarrollado por: Angel Jezrael Espino Martinez, Marco Antonio de Vicente Martinez y Eduardo Meza Ambrosio • Facultad de Informatica Universidad Autónoma de Querétaro (UAQ)**