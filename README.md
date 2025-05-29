# Sistema de Gestión Manchas y Pecas

Este es un sistema integral de gestión para el negocio Manchas y Pecas, implementado como una aplicación web moderna utilizando tecnologías Node.js y Express. El sistema proporciona una solución completa para la gestión de productos, clientes, ventas, inventario y más.

## Estructura del Proyecto

```
manchas-y-pecas/
├── src/                          # Código fuente principal
│   ├── routes/                   # Rutas de la API
│   │   ├── productos/           # Rutas de productos
│   │   ├── clientes/            # Rutas de clientes
│   │   ├── ventas/              # Rutas de ventas
│   │   ├── pagos/               # Rutas de pagos
│   │   ├── usuarios/            # Rutas de usuarios
│   │   └── ...                  # Otras rutas
│   ├── controllers/             # Controladores de la aplicación
│   ├── models/                  # Modelos de datos
│   ├── services/                # Servicios de negocio
│   ├── middlewares/            # Middlewares personalizados
│   └── config/                 # Configuraciones
├── database/                    # Configuración de base de datos
├── migrations/                  # Migraciones de base de datos
├── seeders/                    # Datos iniciales
├── uploads/                    # Archivos subidos temporales
├── imagenes/                   # Imágenes de productos
├── config/                     # Configuraciones globales
├── middlewares/               # Middlewares globales
├── node_modules/              # Dependencias
├── package.json               # Configuración de npm
├── package-lock.json          # Versiones exactas de dependencias
├── .gitignore                # Archivos ignorados por git
├── cloudinaryConfig.js       # Configuración de Cloudinary
├── app.js                    # Configuración de la aplicación
├── index.js                  # Punto de entrada
└── manchasYpecas_schema.sql  # Esquema de la base de datos
```

### Descripción de Directorios

- **src/**: Contiene el código fuente principal de la aplicación
  - **routes/**: Define todas las rutas API del sistema
  - **controllers/**: Lógica de negocio y manejo de peticiones
  - **models/**: Definición de modelos de datos
  - **services/**: Servicios reutilizables
  - **middlewares/**: Funciones de middleware
  - **config/**: Configuraciones específicas

- **database/**: Gestión de la base de datos
- **migrations/**: Control de versiones de la base de datos
- **seeders/**: Datos de prueba y configuración inicial
- **uploads/**: Almacenamiento temporal de archivos
- **imagenes/**: Almacenamiento de imágenes de productos
- **config/**: Configuraciones globales del sistema
- **middlewares/**: Middlewares globales de la aplicación

### Archivos Principales

- **package.json**: Dependencias y scripts del proyecto
- **app.js**: Configuración de Express
- **index.js**: Punto de entrada de la aplicación
- **manchasYpecas_schema.sql**: Estructura de la base de datos
- **cloudinaryConfig.js**: Configuración de almacenamiento en la nube

## Módulos del Sistema

### 1. Gestión de Usuarios y Autenticación
- Sistema de inicio de sesión seguro
- Gestión de roles y permisos
- Perfiles de administrador y empleados
- Control de acceso basado en roles

### 2. Gestión de Productos
- Catálogo completo de productos
- Sistema de categorización
- Gestión de imágenes de productos
- Control de inventario
- Precios y disponibilidad

### 3. Gestión de Clientes
- Registro y mantenimiento de clientes
- Historial de compras
- Perfiles de cliente
- Gestión de información de contacto

### 4. Gestión de Ventas
- Procesamiento de ventas
- Registro de transacciones
- Historial de ventas
- Generación de reportes

### 5. Gestión de Compras y Proveedores
- Registro de proveedores
- Control de compras
- Seguimiento de inventario
- Relación con proveedores

### 6. Sistema de Pagos
- Procesamiento de pagos
- Registro de transacciones
- Control de caja
- Reportes financieros

### 7. Gestión de Empleados
- Registro de empleados
- Control de acceso
- Asignación de roles
- Seguimiento de actividades

## Arquitectura del Sistema

### Backend (Node.js + Express)
- **Rutas**: Organización modular de endpoints
- **Controladores**: Lógica de negocio separada por módulos
- **Modelos**: Estructura de datos con Sequelize
- **Middlewares**: Autenticación y validación
- **Servicios**: Lógica de negocio reutilizable

### Base de Datos
- Sistema relacional con múltiples tablas
- Relaciones entre entidades
- Optimización de consultas
- Respaldo y seguridad de datos

### Sistema de Archivos
- Gestión de imágenes
- Almacenamiento en la nube (Cloudinary)
- Organización por categorías
- Respaldo de archivos

## Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: Sequelize ORM
- **Autenticación**: JWT (JSON Web Tokens)
- **Almacenamiento**: Cloudinary, Sistema de archivos local
- **Seguridad**: Bcrypt para encriptación
- **APIs RESTful**: Comunicación cliente-servidor

## Características de Seguridad

- Autenticación mediante tokens
- Encriptación de contraseñas
- Validación de datos
- Control de acceso basado en roles
- Protección contra ataques comunes
- Manejo seguro de archivos

## Flujo de Trabajo del Sistema

1. Autenticación de usuarios
2. Verificación de permisos
3. Acceso a módulos específicos
4. Procesamiento de operaciones
5. Registro de actividades
6. Generación de reportes

## Manejo de Errores

- Validación de entrada de datos
- Mensajes de error descriptivos
- Registro de errores
- Recuperación de fallos
- Respuestas HTTP apropiadas

## Escalabilidad y Mantenimiento

- Arquitectura modular
- Código documentado
- Fácil de mantener y actualizar
- Preparado para crecimiento futuro
- Backups automáticos

Este sistema proporciona una solución completa y robusta para la gestión del negocio Manchas y Pecas, permitiendo un control eficiente de todas las operaciones comerciales y administrativas. 