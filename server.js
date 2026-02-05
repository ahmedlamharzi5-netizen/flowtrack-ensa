require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ===== DATABASE CONNECTION =====
let pgClient = null;
let isDbConnected = false;

async function initDatabase() {
    if (!process.env.DATABASE_URL) {
        console.log('⚠️  DATABASE_URL not set. Using JSON fallback mode.');
        return false;
    }

    try {
        const { Client } = require('pg');
        pgClient = new Client({ connectionString: process.env.DATABASE_URL });
        await pgClient.connect();
        console.log('✅ Connected to PostgreSQL database');
        isDbConnected = true;
        return true;
    } catch (err) {
        console.error('❌ PostgreSQL connection failed:', err.message);
        console.log('⚠️  Falling back to JSON storage mode');
        pgClient = null;
        isDbConnected = false;
        return false;
    }
}

// Ensure data folder exists for fallback storage
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const studentsFile = path.join(dataDir, 'students.json');
if (!fs.existsSync(studentsFile)) fs.writeFileSync(studentsFile, JSON.stringify([]));

function serveStatic(filePath, res) {
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    switch (ext) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpeg'; break;
        case '.svg': contentType = 'image/svg+xml'; break;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

async function handleApiSignup(req, res) {
    try {
        let body = '';
        for await (const chunk of req) body += chunk;
        const payload = JSON.parse(body || '{}');

        // Basic validation
        const { nom, prenom, email_academique, num, filiere } = payload;
        if (!nom || !prenom || !email_academique) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing fields' }));
            return;
        }
        if (!email_academique.endsWith('@usmba.ac.ma')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Email must be an academic address (usmba.ac.ma)' }));
            return;
        }

        // If Postgres is available, insert there
        if (pgClient) {
            // Minimal insertion: ensure role 'student' and group exist
            await pgClient.query('BEGIN');
            const roleRes = await pgClient.query("INSERT INTO roles(libelle) VALUES($1) ON CONFLICT (libelle) DO UPDATE SET libelle=EXCLUDED.libelle RETURNING id_role", ['student']);
            const roleId = roleRes.rows[0].id_role;

            let groupId = null;
            if (filiere) {
                const grpRes = await pgClient.query("INSERT INTO groupes(nom_groupe) VALUES($1) ON CONFLICT (nom_groupe) DO UPDATE SET nom_groupe=EXCLUDED.nom_groupe RETURNING id_groupe", [filiere]);
                groupId = grpRes.rows[0].id_groupe;
            }

            const insertUser = await pgClient.query(
                `INSERT INTO utilisateurs(zk_user_id, nom, prenom, email_academique, id_role, id_groupe)
                 VALUES($1,$2,$3,$4,$5,$6)
                 ON CONFLICT (email_academique) DO UPDATE SET nom=EXCLUDED.nom, prenom=EXCLUDED.prenom RETURNING id_user`,
                [num || null, nom, prenom, email_academique, roleId, groupId]
            );
            await pgClient.query('COMMIT');

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, id_user: insertUser.rows[0].id_user }));
            return;
        }

        // Fallback: save to local JSON file
        const students = JSON.parse(fs.readFileSync(studentsFile));
        const exists = students.find(s => s.email_academique === email_academique);
        if (exists) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, message: 'Account already exists' }));
            return;
        }
        const newStudent = { id: Date.now(), nom, prenom, email_academique, num: num || null, filiere: filiere || null };
        students.push(newStudent);
        fs.writeFileSync(studentsFile, JSON.stringify(students, null, 2));

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, student: newStudent }));
    } catch (err) {
        console.error('Signup error', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal error' }));
    }
}

function handleApiGetStudent(req, res, query) {
    const email = query.email;
    if (!email) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'email query param required' }));
        return;
    }

    if (pgClient) {
        pgClient.query('SELECT id_user, nom, prenom, email_academique FROM utilisateurs WHERE email_academique=$1', [email])
            .then(r => {
                if (r.rows.length === 0) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not found' }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(r.rows[0]));
                }
            }).catch(err => {
                console.error(err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'DB error' }));
            });
        return;
    }

    const students = JSON.parse(fs.readFileSync(studentsFile));
    const s = students.find(x => x.email_academique === email);
    if (!s) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(s));
}

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);
    // API routes
    if (parsed.pathname === '/api/signup' && req.method === 'POST') {
        handleApiSignup(req, res);
        return;
    }
    if (parsed.pathname === '/api/student' && req.method === 'GET') {
        handleApiGetStudent(req, res, parsed.query);
        return;
    }

    // Serve static files (existing behavior)
    let filePath = path.join(__dirname, parsed.pathname === '/' ? 'gestion.html' : parsed.pathname);
    if (parsed.pathname === '/') filePath = path.join(__dirname, 'gestion.html');
    // If the path is a directory, try index.html
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    serveStatic(filePath, res);
});

const PORT = process.env.PORT || 3005;

// Initialize and start server
initDatabase().then(() => {
    server.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║          🎓 FlowTrack - ENSA Fès Server                   ║
╚═══════════════════════════════════════════════════════════╝

📊 Database: ${isDbConnected ? '✅ PostgreSQL Connected' : '⚠️  JSON Fallback Mode'}
🚀 Server: http://localhost:${PORT}
📁 Static: Serving HTML/CSS/JS files
🔌 API: /api/signup, /api/student

🌐 Access:
  • Local:     http://localhost:${PORT}
  • Gestion:   http://localhost:${PORT}/gestion.html
  • Étudiant:  http://localhost:${PORT}/student.html

Press CTRL+C to stop
═══════════════════════════════════════════════════════════
        `);
    });
}).catch(err => {
    console.error('Failed to initialize:', err);
    process.exit(1);
});