# Sistema de Control de Inventario - San José Indoor Club

Sistema web local diseñado para la gestión y control de inventarios de Radios y Llaves de cerrajería, enfocado en el registro de entregas, recepciones, y la asignación de equipos al personal interno.

## 📋 Características Principales

*   **Gestión de Inventario:** Control detallado de Radios (por número, serie, área) y Llaves (número y detalle).
*   **Módulo de Transacciones:** Registro preciso de salidas y entradas de equipos, guardando la fecha, hora y el oficial responsable del movimiento.
*   **Asignaciones Fijas y Temporales:** Posibilidad de asignar un equipo de forma fija a un colaborador o prestado temporalmente.
*   **Estados Dinámicos:** Cálculo automático de los estados de los equipos (`Disponible`, `En Uso`, `No Disponible`) según las asignaciones y transacciones activas.
*   **Roles de Seguridad:**
    *   **Super Administrador:** Acceso total, incluyendo la edición manual de tiempos de entrega y recepción.
    *   **Administrador:** Acceso a módulos administrativos para crear y modificar inventarios, usuarios, áreas y colaboradores.
    *   **Usuario (Oficial):** Acceso restringido exclusivamente en modo lectura para inventarios y creación de transacciones (entradas/salidas).
*   **Auditoría y Logs:** Todo movimiento (creación, edición, eliminación y transacciones) es registrado en archivos de texto diarios (`/data/logs/`) de manera automática.

---

## 🚀 Requisitos Previos e Instalación de Node.js

El sistema está construido en **Vanilla JavaScript** (Frontend) y **Node.js nativo** (Backend). No requiere bases de datos externas (MySQL/SQL Server), ya que toda la persistencia se maneja localmente en archivos JSON. 

El único requisito es tener **Node.js** instalado en el Servidor.

### Paso a paso para instalar Node.js (Windows)
1. Ingresa a la página oficial: [https://nodejs.org/es/download/](https://nodejs.org/es/download/)
2. Descarga el instalador de Windows (recomendada la versión LTS - Long Term Support).
3. Abre el archivo `.msi` descargado.
4. Sigue el asistente de instalación dando clic en **"Next"** (Siguiente) a todo. No es necesario cambiar ninguna configuración predeterminada. Acepta los términos y condiciones.
5. Haz clic en **"Install"** y espera a que termine.
6. Para comprobar que se instaló correctamente, abre la consola de comandos de Windows (`cmd`), escribe `node -v` y presiona Enter. Si te responde con un número de versión (ej. `v18.17.0`), ¡estás listo!

---

## ⚙️ Instalación y Ejecución

Puedes arrancar el sistema de dos maneras, dependiendo de si lo vas a usar de forma rápida o si lo vas a dejar fijo en un Servidor.

### Opción 1: Ejecución Manual / Pruebas (Con ventana visible)
Ideal para revisar el sistema rápidamente, pero **deja una ventana negra abierta** que si se cierra, apaga el sistema.
1. Copia la carpeta de este proyecto en el servidor.
2. Haz doble clic en el archivo **`Arrancar_Sistema.bat`**.
3. Se abrirá la consola. ¡No la cierres!
4. Entra en tu navegador web a la dirección: `http://localhost:3000`

### Opción 2: Modo Servidor Profesional (Oculto 24/7 con PM2) - ⭐ Recomendado
Esta es la manera correcta de montar el sistema en el servidor (ej. `[IP_ADDRESS]`). El sistema correrá de forma oculta en segundo plano y se reiniciará automáticamente si llega a haber un error.

1. Abre la consola de Windows (`cmd`) en la carpeta donde pegaste este proyecto.
2. Instala PM2 (el administrador de procesos) ejecutando:
   ```bash
   npm install -g pm2
   ```
3. Arranca el servidor de forma oculta poniéndole un nombre:
   ```bash
   pm2 start server.js --name "Controles-Seguridad"
   ```
   *(A partir de este momento, el sistema ya está en línea y puedes cerrar la consola sin miedo).*
4. Guarda el estado actual para que PM2 lo recuerde:
   ```bash
   pm2 save
   ```

**Comandos útiles de PM2:**
*   `pm2 list`: Para ver si el sistema está en línea (Online).
*   `pm2 stop Controles-Seguridad`: Para apagar el sistema.
*   `pm2 restart Controles-Seguridad`: Para reiniciar el sistema.
*   `pm2 logs`: Para ver si hay errores en vivo.

---

## 🗂️ Estructura del Sistema

*   `/data`: Carpeta equivalente a la base de datos. Contiene los archivos `.json` con la información.
*   `/data/logs`: Almacena el historial de movimientos de auditoría, separados por día en archivos `.txt`.
*   `/public`: Archivos expuestos para el cliente (HTML, CSS, JS e Imágenes).
*   `server.js`: Servidor backend en Node.js puro. Maneja las rutas API (`/api/...`).
*   `Arrancar_Sistema.bat`: Script de Windows de uso rápido.
