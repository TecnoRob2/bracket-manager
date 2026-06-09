# Bracket Manager

Aplicación de escritorio para gestionar brackets, seeding y torneos integrados con start.gg. Construida con React, Vite y Tauri.

## Características Principales

- **Gestión de Torneos**: Consulta y administra tus torneos desde start.gg
- **Visualización de Brackets**: Ve la estructura completa de tus torneos y fases
- **Seeding Personalizado**: Reordena manualmente la siembra (seeding) de jugadores en las fases
- **Borradores**: Crea y gestiona seeding en estado de borrador antes de aplicar
- **Head-to-Head**: Visualiza el historial de enfrentamientos entre jugadores
- **Clasheos**: Gestión y seguimiento de encuentros (clasheos)
- **Tema Personalizable**: Alterna entre temas claro y oscuro
- **Sincronización con start.gg**: Actualiza el seeding directamente en el sitio

## Requisitos Previos

- Node.js 18+
- Rust (para compilar Tauri)
- Cuenta en [start.gg](https://www.start.gg)

## Configuración Inicial

### 1. Obtener Token de Autenticación

Para usar la aplicación, necesitas un token de la API de start.gg:

1. Ve a [https://www.start.gg/admin/profile/developer](https://www.start.gg/admin/profile/developer)
2. Inicia sesión con tu cuenta de start.gg
3. En la sección "API Credentials", copia tu token personal de GraphQL
4. Guarda este token de forma segura

### 2. Instalación

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# O con Tauri (compilado como aplicación de escritorio)
npm run tauri dev

# Compilar para producción
npm run build
```

## Cómo Usar

1. **Inicia la aplicación** y verás la pantalla de autenticación
2. **Ingresa tu token de start.gg** en el campo de entrada
3. **Accede al Dashboard** donde verás tus torneos
4. **Selecciona un torneo** para ver sus brackets y opciones:
   - **Bracket**: Visualiza la estructura del torneo
   - **Borradores**: Crea y gestiona siembra personalizada
   - **Clasheos**: Gestiona encuentros y reglas
5. **Arrastra y suelta jugadores** para reordenarlos en el seeding
6. **Aplica cambios** para sincronizar con start.gg

## Estructura del Proyecto

```
src/
├── components/        # Componentes React reutilizables
├── pages/            # Páginas principales (Auth, Dashboard, Bracket, etc)
├── services/         # Servicios para tourneys, users, clash, draft
├── store/            # Zustand stores para estado global
├── core/             # API queries y filesystem
├── utils/            # Utilidades (parsers, generadores, etc)
├── types/            # Definiciones de tipos
└── assets/           # Recursos estáticos
src-tauri/           # Código backend Rust (escritorio)
```

## Nota de Seguridad

⚠️ **Nunca compartas tu token de start.gg públicamente**. El token se almacena localmente en tu máquina y se utiliza únicamente para comunicarse con la API de start.gg.
