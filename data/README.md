# Documentación de Archivos de Datos (JSON)

Esta carpeta contiene los archivos JSON que actúan como la **Base de Datos** de la aplicación.
Ya que el formato estándar JSON no permite añadir comentarios directamente en el código, se provee este documento para explicar la estructura y el propósito de cada archivo.

## 1. `areas.json`
- **Propósito:** Almacena el catálogo de áreas, departamentos o zonas registradas en la aplicación.
- **Estructura típica:** Array de objetos.
  - `id`: Identificador único (puede ser numérico o timestamp).
  - `name`: Nombre del área (ej. "Servicios Generales", "Gerencia").

## 2. `collaborators.json`
- **Propósito:** Almacena el listado de todos los colaboradores (empleados) a los que se les pueden asignar equipos (radios, llaves, etc.).
- **Estructura típica:** Array de objetos.
  - `id`: Identificador único.
  - `name`: Nombre completo del colaborador.
  - `area`: Área a la que pertenece (relacionado conceptualmente con `areas.json`).

## 3. `keys.json`
- **Propósito:** Catálogo del inventario de llaves disponibles en el sistema.
- **Estructura típica:** Array de objetos.
  - `id`: Identificador único.
  - `numero`: Número o código identificador de la llave.
  - `status`: Estado actual de la llave (ej. "Disponible", "En Uso").

## 4. `radios.json`
- **Propósito:** Catálogo del inventario de radios de comunicación disponibles en el sistema.
- **Estructura típica:** Array de objetos.
  - `id`: Identificador único.
  - `numero`: Número o código identificador del radio.
  - `status`: Estado actual del radio (ej. "Disponible", "En Uso").

## 5. `users.json`
- **Propósito:** Almacena los usuarios que tienen acceso al sistema (autenticación y roles).
- **Estructura típica:** Array de objetos.
  - `id`: Identificador único.
  - `username`: Nombre de usuario para iniciar sesión.
  - `password`: Contraseña (normalmente hasheada en SHA-256).
  - `role`: Rol del usuario en el sistema (ej. "admin", "user", "viewer").
  - `name`: Nombre completo del usuario.

## 6. `transactions.json`
- **Propósito:** Registro histórico de las transacciones (préstamos y devoluciones) de equipos (llaves o radios) a los colaboradores.
- **Estructura típica:** Array de objetos.
  - `id`: Identificador único de la transacción.
  - `equipmentType`: Tipo de equipo ("radio" o "key").
  - `equipmentId`: ID del equipo prestado.
  - `collaboratorId`: ID del colaborador que recibe el equipo.
  - `area`: Área o departamento relacionado.
  - `issueTime`: Fecha y hora en la que se entregó (timestamp o string).
  - `returnTime`: Fecha y hora en la que se devolvió (nulo si sigue en uso).
  - `officer`: Usuario o persona que registró la entrega/devolución.

## 7. `member_access.json`
- **Propósito:** Registro de los accesos (entradas y salidas) de miembros o socios al recinto.
- **Estructura típica:** Array de objetos.
  - `id`: Identificador único.
  - `memberNumber`: Número de socio o identificación.
  - `memberName`: Nombre del socio.
  - `entryTime`: Fecha y hora de entrada.
  - `exitTime`: Fecha y hora de salida.
  - `companionCount`: Cantidad de acompañantes.
  - `officer`: Usuario o persona que registró el acceso.

---

> **Nota para Desarrolladores:** El backend (`server.js`) utiliza `JSON.parse()` y `JSON.stringify()` para leer y escribir estos archivos. Modificar la estructura manualmente o agregar comentarios no válidos romperá la carga de datos.
