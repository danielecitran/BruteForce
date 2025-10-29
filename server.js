/*
 * Filename: server.js
 * Kurzbeschreibung: Express-Server mit umschaltbaren Verteidigungsmodi (ungeschützt, easy, medium, hard, all).
 * Aufrufparameter: keine (Start: npm start). Nutzung über Routen /, /easy, /medium, /hard, /all.
 * Autor: Student
 * Datum: 2025-10-29
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');

// Defense-Module
const { rateLimitMiddleware, rateLimitOnSuccessfulLogin, rateLimitOnFailedLogin } = require('./counterBruteForceAttackEasy');
const combined = require('./counterBruteForceAttackMedium');
const { loggingMiddleware, logEvent } = require('./counterBruteForceAttackHard');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Test-Benutzer
const testUsers = {
    'dictionary': 'admin123',
    'mono': 'a*4',
    'poly': 'ĞIİ',
    'rainbow': 'admin',        
    'parallel': 'ab',
    'admin': 'a*4',           
};

// Hilfsfunktionen
function setMode(res, mode) {
    // Cookie für Modus setzen (Pfad /, Session-Cookie)
    res.cookie('mode', mode, { httpOnly: false, sameSite: 'lax' });
}

function getMode(req) {
    const mode = req.cookies?.mode || 'none';
    return mode;
}

function includesLogging(mode) {
    return mode === 'hard' || mode === 'all';
}

function includesCombined(mode) {
    return mode === 'medium' || mode === 'all';
}

async function runMiddlewaresSequentially(middlewares, req, res) {
    for (const mw of middlewares) {
        let finished = false;
        await new Promise((resolve) => {
            mw(req, res, () => {
                finished = true;
                resolve();
            });
        });
        if (res.headersSent || !finished) {
            return false; // Response already sent or middleware ended request
        }
    }
    return true;
}

function getDefenseChain(mode) {
    switch (mode) {
        case 'easy':
            return [rateLimitMiddleware];
        case 'medium':
            return [combined.combinedMiddleware];
        case 'hard':
            return [loggingMiddleware];
        case 'all':
            return [loggingMiddleware, rateLimitMiddleware, combined.combinedMiddleware];
        default:
            return [];
    }
}

// Routen für Modusauswahl
app.get('/', (req, res) => {
    setMode(res, 'none');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/easy', (req, res) => {
    setMode(res, 'easy');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/medium', (req, res) => {
    setMode(res, 'medium');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/hard', (req, res) => {
    setMode(res, 'hard');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/all', (req, res) => {
    setMode(res, 'all');
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login-Endpoint: Verhalten abhängig vom Modus (Cookie)
app.post('/login', async (req, res) => {
    const mode = getMode(req);
    const chain = getDefenseChain(mode);

    // Logging: Beginn des Versuchs (wird schon in loggingMiddleware gemacht, aber für Modi ohne loggingMiddleware optional)
    if (!includesLogging(mode)) {
        // nichts tun
    }

    const proceed = await runMiddlewaresSequentially(chain, req, res);
    if (!proceed) return; // Middleware hat bereits geantwortet

    const { username, password } = req.body;
    const success = testUsers[username] === password;

    if (success) {
        if (includesCombined(mode)) {
            combined.onSuccessfulLogin(req);
        }
        if (mode === 'easy' || mode === 'all') {
            rateLimitOnSuccessfulLogin(req);
        }
        if (includesLogging(mode)) {
            const { clientIP, userAgent, startTime } = req.loggingData || { clientIP: req.ip || req.connection.remoteAddress, userAgent: req.get('User-Agent') || 'Unknown', startTime: Date.now() };
            logEvent('INFO', 'Erfolgreicher Login', { ip: clientIP, username, userAgent, responseTime: Date.now() - startTime });
        }
        return res.json({ success: true, message: 'Erfolgreich angemeldet!', type: 'success' });
    }

    // Fehlversuch
    let handled = null;
    if (includesCombined(mode)) {
        handled = combined.onFailedLogin(req);
    }
    if (mode === 'easy' || mode === 'all') {
        rateLimitOnFailedLogin(req);
    }
    if (includesLogging(mode)) {
        const { clientIP, userAgent, startTime } = req.loggingData || { clientIP: req.ip || req.connection.remoteAddress, userAgent: req.get('User-Agent') || 'Unknown', startTime: Date.now() };
        logEvent('WARNING', 'Fehlgeschlagener Login', { ip: clientIP, username, userAgent, responseTime: Date.now() - startTime });
    }
    if (handled) {
        return res.status(handled.code).json(handled.payload);
    }
    return res.json({ success: false, message: 'Falsche Anmeldedaten!', type: 'error' });
});

// Keine weiteren Endpunkte definiert

// Server starten
app.listen(PORT, () => {
    console.log('=== BRUTE FORCE TEST SERVER ===');
    console.log(`Server läuft auf http://localhost:${PORT}`);
    console.log('\nTest-Benutzer:');
    Object.keys(testUsers).forEach(user => {
        console.log(`  ${user}: ${testUsers[user]}`);
    });
    console.log('\nEndpoints:');
    console.log('  GET  /        - ungeschützt');
    console.log('  GET  /easy    - 4.2.1 Rate Limiting');
    console.log('  GET  /medium  - 4.2.2 CAPTCHA + Lockout');
    console.log('  GET  /hard    - 4.2.4 Logging');
    console.log('  GET  /all     - alle Verteidigungen');
    console.log('  POST /login   - Login (modusabhängig)');
    console.log('\nHinweis: Modus durch Aufruf von /, /easy, /medium, /hard oder /all setzen.');
});
