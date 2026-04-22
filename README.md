# Sistema de Control de Inventario - San José Indoor Club

Sistema web local diseñado para la gestión y control de inventarios de Radios y Llaves de cerrajería, enfocado en el registro de entregas, recepciones, y la asignación de equipos al personal interno.

## 📋 Características Principales

*   **Gestión de Inventario:** Control detallado de Radios (por número, serie, área) y Llaves (número y detalle).
*   **Módulo de Transacciones:** Registro preciso de salidas y entradas de equipos, guardando la fecha, hora y el oficial responsable del movimiento.
*   **Asignaciones Fijas y Temporales:** Posibilidad de asignar un equipo de forma fija a un colaborador o prestarlo temporalmente.
*   **Estados Dinámicos:** Cálculo automático de los estados de los equipos (`Disponible`, `En Uso`, `No Disponible`) según las asignaciones y transacciones activas.
*   **Roles de Seguridad:**
    *   **Super Administrador:** Acceso total, incluyendo la edición manual de tiempos de entrega y recepción.
    *   **Administrador:** Acceso a módulos administrativos para crear y modificar inventarios, usuarios, áreas y colaboradores.
    *   **Usuario (Oficial):** Acceso restringido exclusivamente en modo lectura para inventarios y creación de transacciones (entradas/salidas).
*   **Auditoría y Logs:** Todo movimiento (creación, edición, eliminación y transacciones) es registrado en archivos de texto diarios (`/data/logs/`) de manera automática.

---

## 🚀 Requisitos Previos

El sistema está construido enteramente en **Vanilla JavaScript** (Frontend) y **Node.js nativo** (Backend). **No requiere bases de datos externas ni instalación de paquetes mediante npm**, ya que toda la persistencia se maneja localmente mediante archivos JSON.

**Único requisito:**
*   [Node.js](https://nodejs.org/es/download/) (Versión 14 o superior instalada en la computadora).

---

## ⚙️ Instalación y Ejecución

Al no requerir módulos externos, el sistema es portátil y muy sencillo de arrancar. Existen dos formas de hacerlo:

### Opción 1: Ejecución Automática (Recomendada en Windows)
1. Extrae o copia la carpeta del proyecto en tu computadora.
2. Haz doble clic en el archivo **`Arrancar_Sistema.bat`**.
3. Se abrirá una ventana de consola negra (Símbolo del sistema). **No cierres esta ventana** mientras estés usando el sistema.
4. Tu navegador predeterminado se abrirá automáticamente en la dirección `http://localhost:3000`.

### Opción 2: Ejecución Manual (Desde la consola/terminal)
1. Abre una terminal (CMD, PowerShell o Terminal de Mac/Linux).
2. Navega hasta la carpeta del proyecto:
   ```bash
   cd ruta/a/Controles-Seguridad
   ```
3. Inicia el servidor ejecutando el siguiente comando:
   ```bash
   node server.js
   ```
4. Abre tu navegador web de preferencia y entra a la dirección: **`http://localhost:3000`**

---

## 🗂️ Estructura del Sistema

*   `/data`: Carpeta equivalente a la base de datos. Contiene los archivos `.json` con la información de usuarios, colaboradores, áreas, equipos y transacciones.
*   `/data/logs`: Almacena el historial de movimientos de auditoría, separados por día en archivos `.txt`.
*   `/public`: Archivos expuestos para el cliente (HTML, CSS, JS e Imágenes).
    *   `/public/dashboard.html`: Interfaz principal del aplicativo.
    *   `/public/js/app.js`: Lógica completa del frontend.
*   `server.js`: Servidor backend en Node.js puro. Maneja las rutas API (`/api/...`) y provee los archivos del frontend.
*   `Arrancar_Sistema.bat`: Script de Windows para facilitar la inicialización del sistema.
