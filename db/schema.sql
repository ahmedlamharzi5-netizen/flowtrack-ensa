-- Schéma de la base de données pour FlowTrack (PostgreSQL)
CREATE TABLE roles (
    id_role SERIAL PRIMARY KEY,
    libelle VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE groupes (
    id_groupe SERIAL PRIMARY KEY,
    nom_groupe VARCHAR(50) NOT NULL,
    niveau VARCHAR(20)
);

CREATE TABLE utilisateurs (
    id_user SERIAL PRIMARY KEY,
    zk_user_id INT UNIQUE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email_academique VARCHAR(150) UNIQUE,
    code VARCHAR(255),
    id_role INT REFERENCES roles(id_role),
    id_groupe INT REFERENCES groupes(id_groupe)
);

CREATE TABLE matieres (
    id_matiere SERIAL PRIMARY KEY,
    nom_matiere VARCHAR(100) NOT NULL,
    semestre VARCHAR(2) CHECK (semestre IN ('S1', 'S2'))
);

-- Table pour assigner les professeurs aux matières et filières
CREATE TABLE professeur_matieres (
    id_pm SERIAL PRIMARY KEY,
    id_professeur INT NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    id_matiere INT NOT NULL REFERENCES matieres(id_matiere) ON DELETE CASCADE,
    id_groupe INT NOT NULL REFERENCES groupes(id_groupe) ON DELETE CASCADE,
    UNIQUE(id_professeur, id_matiere, id_groupe)
);

CREATE TABLE seances (
    id_seance SERIAL PRIMARY KEY,
    id_matiere INT REFERENCES matieres(id_matiere),
    id_professeur INT REFERENCES utilisateurs(id_user),
    id_groupe INT REFERENCES groupes(id_groupe),
    date_debut TIMESTAMP NOT NULL,
    date_fin TIMESTAMP NOT NULL,
    CHECK (date_fin > date_debut)
);

CREATE TABLE logs_pointage (
    id_log SERIAL PRIMARY KEY,
    id_user INT REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    date_heure_pointage TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour enregistrer les absences/présences par élève et semaine
CREATE TABLE attendance (
    id_attendance SERIAL PRIMARY KEY,
    id_user INT NOT NULL REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
    id_groupe INT REFERENCES groupes(id_groupe),
    semaine INT NOT NULL CHECK (semaine >= 1 AND semaine <= 52),
    statut VARCHAR(20) NOT NULL CHECK (statut IN ('present', 'absent', 'null')),
    id_matiere INT REFERENCES matieres(id_matiere),
    id_professeur INT REFERENCES utilisateurs(id_user),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_user, semaine, id_matiere, id_groupe)
);

-- Index pour accélérer les recherches par date
CREATE INDEX idx_logs_timestamp ON logs_pointage(date_heure_pointage);
CREATE INDEX idx_attendance_user ON attendance(id_user);
CREATE INDEX idx_attendance_group ON attendance(id_groupe);
CREATE INDEX idx_attendance_week ON attendance(semaine);
CREATE INDEX idx_attendance_statut ON attendance(statut);
