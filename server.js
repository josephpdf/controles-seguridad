const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- CONFIGURACIÓN PRINCIPAL ---
// Puerto en el que el servidor escuchará las peticiones
const PORT = 3000;
// Directorio donde se almacenan los archivos JSON de la base de datos
const DATA_DIR = path.join(__dirname, 'data');
// Directorio para almacenar los logs diarios de auditoría
const LOGS_DIR = path.join(DATA_DIR, 'logs');
// Directorio de los archivos estáticos frontend (HTML, CSS, JS, IMG)
const PUBLIC_DIR = path.join(__dirname, 'public');

/**
 * Función para registrar auditoría (Logs por día)
 * Crea un archivo de texto por cada día y registra las acciones (creación, edición, eliminación)
 * @param {string} user - Nombre del usuario que realiza la acción
 * @param {string} method - Método HTTP utilizado (POST, DELETE)
 * @param {string} url - URL del recurso modificado
 * @param {object|number} details - Detalles del registro o ID del registro eliminado
 */
const logAction = (user, method, url, details) => {
    try {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0];
        const logFile = path.join(LOGS_DIR, `log_${dateStr}.txt`);
        
        let actionDesc = '';
        const resource = url.includes('/') ? (url.split('/').pop() || url.split('/')[2]) : url;
        
        if (method === 'POST') {
            fs.appendFileSync(logFile, `[${timeStr}] Usuario '${user}' realizó POST en '${resource}'. Datos: ${JSON.stringify(details)}\n`, 'utf8');
        } else if (method === 'DELETE') {
            const id = details.id || details;
            const extraInfo = details.name || details.numero || details.username || '';
            const detailStr = extraInfo ? `ID ${id} (${extraInfo})` : `ID ${id}`;
            fs.appendFileSync(logFile, `[${timeStr}] Usuario '${user}' ELIMINÓ registro ${detailStr} de '${resource}'. Datos: ${JSON.stringify(details)}\n`, 'utf8');
        }
    } catch (e) {
        console.error("Error guardando log:", e);
    }
};

// --- UTILIDADES PARA MANEJO DE ARCHIVOS JSON ---

/**
 * Función para leer un archivo JSON
 * @param {string} filename - Nombre del archivo a leer
 * @returns {Array} - Devuelve un arreglo con los datos o un arreglo vacío si hay un error o no existe
 */
const readData = (filename) => {
    try {
        const filePath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error al leer ${filename}:`, error);
        return [];
    }
};

/**
 * Función para escribir datos en un archivo JSON
 * @param {string} filename - Nombre del archivo a sobrescribir
 * @param {Array} data - Datos a guardar
 */
const writeData = (filename, data) => {
    try {
        const filePath = path.join(DATA_DIR, filename);
        // JSON.stringify con 'null, 2' formatea el archivo para que sea legible
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error al escribir ${filename}:`, error);
    }
};

/**
 * Utilidad para el hash de contraseñas de los usuarios
 * Usa el algoritmo SHA-256
 * @param {string} password - Contraseña en texto plano
 * @returns {string} - Contraseña encriptada en hexadecimal
 */
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

// Tipos MIME soportados para los archivos estáticos
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
};

// --- CREACIÓN DEL SERVIDOR HTTP ---
const server = http.createServer((req, res) => {
    // Configurar CORS para permitir peticiones desde el frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user');

    // Manejar peticiones de pre-vuelo (CORS options)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // --- RUTAS DE LA API (BACKEND) ---
    if (req.url.startsWith('/api/')) {
        let body = '';
        
        // Recibir los fragmentos de datos en peticiones POST
        req.on('data', chunk => {
            body += chunk.toString();
        });

        // Cuando se termina de recibir los datos
        req.on('end', () => {
            const parsedBody = body ? JSON.parse(body) : {};
            res.setHeader('Content-Type', 'application/json');

            // --- ENDPOINT DE LOGIN ---
            if (req.method === 'POST' && req.url === '/api/login') {
                const { username, password } = parsedBody;
                const users = readData('users.json');
                const hashedInput = hashPassword(password);
                
                // Buscar usuario que coincida y validar contraseña hasheada
                const user = users.find(u => u.username === username && u.password === hashedInput);
                
                if (user) {
                    // Remover la contraseña del objeto retornado por seguridad
                    const { password: _, ...userWithoutPassword } = user;
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, user: userWithoutPassword }));
                } else {
                    res.writeHead(401);
                    res.end(JSON.stringify({ success: false, message: 'Credenciales inválidas' }));
                }
                return;
            }

            // --- FUNCIÓN GENÉRICA DE CRUD (Create, Read, Update, Delete) ---
            /**
             * Maneja dinámicamente las operaciones CRUD para cualquier entidad
             * @param {string} entityName - Nombre de la entidad (users, radios, etc.)
             * @param {string} filename - Nombre del archivo JSON asociado
             */
            const handleCRUD = (entityName, filename) => {
                const data = readData(filename);
                // Extraer el nombre del usuario desde los headers para la auditoría
                const reqUser = req.headers['x-user'] || 'Sistema';

                if (req.method === 'GET') {
                    // Obtener todos los registros
                    res.writeHead(200);
                    res.end(JSON.stringify(data));
                } else if (req.method === 'POST') {
                    if (parsedBody.id) {
                        // ACTUALIZAR (El ID ya existe)
                        if (entityName === 'users' && parsedBody.password) {
                            parsedBody.password = hashPassword(parsedBody.password);
                        }
                        const index = data.findIndex(item => item.id === parsedBody.id);
                        if (index !== -1) {
                            if (entityName === 'users' && !parsedBody.password) {
                                // Mantener la contraseña anterior si no se envió una nueva
                                parsedBody.password = data[index].password; 
                            }
                            data[index] = { ...data[index], ...parsedBody };
                        }
                    } else {
                        // CREAR (Se genera un nuevo ID basado en la fecha actual)
                        parsedBody.id = Date.now();
                        if (entityName === 'users') {
                            parsedBody.password = hashPassword(parsedBody.password || '123456');
                        }
                        data.push(parsedBody);
                    }
                    
                    // Guardar los cambios y registrar la acción
                    writeData(filename, data);
                    logAction(reqUser, 'POST', entityName, parsedBody);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true }));
                } else if (req.method === 'DELETE') {
                    // ELIMINAR (Extraer ID de la URL)
                    const id = parseInt(req.url.split('/').pop());
                    const itemToDelete = data.find(item => item.id === id);
                    const newData = data.filter(item => item.id !== id);
                    
                    writeData(filename, newData);
                    logAction(reqUser, 'DELETE', entityName, itemToDelete || id);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true }));
                }
            };

            // --- ENDPOINT DE AUDITORÍA (LOGS) ---
            if (req.method === 'GET' && req.url.startsWith('/api/logs')) {
                try {
                    const urlObj = new URL(req.url, `http://${req.headers.host}`);
                    const dateParam = urlObj.searchParams.get('date');
                    
                    if (!dateParam) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: 'Se requiere el parámetro date (YYYY-MM-DD)' }));
                        return;
                    }
                    
                    const logFileName = `log_${dateParam}.txt`;
                    const filePath = path.join(LOGS_DIR, logFileName);
                    let allLogs = [];
                    
                    if (fs.existsSync(filePath)) {
                        const content = fs.readFileSync(filePath, 'utf8');
                        const lines = content.split('\n');
                        
                        lines.forEach(line => {
                            if (line.trim()) {
                                let timeMatch = line.match(/^\[(.*?)\]/);
                                let time = timeMatch ? timeMatch[1] : '';
                                
                                let userMatch = line.match(/Usuario '(.*?)'/);
                                let user = userMatch ? userMatch[1] : 'Desconocido';
                                
                                let action = line.includes('realizó POST') ? 'Crear/Editar' : (line.includes('ELIMINÓ') ? 'Eliminar' : 'Otro');
                                
                                let resourceMatch = line.match(/en '(.*?)'\./) || line.match(/de '(.*?)'\./);
                                let resource = resourceMatch ? resourceMatch[1] : '';
                                
                                let details = '';
                                if (action === 'Crear/Editar') {
                                    let dataMatch = line.split('Datos: ');
                                    details = dataMatch.length > 1 ? dataMatch[1] : '';
                                } else if (action === 'Eliminar') {
                                    let dataMatch = line.split('Datos: ');
                                    if (dataMatch.length > 1) {
                                        details = dataMatch[1];
                                    } else {
                                        let idMatch = line.match(/registro (.*?) de/);
                                        details = idMatch ? `${idMatch[1]}` : '';
                                    }
                                }
                                
                                allLogs.push({
                                    date: dateParam,
                                    time: time,
                                    user: user,
                                    action: action,
                                    resource: resource,
                                    details: details
                                });
                            }
                        });
                        
                        // Ordenar del más reciente al más antiguo por hora
                        allLogs.sort((a, b) => {
                            let dtA = new Date(`${a.date}T${a.time}`);
                            let dtB = new Date(`${b.date}T${b.time}`);
                            return dtB - dtA;
                        });
                    }
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(allLogs));
                } catch (err) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Error al leer logs' }));
                }
                return;
            }

            // Enrutamiento a la función CRUD correspondiente según la URL
            if (req.url.startsWith('/api/users')) return handleCRUD('users', 'users.json');
            if (req.url.startsWith('/api/collaborators')) return handleCRUD('collaborators', 'collaborators.json');
            if (req.url.startsWith('/api/radios')) return handleCRUD('radios', 'radios.json');
            if (req.url.startsWith('/api/keys')) return handleCRUD('keys', 'keys.json');
            if (req.url.startsWith('/api/transactions')) return handleCRUD('transactions', 'transactions.json');
            if (req.url.startsWith('/api/areas')) return handleCRUD('areas', 'areas.json');
            if (req.url.startsWith('/api/member_access')) return handleCRUD('member_access', 'member_access.json');

            // Ruta no encontrada en la API
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Ruta API no encontrada' }));
        });
        return;
    }

    // --- SERVIDOR DE ARCHIVOS ESTÁTICOS (FRONTEND) ---
    // Resolver la ruta del archivo solicitado. Si es '/', devolver 'index.html'
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
    const extname = path.extname(filePath);
    let contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Archivo no encontrado (404)
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Archivo no encontrado</h1>', 'utf8');
            } else {
                // Otro error del servidor (500)
                res.writeHead(500);
                res.end(`Error del servidor: ${err.code}`);
            }
        } else {
            // Servir el contenido del archivo con el Content-Type correcto
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf8');
        }
    });
});

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Usuario por defecto: superadmin / admin123`);
});
