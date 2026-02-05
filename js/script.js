/* ===========================
   UTILISATEURS
   =========================== */

const users = {
    // Example professor account with associated modules per filiere
    'professeur': {
        password: 'ensa2024',
        name: 'Ahmed Aberqi',
        modules: {
            isdia: ['Analyse', 'Algèbre'],
            info: ['Algèbre'],
            logiciel: ['Génie logiciel'],
            cyber: ['Sécurité réseaux']
        }
    },
    'admin': { password: 'admin123', name: 'Administrateur', modules: {} }
};

// ❌ SUPPRIMÉ: Les données des étudiants viennent UNIQUEMENT de PostgreSQL via /api/students
// Les données hardcoded ne sont plus utilisées

// ===========================
// STOCKAGE DES DONNÉES
// ===========================

let donnees = { absences: {} };

// 🔥 CHARGER LES DONNÉES DEPUIS POSTGRESQL (PARTAGÉES ENTRE TOUS LES PROFS)
async function loadAttendanceFromDB(filiere, semaine) {
    try {
        const response = await fetch(`/api/attendance?filiere=${encodeURIComponent(filiere)}&semaine=${semaine}`);
        if (!response.ok) {
            console.warn(`⚠️ Erreur chargement absences PostgreSQL (${response.status})`);
            return;
        }
        const data = await response.json();
        if (data.absences) {
            // REMPLACER les données locales par les données PostgreSQL (pas fusionner!)
            // Cela garantit que TOUS les profs voient la MÊME chose
            for (const key of Object.keys(donnees.absences)) {
                if (key.startsWith(`${filiere}_${semaine}_`)) {
                    delete donnees.absences[key];
                }
            }
            Object.assign(donnees.absences, data.absences);
            console.log(`✅ ${Object.keys(data.absences).length} absences chargées de PostgreSQL pour ${filiere} S${semaine}`);
        }
    } catch (err) {
        console.error(`❌ Erreur connexion PostgreSQL pour ${filiere} S${semaine}:`, err.message);
    }
}

// Charger les données GLOBALES (PAS par utilisateur - partagées entre tous les profs!)
async function loadData() {
    try {
        // 🔥 Initialiser avec données vides - on charge depuis PostgreSQL à chaque fois!
        donnees = { absences: {} };

        // Exposer globalement
        window.donnees = donnees;

        // Signaler que les données sont prêtes
        window.dispatchEvent(new Event('donneesLoaded'));
        console.log('✅ Données initialisées - prêtes à charger depuis PostgreSQL');
    } catch (error) {
        console.error('Erreur lors du chargement des donnees:', error);
        donnees = { absences: {} };
        window.donnees = donnees;
    }
}

// ===========================
// FONCTIONS INITIALISATION
// ===========================

/**
 * Initialiser l'application au chargement de la page
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    
    // Initialiser pour la page gestion (présences)
    if (document.getElementById('semaineSelect')) {
        initializeWeeks();
    }

    // Vérifier l'authentification sur la page gestion
    if (document.getElementById('semaineSelect')) {
        if (!sessionStorage.getItem('user_logged_in')) {
            window.location.href = 'login.html';
        }
    }

    // Initialiser le formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // If on signup page, attach handler (signup.html uses same ids)
    const signupForm = document.getElementById('signupForm');
    if (signupForm) signupForm.addEventListener('submit', handleSignupSubmit);
    const signupCancel = document.getElementById('signupCancel');
    if (signupCancel) signupCancel.addEventListener('click', closeSignupModal);

    // If no local registered students, try loading a default test list from /data/students.json
    try {
        const existing = JSON.parse(localStorage.getItem('local_students') || '[]');
        if (!existing || existing.length === 0) {
            const resp = await fetch('/data/students.json');
            if (resp.ok) {
                const list = await resp.json();
                // Normalize and store as local_students
                const normalized = list.map(s => ({
                    nom: s.nom || s.Nom || '',
                    prenom: s.prenom || s.Prenom || '',
                    email_academique: s.email_academique || s.email || '',
                    num: s.num || s.id || null,
                    filiere: s.filiere || '',
                    code: s.code || '',
                    deviceId: s.deviceId || ''
                }));
                if (normalized.length) localStorage.setItem('local_students', JSON.stringify(normalized));
            }
        }
    } catch (e) {
        // ignore fetch errors (server may be static without data)
        console.warn('Could not load /data/students.json', e);
    }
});

// Attacher l'événement de connexion immédiatement si on est sur la page de login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

/**
 * Initialiser les semaines disponibles
 */
function initializeWeeks() {
    console.log('Initialisation des semaines...');
    const semaineSelect = document.getElementById('semaineSelect');
    console.log('Élément semaineSelect:', semaineSelect);
    
    if (semaineSelect) {
        // Vider les options existantes sauf la première
        while (semaineSelect.options.length > 1) {
            semaineSelect.remove(1);
        }
        
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Semaine ${i}`;
            semaineSelect.appendChild(option);
            console.log(`Ajout semaine ${i}`);
        }
        console.log('Semaines ajoutées avec succès');
    } else {
        console.error('Élément semaineSelect non trouvé');
    }
}

// ===========================
// AUTHENTIFICATION
// ===========================

/**
 * Gérer la connexion de l'utilisateur
 */
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMessage = document.getElementById('errorMessage');

    console.log('Tentative de connexion:', username, password);

    // First check local hardcoded users (for professors)
    if (users[username]) {
        if (users[username].password !== password) {
            errorMessage.textContent = '❌ Nom d\'utilisateur ou mot de passe incorrect';
            errorMessage.style.display = 'block';
            return;
        }
        // Local professor login
        errorMessage.style.display = 'none';
        sessionStorage.setItem('user_logged_in', 'true');
        sessionStorage.setItem('current_user', username);
        sessionStorage.setItem('current_user_display', users[username].name || username);
        sessionStorage.setItem('current_user_modules', JSON.stringify(users[username].modules || {}));
        setTimeout(() => {
            window.location.href = 'gestion.html';
        }, 500);
        return;
    }

    // Try API login for students
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: username, code: password })
        });

        if (!res.ok) {
            errorMessage.textContent = '❌ Email ou code incorrect';
            errorMessage.style.display = 'block';
            return;
        }

        const data = await res.json();
        if (!data.ok && !data.user) {
            errorMessage.textContent = '❌ Email ou code incorrect';
            errorMessage.style.display = 'block';
            return;
        }

        const user = data.user || data;
        errorMessage.style.display = 'none';
        sessionStorage.setItem('user_logged_in', 'true');
        sessionStorage.setItem('current_user', user.email_academique);
        sessionStorage.setItem('current_user_display', `${user.prenom} ${user.nom}`);
        sessionStorage.setItem('user_id', user.id_user);
        // 🔥 Store modules if returned from API
        if (user.modules) {
            sessionStorage.setItem('current_user_modules', JSON.stringify(user.modules));
        }

        // Redirect to appropriate page based on role
        // id_role=2 is professor
        const redirectPage = user.id_role === 2 ? 'gestion.html' : 'student.html';
        setTimeout(() => {
            window.location.href = redirectPage;
        }, 500);
    } catch (err) {
        console.error('Login error:', err);
        errorMessage.textContent = '❌ Erreur de connexion. Vérifiez votre email ou code.';
        errorMessage.style.display = 'block';
    }
}

/**
 * Return teacher's default module for a filiere (first module) or empty string
 */
function getTeacherDefaultModule(filiere) {
    try {
        const raw = sessionStorage.getItem('current_user_modules');
        if (raw) {
            const modules = JSON.parse(raw);
            if (modules) {
                const list = modules[filiere];
                if (Array.isArray(list) && list.length) return list[0];
            }
        }
        // Default mapping: isdia -> Algèbre, others -> Analyse
        const defaults = { isdia: 'Algèbre' };
        return defaults[filiere] || 'Analyse';
    } catch (e) { return ''; }
}

/**
 * Get array of modules for current teacher for a filiere
 */
function getTeacherModules(filiere) {
    try {
        const raw = sessionStorage.getItem('current_user_modules');
        if (raw) {
            const modules = JSON.parse(raw);
            if (modules && modules[filiere] && Array.isArray(modules[filiere]) && modules[filiere].length) return modules[filiere];
        }
    } catch (e) { /* ignore */ }
    // no modules defined for this teacher+filiere
    return [];
}

/**
 * Populate module select element on gestion page for a filiere
 */
function updateModuleLabel(filiere) {
    const label = document.getElementById('moduleLabel');
    if (!label) return;
    const modules = getTeacherModules(filiere || (document.getElementById('filiereSelect') && document.getElementById('filiereSelect').value));
    if (modules && modules.length) label.textContent = modules.join(', ');
    else label.textContent = '—';
}

/**
 * Déconnexion
 */
function logout() {
    sessionStorage.removeItem('user_logged_in');
    sessionStorage.removeItem('current_user');
    sessionStorage.removeItem('user_email');
    window.location.href = 'login.html';
}

// ===========================
// GESTION DES ABSENCES
// ===========================

/**
 * Charger les étudiants de la filière sélectionnée
 */
async function loadStudents() {
    const filiere = document.getElementById('filiereSelect').value;
    const semaineSelect = document.getElementById('semaineSelect');

    // Réinitialiser la semaine
    semaineSelect.value = '';

    if (!filiere) {
        document.getElementById('tableContainer').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
        return;
    }

    // Charger les étudiants depuis l'API
    try {
        const res = await fetch(`/api/students?filiere=${encodeURIComponent(filiere)}`);
        if (res.ok) {
            const data = await res.json();
            // Normaliser et stocker les étudiants
            if (Array.isArray(data) && data.length > 0) {
                if (!etudiants[filiere]) etudiants[filiere] = [];
                etudiants[filiere] = data.map(s => ({
                    num: s.num || s.id_user,
                    nom: (s.nom || '').toUpperCase(),
                    prenom: s.prenom || '',
                    email: s.email_academique || ''
                }));
            }
        }
    } catch (err) {
        console.warn('Could not load students from API:', err);
    }

    updateTableau();
}

/**
 * Récupérer la liste d'étudiants pour une filière en priorisant les inscriptions
 * (localStorage / API) puis en complétant avec les listes statiques pour tests.
 */
function getRegisteredStudents(filiere) {
    const local = JSON.parse(localStorage.getItem('local_students') || '[]');
    const localForF = local.filter(s => s.filiere && s.filiere.toLowerCase() === filiere.toLowerCase());
    // return students in expected format
    return localForF.map(s => ({ num: s.num, nom: (s.nom||'').toUpperCase(), prenom: s.prenom }));
}

/**
 * Mettre à jour le tableau des absences
 */
async function updateTableau() {
    const filiere = document.getElementById('filiereSelect').value;
    const semaine = document.getElementById('semaineSelect').value;
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');

    if (!filiere || !semaine) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    // 🔥 CHARGER LES DONNÉES DESDE POSTGRESQL
    await loadAttendanceFromDB(filiere, semaine);

    // Afficher le tableau
    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';

    // Remplir le tableau
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const students = getRegisteredStudents(filiere);
    students.forEach(student => {
        const row = document.createElement('tr');
        const key = `${filiere}_${semaine}_${student.num}`;
        const raw = donnees.absences[key];
        const status = (raw && typeof raw === 'string') ? raw : (raw && raw.statut ? raw.statut : '');

        row.innerHTML = `
            <td class="numero-col">${String(student.num).padStart(2, '0')}</td>
            <td class="nom-col">${student.nom}</td>
            <td class="prenom-col">${student.prenom}</td>
            <td>
                <div class="status-buttons">
                    <button class="status-btn ${status === 'present' ? 'present' : ''}" 
                            onclick="setStatus('${filiere}', ${semaine}, ${student.num}, 'present')">
                        ✓ Présent
                    </button>
                    <button class="status-btn ${status === 'absent' ? 'absent' : ''}" 
                            onclick="setStatus('${filiere}', ${semaine}, ${student.num}, 'absent')">
                        ✗ Absent
                    </button>
                </div>
            </td>
            <td>
                <button class="btn-detail btn-secondary" onclick="openDetail('${filiere}', ${student.num})">Détail</button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Appliquer les styles
    applyStatusStyles();
}

/**
 * Définir le statut d'un étudiant
 */
function setStatus(filiere, semaine, num, status) {
    const key = `${filiere}_${semaine}_${num}`;
    // Determine module and teacher from teacher's modules for this filiere
    const modules = getTeacherModules(filiere);
    const moduleName = (modules && modules.length) ? modules[0] : '';
    const teacherName = sessionStorage.getItem('current_user_display') || sessionStorage.getItem('current_user') || '';

    // Preserve existing structure if it was a string (backward compatibility)
    const existing = donnees.absences[key];
    if (existing && typeof existing === 'object') {
        // update fields
        existing.statut = status;
        if (moduleName) existing.module = moduleName;
        if (teacherName) existing.teacher = teacherName;
        donnees.absences[key] = existing;
    } else {
        // write as object
        donnees.absences[key] = { statut: status, module: moduleName || undefined, teacher: teacherName || undefined };
    }

    // 🔥 SAUVEGARDER DANS POSTGRESQL (NEW)
    fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filiere, semaine, num, statut: status })
    })
    .then(res => {
        if (!res.ok) console.warn(`⚠️ Erreur API attendance (${res.status}):`, res.statusText);
        return res.json();
    })
    .then(data => {
        if (data.ok) {
            console.log(`✅ Statut sauvegardé PostgreSQL: ${filiere} S${semaine} #${num} = ${status}`);
        } else {
            console.warn('⚠️ API error:', data.error);
        }
    })
    .catch(err => console.error('❌ Erreur connexion PostgreSQL:', err.message));

    // 🔥 NE PAS sauvegarder en localStorage - SEULE la BD PostgreSQL compte!
    // Cela garantit que les données sont PARTAGÉES entre tous les profs
    // (localStorage n'est utilisé que comme cache temporaire)
    
    // Signaler la mise à jour des données
    window.dispatchEvent(new Event('donneesUpdated'));

    // Mettre à jour les boutons visuels
    updateTableau();
    
    // Mettre à jour les statistiques
    if (typeof updateStatistics === 'function') {
        updateStatistics();
    }
}

/**
 * Appliquer les styles aux boutons de statut
 */
function applyStatusStyles() {
    const buttons = document.querySelectorAll('.status-btn');
    buttons.forEach(btn => {
        if (btn.classList.contains('present') || btn.classList.contains('absent')) {
            btn.style.cursor = 'pointer';
        } else {
            btn.style.cursor = 'pointer';
            btn.style.opacity = '0.7';
        }
    });
}

/**
 * Réinitialiser les données de la semaine actuelle
 */
function resetData() {
    const filiere = document.getElementById('filiereSelect').value;
    const semaine = document.getElementById('semaineSelect').value;

    if (!filiere || !semaine) {
        alert('Veuillez sélectionner une filière et une semaine');
        return;
    }

    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les statuts de cette semaine ?')) {
        const students = etudiants[filiere];
        students.forEach(student => {
            const key = `${filiere}_${semaine}_${student.num}`;
            delete donnees.absences[key];
        });
        updateTableau();
    }
}

// ===========================
// IMPORT .DAT
// ===========================

/**
 * Importer les données depuis un fichier .dat ZKTeco
 */
function importDAT() {
    const filiere = document.getElementById('filiereSelect').value;
    const semaine = document.getElementById('semaineSelect').value;

    if (!filiere || !semaine) {
        alert('Veuillez sélectionner une filière et une semaine avant d\'importer');
        return;
    }

    // Créer un input file caché
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.dat,.txt';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                parseDATFile(content, filiere, semaine);
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

/**
 * Parser le contenu du fichier .dat
 */
function parseDATFile(content, filiere, semaine) {
    const lines = content.split('\n');
    let importedCount = 0;
    let invalidCount = 0;
    let absentMarkedCount = 0;

    // Registered students for this filiere
    const registered = getRegisteredStudents(filiere);
    const localStudents = JSON.parse(localStorage.getItem('local_students') || '[]');

    // Determine module and teacher once for this import
    const modules = getTeacherModules(filiere);
    const moduleName = (modules && modules.length) ? modules[0] : '';
    const teacherName = sessionStorage.getItem('current_user_display') || sessionStorage.getItem('current_user') || '';

    // Keep a set of keys marked present during this import to avoid duplicates
    const markedThisImport = new Set();

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        // Accept CSV or whitespace-separated; first column is zdk/device id or num
        const cols = line.split(/[,;\s]+/);
        const first = cols[0];
        if (!first) { invalidCount++; return; }

        // Try matching by deviceId, num, zk_user_id, or email
        let student = localStudents.find(s => String(s.deviceId) === String(first) || String(s.num) === String(first) || String(s.zk_user_id) === String(first) || String(s.email_academique) === String(first));

        // If not found, try registered transformed list
        if (!student) {
            const reg = registered.find(r => String(r.num) === String(first));
            if (reg) student = localStudents.find(s => String(s.num) === String(reg.num));
        }

        if (!student) { invalidCount++; return; }

        const key = `${filiere}_${semaine}_${student.num}`;
        // Only count and set if not already marked present in this import
        if (!markedThisImport.has(key)) {
            const existing = donnees.absences[key];
            const alreadyPresent = (existing && (typeof existing === 'string' ? existing === 'present' : existing.statut === 'present'));
            if (!alreadyPresent) {
                donnees.absences[key] = { statut: 'present', module: moduleName || undefined, teacher: teacherName || undefined };
                markedThisImport.add(key);
                importedCount++;
            }
        }
        // If already present, ignore duplicates silently
    });

    // After processing the import, mark registered students who were NOT found in the .dat as 'absent'
    // (but do not overwrite an existing 'present' status).
    registered.forEach(student => {
        const key = `${filiere}_${semaine}_${student.num}`;
        if (markedThisImport.has(key)) return; // this student was marked present during import
        const existing = donnees.absences[key];
        const alreadyPresent = (existing && (typeof existing === 'string' ? existing === 'present' : existing.statut === 'present'));
        if (!alreadyPresent) {
            donnees.absences[key] = { statut: 'absent', module: moduleName || undefined, teacher: teacherName || undefined };
            absentMarkedCount++;
        }
    });

    // Persist updates
    const currentUser = sessionStorage.getItem('current_user');
    if (currentUser) localStorage.setItem('donnees_' + currentUser, JSON.stringify(donnees));
    sessionStorage.setItem('donnees', JSON.stringify(donnees));
    localStorage.setItem('donnees_global', JSON.stringify(donnees));
    window.dispatchEvent(new Event('donneesUpdated'));
    updateTableau();
    if (typeof updateStatistics === 'function') updateStatistics();

    alert(`Import terminé: ${importedCount} présences importées, ${absentMarkedCount} absences marquées, ${invalidCount} enregistrements invalides ignorés.`);
}

/**
 * Obtenir le numéro de semaine dans l'année
 */
function getWeekOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return Math.floor(dayOfYear / 7) + 1;
}

// ===========================
// EXPORT PDF
// ===========================

/**
 * Exporter le tableau en PDF
 */
function exportToPDF() {
    const filiere = document.getElementById('filiereSelect').value;
    const semaine = document.getElementById('semaineSelect').value;

    if (!filiere || !semaine) {
        alert('Veuillez sélectionner une filière et une semaine avant d\'exporter');
        return;
    }

    // Récupérer le tableau
    const table = document.getElementById('attendanceTable');
    const filiereLabel = document.getElementById('filiereSelect').options[document.getElementById('filiereSelect').selectedIndex].text;

    // Créer un conteneur temporaire pour le PDF
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.backgroundColor = '#FFFFFF';

    // En-tête du PDF
    const header = document.createElement('div');
    header.style.marginBottom = '20px';
    header.style.borderBottom = '2px solid #0B3C5D';
    header.style.paddingBottom = '15px';

    const title = document.createElement('h1');
    title.textContent = 'ENSA Fès - Rapport de Présence';
    title.style.color = '#0B3C5D';
    title.style.marginBottom = '10px';

    const details = document.createElement('p');
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    details.innerHTML = `
        <strong>Filière :</strong> ${filiereLabel}<br>
        <strong>Semaine :</strong> ${semaine}<br>
        <strong>Date :</strong> ${dateStr}
    `;
    details.style.color = '#2C3E50';
    details.style.fontSize = '14px';

    header.appendChild(title);
    header.appendChild(details);
    element.appendChild(header);

    // Clone du tableau
    const tableClone = table.cloneNode(true);
    element.appendChild(tableClone);

    // Options pour html2pdf
    const options = {
        margin: 10,
        filename: `presence_${filiereLabel}_semaine${semaine}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    // Générer et télécharger le PDF
    html2pdf().set(options).from(element).save();
}

// ===========================
// IMPRESSION NAVIGATEUR
// ===========================

/**
 * Utiliser la fonction d'impression du navigateur
 */
function printPDF() {
    window.print();
}

// Ouvrir la page de dÃ©tail pour un Ã©tudiant (filiÃ¨re + num)
function openDetail(filiere, num) {
    // Open the full detail page (with charts) for both professors and students
    window.location.href = `quatrieme_page.html?filiere=${filiere}&num=${num}`;
}

function renderStudentHistoryModal(filiere, num) {
    try {
        const local = JSON.parse(localStorage.getItem('local_students') || '[]');
        let s = local.find(x => String(x.num) === String(num) && x.filiere && x.filiere.toLowerCase() === filiere.toLowerCase());
        if (!s) {
            const arr = etudiants[filiere] || [];
            const r = arr.find(x => String(x.num) === String(num));
            s = r ? { num: r.num, nom: r.nom, prenom: r.prenom, filiere } : { num, nom: '—', prenom: '—', filiere };
        }

        document.getElementById('modalStudentName').textContent = (s.nom + ' ' + s.prenom).trim();
        document.getElementById('modalFiliere').textContent = filiere;
        document.getElementById('modalNum').textContent = s.num || num;

        // Build history map by semaine
        const byWeek = new Map();
        for (const k in donnees.absences) {
            const parts = k.split('_');
            if (parts.length !== 3) continue;
            const [f, semaine, n] = parts;
            if (f !== filiere || String(n) !== String(num)) continue;
            const raw = donnees.absences[k];
            const statut = (raw && typeof raw === 'string') ? raw : (raw && raw.statut ? raw.statut : 'Non renseigné');
            const moduleName = (raw && raw.module) ? raw.module : '';
            const teacherName = (raw && raw.teacher) ? raw.teacher : '';
            const existing = byWeek.get(semaine);
            if (!existing) byWeek.set(semaine, { statut, module: moduleName, teacher: teacherName });
            else {
                if (existing.statut !== 'present' && statut === 'present') byWeek.set(semaine, { statut, module: moduleName, teacher: teacherName });
            }
        }

        const weeks = Array.from(byWeek.keys()).map(w => parseInt(w)).filter(n => !isNaN(n)).sort((a,b)=>a-b);
        const tbody = document.getElementById('modalHistoryBody'); tbody.innerHTML = '';
        weeks.forEach(w => {
            const info = byWeek.get(String(w));
            const statut = info && info.statut ? info.statut : 'Non renseigné';
            const moduleName = (info && info.module) ? info.module : getTeacherDefaultModule(filiere);
            const teacherName = (info && info.teacher) ? info.teacher : '';
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${w}</td><td>${statut}</td><td>${moduleName}</td><td>${teacherName}</td>`;
            tbody.appendChild(tr);
        });

        const modal = document.getElementById('studentHistoryModal');
        if (!modal) return;
        modal.style.display = 'flex';
        const closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    } catch (e) {
        console.error('Erreur affichage modal étudiant', e);
    }
}

// ===========================
// INSCRIPTION ÉTUDIANT (FRONT)
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // Handle student login form (student.html)
    const studentLoginForm = document.getElementById('studentLoginForm');
    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', handleStudentLogin);
    }

    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) signupBtn.addEventListener('click', openSignupModal);

    const signupCancel = document.getElementById('signupCancel');
    if (signupCancel) signupCancel.addEventListener('click', closeSignupModal);

    const signupForm = document.getElementById('signupForm');
    if (signupForm) signupForm.addEventListener('submit', handleSignupSubmit);
});

async function handleStudentLogin(e) {
    e.preventDefault();
    const email = document.getElementById('studentEmail').value.trim();
    const code = document.getElementById('studentCode').value.trim();
    const msg = document.getElementById('studentMsg');

    if (!email || !code) {
        if (msg) {
            msg.style.display = 'block';
            msg.textContent = 'Veuillez remplir tous les champs';
        }
        return;
    }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
            if (msg) {
                msg.style.display = 'block';
                msg.textContent = '❌ Utilisateur introuvable ou code incorrect.';
            }
            return;
        }

        const user = data.user;
        if (msg) {
            msg.style.display = 'block';
            msg.style.color = '#080';
            msg.textContent = 'Connexion réussie...';
        }

        // Store session info
        sessionStorage.setItem('user_logged_in', 'true');
        sessionStorage.setItem('current_user', user.email_academique);
        sessionStorage.setItem('current_user_display', `${user.prenom} ${user.nom}`);
        sessionStorage.setItem('user_id', user.id_user);

        // Redirect after 500ms
        setTimeout(() => {
            window.location.href = 'student.html?logged=true';
        }, 500);
    } catch (err) {
        console.error('Student login error:', err);
        if (msg) {
            msg.style.display = 'block';
            msg.textContent = '❌ Erreur de connexion. Vérifiez votre email et votre code.';
        }
    }
}

function openSignupModal() {
    const m = document.getElementById('signupModal');
    if (m) m.style.display = 'flex';
}

function closeSignupModal() {
    const m = document.getElementById('signupModal');
    if (m) m.style.display = 'none';
    const msg = document.getElementById('signupMsg'); if (msg) { msg.style.display='none'; msg.textContent=''; }
}

async function handleSignupSubmit(e) {
    e.preventDefault();
    const nom = document.getElementById('signupNom').value.trim();
    const prenom = document.getElementById('signupPrenom').value.trim();
    const num = document.getElementById('signupNum').value.trim();
    const filiere = document.getElementById('signupFiliere').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const code = (document.getElementById('signupCode') ? document.getElementById('signupCode').value.trim() : '');
    const deviceId = (document.getElementById('signupDevice') ? document.getElementById('signupDevice').value.trim() : '');
    const msg = document.getElementById('signupMsg');

    if (!email.endsWith('@usmba.ac.ma')) {
        if (msg) { msg.style.display='block'; msg.textContent='Utilisez une adresse usmba.ac.ma'; }
        return;
    }

    try {
        const res = await fetch('/api/signup', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, prenom, num, filiere, email_academique: email, code, deviceId })
        });
        const data = await res.json();
        if (!res.ok) {
            // Fallback: save locally so student can see account immediately
            saveLocalStudent({ nom, prenom, num, filiere, email_academique: email, code, deviceId });
            if (msg) { msg.style.display='block'; msg.textContent = data.error || 'Inscription enregistrée localement.'; }
            setTimeout(() => { closeSignupModal(); }, 900);
            return;
        }

        // SUCCESS: Save ALSO to localStorage for immediate access
        saveLocalStudent({ nom, prenom, num, filiere, email_academique: email, code, deviceId });
        
        if (msg) { msg.style.display='block'; msg.style.color='#080'; msg.textContent = 'Inscription réussie.'; }
        setTimeout(() => {
            // If modal exists, close it; otherwise redirect back to student login
            const modal = document.getElementById('signupModal');
            if (modal) { closeSignupModal(); } else { window.location.href = 'student.html'; }
        }, 900);
    } catch (err) {
        // Network error: persist locally so the user can continue
        saveLocalStudent({ nom, prenom, num, filiere, email_academique: email, code, deviceId });
        if (msg) { msg.style.display='block'; msg.textContent='Inscription enregistrée localement (offline).'; }
        setTimeout(() => {
            const modal = document.getElementById('signupModal');
            if (modal) { closeSignupModal(); } else { window.location.href = 'student.html'; }
        }, 900);
    }
}

function saveLocalStudent(student) {
    try {
        const key = 'local_students';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        // Assign numeric `num` per filiere if not provided
        let assigned = Object.assign({}, student);
        if (!assigned.num) {
            // compute next num for filiere
            const same = arr.filter(s => (s.filiere || '').toLowerCase() === (assigned.filiere || '').toLowerCase());
            const maxNum = same.reduce((m, x) => Math.max(m, parseInt(x.num || 0) || 0), 0);
            assigned.num = maxNum + 1;
        }
        arr.push(assigned);
        localStorage.setItem(key, JSON.stringify(arr));
        // also add to in-memory etudiants if filiere provided
        if (assigned.filiere) {
            if (!etudiants[assigned.filiere]) etudiants[assigned.filiere] = [];
            etudiants[assigned.filiere].push({ num: assigned.num, nom: assigned.nom.toUpperCase(), prenom: assigned.prenom });
        }
    } catch (e) {
        console.error('Failed to save local student', e);
    }
}

// Synchroniser les donn ees globalement quand elles sont mises  jour
window.addEventListener('donneesUpdated', () => {
    try {
        // mettre  a jour la copie globale et l'exposer aux autres pages
        localStorage.setItem('donnees_global', JSON.stringify(donnees));
        sessionStorage.setItem('donnees', JSON.stringify(donnees));
        window.donnees = donnees;
    } catch (e) {
        console.error('Erreur sync donnees globales', e);
    }
});

// Assurer que la variable globale est initialisée au chargement
window.addEventListener('donneesLoaded', () => {
    try {
        if (!window.donnees) window.donnees = donnees || { absences: {} };
    } catch (e) { /* ignore */ }
});

// Fill navbar user display if present in session
document.addEventListener('DOMContentLoaded', () => {
    try {
        const name = sessionStorage.getItem('current_user_display');
        if (name) {
            const el = document.getElementById('navUser');
            if (el) { el.textContent = `Connecté : ${name}`; el.style.display = 'inline'; }
        }
    } catch (e) { /* ignore */ }
    // populate module select when gestion page is active
    try {
        const filSel = document.getElementById('filiereSelect');
        if (filSel) {
            // populate module label for current selection
            updateModuleLabel(filSel.value);
            filSel.addEventListener('change', ()=> updateModuleLabel(filSel.value));
        }
    } catch (e) { /* ignore */ }
});
