const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Utilidades para archivos JSON
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

const writeData = (filename, data) => {
    try {
        const filePath = path.join(DATA_DIR, filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error al escribir ${filename}:`, error);
    }
};

// Utilidad para hash de contraseñas
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

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

const server = http.createServer((req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Rutas de API
    if (req.url.startsWith('/api/')) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const parsedBody = body ? JSON.parse(body) : {};
            res.setHeader('Content-Type', 'application/json');

            // --- LOGIN ---
            if (req.method === 'POST' && req.url === '/api/login') {
                const { username, password } = parsedBody;
                const users = readData('users.json');
                const hashedInput = hashPassword(password);
                const user = users.find(u => u.username === username && u.password === hashedInput);
                
                if (user) {
                    const { password: _, ...userWithoutPassword } = user;
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, user: userWithoutPassword }));
                } else {
                    res.writeHead(401);
                    res.end(JSON.stringify({ success: false, message: 'Credenciales inválidas' }));
                }
                return;
            }

            // --- GENERIC CRUD ---
            const handleCRUD = (entityName, filename) => {
                const data = readData(filename);
                if (req.method === 'GET') {
                    res.writeHead(200);
                    res.end(JSON.stringify(data));
                } else if (req.method === 'POST') {
                    if (parsedBody.id) {
                        // Actualizar
                        if (entityName === 'users' && parsedBody.password) {
                            parsedBody.password = hashPassword(parsedBody.password);
                        }
                        const index = data.findIndex(item => item.id === parsedBody.id);
                        if (index !== -1) {
                            if (entityName === 'users' && !parsedBody.password) {
                                parsedBody.password = data[index].password; // Keep old
                            }
                            data[index] = { ...data[index], ...parsedBody };
                        }
                    } else {
                        // Crear
                        parsedBody.id = Date.now();
                        if (entityName === 'users') {
                            parsedBody.password = hashPassword(parsedBody.password || '123456');
                        }
                        data.push(parsedBody);
                    }
                    writeData(filename, data);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true }));
                } else if (req.method === 'DELETE') {
                    const id = parseInt(req.url.split('/').pop());
                    const newData = data.filter(item => item.id !== id);
                    writeData(filename, newData);
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true }));
                }
            };

            if (req.url.startsWith('/api/users')) return handleCRUD('users', 'users.json');
            if (req.url.startsWith('/api/collaborators')) return handleCRUD('collaborators', 'collaborators.json');
            if (req.url.startsWith('/api/radios')) return handleCRUD('radios', 'radios.json');
            if (req.url.startsWith('/api/keys')) return handleCRUD('keys', 'keys.json');
            if (req.url.startsWith('/api/transactions')) return handleCRUD('transactions', 'transactions.json');
            if (req.url.startsWith('/api/areas')) return handleCRUD('areas', 'areas.json');

            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Ruta API no encontrada' }));
        });
        return;
    }

    // Servidor de archivos estáticos
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
    const extname = path.extname(filePath);
    let contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Archivo no encontrado</h1>', 'utf8');
            } else {
                res.writeHead(500);
                res.end(`Error del servidor: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Usuario por defecto: superadmin / admin123`);
});
