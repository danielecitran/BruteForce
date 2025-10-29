const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Vereinfachter Server - nur für Angriffe, keine Verteidigungen

// Test-Benutzer
const testUsers = {
    'dictionary': 'admin123',
    'mono': 'a*4',
    'poly': 'ĞIİ',
    'rainbow': 'admin',        // Für Rainbow-Tables (Hash-Plain-Tabelle)
    'parallel': 'ab',
    'admin': 'a*4',           
};

// Vereinfachte Konfiguration - keine Verteidigungen

// Kein Logging - nur für Angriffe

// Hauptseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login-Endpoint - ohne Delay und Logging
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Credentials prüfen
    if (testUsers[username] === password) {
        return res.json({
            success: true,
            message: 'Erfolgreich angemeldet!',
            type: 'success'
        });
    } else {
        return res.json({
            success: false,
            message: 'Falsche Anmeldedaten!',
            type: 'error'
        });
    }
});

// Vereinfacht - Captcha-Endpoint entfernt

// Vereinfachter Server - nur Login-Endpoint für Angriffe

// Server starten
app.listen(PORT, () => {
    console.log('=== BRUTE FORCE TEST SERVER ===');
    console.log(`Server läuft auf http://localhost:${PORT}`);
    console.log('\nTest-Benutzer:');
    Object.keys(testUsers).forEach(user => {
        console.log(`  ${user}: ${testUsers[user]}`);
    });
    console.log('\nServer-Status:');
    console.log('  Keine Verteidigungen aktiv');
    console.log('  Bereit für Brute-Force-Angriffe');
    console.log('  Kein Delay - maximale Geschwindigkeit');
    console.log('\nEndpoints:');
    console.log(`  GET  /          - Login-Seite`);
    console.log(`  POST /login     - Login-Endpoint`);
});
