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
        const { nom, prenom, email_academique, num, filiere, code } = payload;
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
            try {
                await pgClient.query('BEGIN');
                
                // Get student role ID (assume it exists from setup-db.js)
                let roleRes = await pgClient.query("SELECT id_role FROM roles WHERE libelle=$1", ['etudiant']);
                let roleId = roleRes.rows.length > 0 ? roleRes.rows[0].id_role : 2;

                let groupId = null;
                if (filiere) {
                    // Try to get group first
                    let grpRes = await pgClient.query("SELECT id_groupe FROM groupes WHERE nom_groupe ILIKE $1", [`%${filiere}%`]);
                    if (grpRes.rows.length > 0) {
                        groupId = grpRes.rows[0].id_groupe;
                    } else {
                        // Create new group if doesn't exist
                        grpRes = await pgClient.query("INSERT INTO groupes(nom_groupe) VALUES($1) RETURNING id_groupe", [filiere]);
                        groupId = grpRes.rows[0].id_groupe;
                    }
                }

                // Check if user already exists
                let userCheck = await pgClient.query("SELECT id_user FROM utilisateurs WHERE email_academique=$1", [email_academique]);
                let userId;
                
                if (userCheck.rows.length > 0) {
                    // Update existing user
                    userId = userCheck.rows[0].id_user;
                    await pgClient.query(
                        "UPDATE utilisateurs SET nom=$1, prenom=$2, id_groupe=$3, code=$4 WHERE id_user=$5 RETURNING id_user",
                        [nom, prenom, groupId, code || 'secret', userId]
                    );
                } else {
                    // Insert new user
                    const insertRes = await pgClient.query(
                        `INSERT INTO utilisateurs(zk_user_id, nom, prenom, email_academique, code, id_role, id_groupe)
                         VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id_user`,
                        [num || null, nom, prenom, email_academique, code || 'secret', roleId, groupId]
                    );
                    userId = insertRes.rows[0].id_user;
                }

                await pgClient.query('COMMIT');

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, id_user: userId }));
                return;
            } catch (dbErr) {
                await pgClient.query('ROLLBACK').catch(() => {});
                throw dbErr;
            }
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

async function handleApiLogin(req, res) {
    try {
        let body = '';
        for await (const chunk of req) body += chunk;
        const payload = JSON.parse(body || '{}');
        const { email, code } = payload;

        if (!email || !code) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Email and code required' }));
            return;
        }

        if (!pgClient) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database not available' }));
            return;
        }

        const result = await pgClient.query(
            'SELECT id_user, nom, prenom, email_academique, code, id_role FROM utilisateurs WHERE email_academique=$1',
            [email]
        );

        if (result.rows.length === 0) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
        }

        const user = result.rows[0];
        // Vérifier le code (password)
        if (user.code !== code) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid code' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, user: { id_user: user.id_user, nom: user.nom, prenom: user.prenom, email_academique: user.email_academique, id_role: user.id_role } }));
    } catch (err) {
        console.error('Login error', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal error' }));
    }
}

async function handleApiGetStudents(req, res, query) {
    const filiere = query.filiere;
    if (!filiere || !pgClient) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([]));
        return;
    }

    try {
        const result = await pgClient.query(
            'SELECT id_user, nom, prenom, email_academique, zk_user_id as num FROM utilisateurs WHERE id_groupe IN (SELECT id_groupe FROM groupes WHERE nom_groupe ILIKE $1)',
            [`%${filiere}%`]
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        console.error('Get students error', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'DB error' }));
    }
}

async function handleApiStatus(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'ok',
        app: 'FlowTrack v1.0',
        database: isDbConnected ? 'connected' : 'disconnected',
        databaseUrl: process.env.DATABASE_URL ? 'set' : 'not set',
        environment: process.env.NODE_ENV || 'development'
    }));
}

async function handleApiInitDb(req, res) {
    if (!pgClient) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database not available' }));
        return;
    }

    try {
        console.log('\n🔄 Initializing database...');
        
        // Drop existing tables
        await pgClient.query(`
            DROP TABLE IF EXISTS logs_pointage CASCADE;
            DROP TABLE IF EXISTS seances CASCADE;
            DROP TABLE IF EXISTS matieres CASCADE;
            DROP TABLE IF EXISTS utilisateurs CASCADE;
            DROP TABLE IF EXISTS groupes CASCADE;
            DROP TABLE IF EXISTS roles CASCADE;
        `);
        console.log('✅ Old tables dropped');

        // Read and execute schema
        const schemaPath = path.join(__dirname, 'db', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pgClient.query(schemaSql);
        console.log('✅ Schema created');

        // Insert test data
        const testData = `
            INSERT INTO roles(libelle) VALUES ('professeur'), ('etudiant'), ('admin')
            ON CONFLICT (libelle) DO NOTHING;

            INSERT INTO groupes(nom_groupe, niveau) VALUES 
                ('ISDIA', '3'),
                ('ILIA', '3'),
                ('Génie Informatique', '3'),
                ('Génie Logiciel', '3'),
                ('Cybersécurité', '3')
            ON CONFLICT DO NOTHING;

            INSERT INTO utilisateurs(nom, prenom, email_academique, code, id_role, id_groupe)
            SELECT 'Aberqi', 'Ahmed', 'ahmed.aberqi@ensa.ma', 'ensa2024', id_role, id_groupe
            FROM roles, groupes
            WHERE roles.libelle = 'professeur' AND groupes.nom_groupe = 'Génie Informatique'
            ON CONFLICT (email_academique) DO NOTHING;

            INSERT INTO utilisateurs(nom, prenom, email_academique, code, id_role, id_groupe)
            SELECT 'ANAS', 'Test', 'test@usmba.ac.ma', 'secret', id_role, id_groupe
            FROM roles, groupes
            WHERE roles.libelle = 'etudiant' AND groupes.nom_groupe = 'Génie Informatique'
            ON CONFLICT (email_academique) DO NOTHING;

            INSERT INTO matieres(nom_matiere, semestre) VALUES ('Algorithme', 'S1')
            ON CONFLICT DO NOTHING;
        `;

        await pgClient.query(testData);
        console.log('✅ Test data inserted\n');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'Database initialized successfully' }));
    } catch (err) {
        console.error('Database init error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to initialize database: ' + err.message }));
    }
}

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);
    // API routes
    if (parsed.pathname === '/api/status' && req.method === 'GET') {
        handleApiStatus(req, res);
        return;
    }
    if (parsed.pathname === '/api/signup' && req.method === 'POST') {
        handleApiSignup(req, res);
        return;
    }
    if (parsed.pathname === '/api/login' && req.method === 'POST') {
        handleApiLogin(req, res);
        return;
    }
    if (parsed.pathname === '/api/student' && req.method === 'GET') {
        handleApiGetStudent(req, res, parsed.query);
        return;
    }
    if (parsed.pathname === '/api/students' && req.method === 'GET') {
        handleApiGetStudents(req, res, parsed.query);
        return;
    }
    if (parsed.pathname === '/api/init-db' && req.method === 'POST') {
        handleApiInitDb(req, res);
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