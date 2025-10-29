/*
 * Dateiname: defense_4_2_3_captcha.js
 * Kurzbeschreibung: Verteidigung 4.2.3 - CAPTCHA Implementation
 * Funktionalität: Verhindert automatisierte Angriffe durch CAPTCHA-Verifikation
 */

const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3003; // Anderer Port für diese Verteidigung

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Test-Benutzer
const testUsers = {
    'admin': 'admin123',
    'user': 'password',
    'test': 'test123',
    'demo': 'demo456'
};

// CAPTCHA Konfiguration
const captchaConfig = {
    // Anzahl fehlgeschlagener Versuche bevor CAPTCHA aktiviert wird
    attemptsBeforeCaptcha: 3,
    
    // CAPTCHA Komplexität
    captchaLength: 6,
    
    // Verfügbare Zeichen für CAPTCHA
    captchaChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    
    // CAPTCHA Gültigkeitsdauer in Millisekunden
    captchaValidityDuration: 300000, // 5 Minuten
    
    // Reset-Zeit für Versuche (in Millisekunden)
    resetTime: 900000, // 15 Minuten
};

// Speicher für CAPTCHA Daten
const captchaStore = new Map();

// CAPTCHA generieren
function generateCaptcha() {
    let captcha = '';
    for (let i = 0; i < captchaConfig.captchaLength; i++) {
        captcha += captchaConfig.captchaChars.charAt(
            Math.floor(Math.random() * captchaConfig.captchaChars.length)
        );
    }
    return captcha;
}

// CAPTCHA Middleware
function captchaMiddleware(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const { username, captcha } = req.body;
    
    // Hole oder erstelle CAPTCHA Eintrag für diese IP
    let captchaData = captchaStore.get(clientIP);
    
    if (!captchaData) {
        captchaData = {
            attempts: 0,
            lastAttempt: 0,
            captchaRequired: false,
            currentCaptcha: '',
            captchaGeneratedAt: 0,
            captchaSolved: false
        };
        captchaStore.set(clientIP, captchaData);
    }
    
    const now = Date.now();
    
    // Prüfe ob Reset-Zeit erreicht wurde
    if (now - captchaData.lastAttempt > captchaConfig.resetTime) {
        captchaData.attempts = 0;
        captchaData.captchaRequired = false;
        captchaData.captchaSolved = false;
    }
    
    // Prüfe ob CAPTCHA erforderlich ist
    if (captchaData.attempts >= captchaConfig.attemptsBeforeCaptcha) {
        captchaData.captchaRequired = true;
        
        // Generiere neues CAPTCHA wenn keins vorhanden oder abgelaufen
        if (!captchaData.currentCaptcha || 
            now - captchaData.captchaGeneratedAt > captchaConfig.captchaValidityDuration) {
            captchaData.currentCaptcha = generateCaptcha();
            captchaData.captchaGeneratedAt = now;
            captchaData.captchaSolved = false;
        }
        
        // Prüfe CAPTCHA wenn eines gesendet wurde
        if (captcha) {
            if (captcha.toUpperCase() === captchaData.currentCaptcha) {
                captchaData.captchaSolved = true;
                captchaData.currentCaptcha = ''; // Lösche gelöstes CAPTCHA
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'CAPTCHA falsch!',
                    type: 'captcha_error',
                    captchaRequired: true,
                    newCaptcha: captchaData.currentCaptcha,
                    attempts: captchaData.attempts
                });
            }
        } else {
            // CAPTCHA erforderlich aber nicht gesendet
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA erforderlich!',
                type: 'captcha_required',
                captchaRequired: true,
                captcha: captchaData.currentCaptcha,
                attempts: captchaData.attempts
            });
        }
    }
    
    // Füge CAPTCHA Info zu Request hinzu
    req.captchaData = captchaData;
    
    next();
}

// Hauptseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// CAPTCHA generieren Endpoint
app.get('/generate-captcha', (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const captchaData = captchaStore.get(clientIP);
    
    if (!captchaData || !captchaData.captchaRequired) {
        return res.status(400).json({
            success: false,
            message: 'CAPTCHA nicht erforderlich'
        });
    }
    
    const now = Date.now();
    
    // Generiere neues CAPTCHA
    captchaData.currentCaptcha = generateCaptcha();
    captchaData.captchaGeneratedAt = now;
    captchaData.captchaSolved = false;
    
    res.json({
        success: true,
        captcha: captchaData.currentCaptcha,
        generatedAt: now,
        validityDuration: captchaConfig.captchaValidityDuration
    });
});

// Login-Endpoint mit CAPTCHA
app.post('/login', captchaMiddleware, (req, res) => {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const captchaData = req.captchaData;
    const now = Date.now();
    
    // Credentials prüfen
    if (testUsers[username] === password) {
        // Erfolgreicher Login - Reset CAPTCHA Daten
        captchaData.attempts = 0;
        captchaData.captchaRequired = false;
        captchaData.captchaSolved = false;
        captchaData.currentCaptcha = '';
        
        return res.json({
            success: true,
            message: 'Erfolgreich angemeldet!',
            type: 'success',
            captchaInfo: {
                attempts: 0,
                captchaRequired: false,
                status: 'clean'
            }
        });
    } else {
        // Fehlgeschlagener Login - Erhöhe Versuche
        captchaData.attempts++;
        captchaData.lastAttempt = now;
        
        // Generiere neues CAPTCHA wenn erforderlich
        if (captchaData.attempts >= captchaConfig.attemptsBeforeCaptcha) {
            captchaData.captchaRequired = true;
            captchaData.currentCaptcha = generateCaptcha();
            captchaData.captchaGeneratedAt = now;
            captchaData.captchaSolved = false;
        }
        
        return res.json({
            success: false,
            message: 'Falsche Anmeldedaten!',
            type: 'error',
            captchaInfo: {
                attempts: captchaData.attempts,
                captchaRequired: captchaData.captchaRequired,
                captcha: captchaData.captchaRequired ? captchaData.currentCaptcha : null,
                remainingAttempts: captchaConfig.attemptsBeforeCaptcha - captchaData.attempts,
                status: captchaData.captchaRequired ? 'captcha_required' : 'warning'
            }
        });
    }
});

// CAPTCHA Status Endpoint
app.get('/captcha-status', (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const captchaData = captchaStore.get(clientIP);
    
    if (!captchaData) {
        return res.json({
            attempts: 0,
            captchaRequired: false,
            status: 'clean',
            config: captchaConfig
        });
    }
    
    const now = Date.now();
    const captchaExpired = captchaData.captchaGeneratedAt > 0 && 
                          now - captchaData.captchaGeneratedAt > captchaConfig.captchaValidityDuration;
    
    res.json({
        attempts: captchaData.attempts,
        captchaRequired: captchaData.captchaRequired,
        captchaExpired: captchaExpired,
        captchaSolved: captchaData.captchaSolved,
        status: captchaData.captchaRequired ? 'captcha_required' : 'clean',
        config: captchaConfig
    });
});

// CAPTCHA validieren (separater Endpoint)
app.post('/validate-captcha', (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const { captcha } = req.body;
    const captchaData = captchaStore.get(clientIP);
    
    if (!captchaData || !captchaData.captchaRequired) {
        return res.status(400).json({
            success: false,
            message: 'CAPTCHA nicht erforderlich'
        });
    }
    
    const now = Date.now();
    
    // Prüfe ob CAPTCHA abgelaufen ist
    if (now - captchaData.captchaGeneratedAt > captchaConfig.captchaValidityDuration) {
        return res.status(400).json({
            success: false,
            message: 'CAPTCHA abgelaufen',
            type: 'captcha_expired'
        });
    }
    
    // Prüfe CAPTCHA
    if (captcha && captcha.toUpperCase() === captchaData.currentCaptcha) {
        captchaData.captchaSolved = true;
        captchaData.currentCaptcha = '';
        
        res.json({
            success: true,
            message: 'CAPTCHA korrekt',
            captchaSolved: true
        });
    } else {
        // Generiere neues CAPTCHA bei falscher Eingabe
        captchaData.currentCaptcha = generateCaptcha();
        captchaData.captchaGeneratedAt = now;
        
        res.json({
            success: false,
            message: 'CAPTCHA falsch',
            newCaptcha: captchaData.currentCaptcha,
            type: 'captcha_error'
        });
    }
});

// Alle CAPTCHA Sessions
app.get('/all-captcha-sessions', (req, res) => {
    const now = Date.now();
    const sessions = [];
    
    for (const [ip, captchaData] of captchaStore.entries()) {
        const captchaExpired = captchaData.captchaGeneratedAt > 0 && 
                              now - captchaData.captchaGeneratedAt > captchaConfig.captchaValidityDuration;
        
        sessions.push({
            ip: ip,
            attempts: captchaData.attempts,
            captchaRequired: captchaData.captchaRequired,
            captchaExpired: captchaExpired,
            captchaSolved: captchaData.captchaSolved,
            status: captchaData.captchaRequired ? 'captcha_required' : 'clean'
        });
    }
    
    res.json({
        totalSessions: sessions.length,
        captchaRequiredSessions: sessions.filter(s => s.captchaRequired).length,
        sessions: sessions
    });
});

// Cleanup für alte CAPTCHA Sessions
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of captchaStore.entries()) {
        // Lösche Sessions die länger als 1 Stunde nicht verwendet wurden
        if (now - data.lastAttempt > 3600000) {
            captchaStore.delete(ip);
        }
    }
}, 300000); // Alle 5 Minuten

// Server starten
app.listen(PORT, () => {
    console.log('=== DEFENSE 4.2.3 - CAPTCHA ===');
    console.log(`Server läuft auf http://localhost:${PORT}`);
    console.log('\nCAPTCHA Konfiguration:');
    console.log(`  Versuche vor CAPTCHA: ${captchaConfig.attemptsBeforeCaptcha}`);
    console.log(`  CAPTCHA Länge: ${captchaConfig.captchaLength} Zeichen`);
    console.log(`  Verfügbare Zeichen: ${captchaConfig.captchaChars}`);
    console.log(`  Gültigkeitsdauer: ${captchaConfig.captchaValidityDuration / 1000}s`);
    console.log(`  Reset-Zeit: ${captchaConfig.resetTime / 1000}s`);
    console.log('\nTest-Benutzer:');
    Object.keys(testUsers).forEach(user => {
        console.log(`  ${user}: ${testUsers[user]}`);
    });
    console.log('\nEndpoints:');
    console.log(`  GET  /                    - Login-Seite`);
    console.log(`  POST /login              - Login mit CAPTCHA`);
    console.log(`  GET  /generate-captcha    - CAPTCHA generieren`);
    console.log(`  POST /validate-captcha    - CAPTCHA validieren`);
    console.log(`  GET  /captcha-status      - CAPTCHA Status`);
    console.log(`  GET  /all-captcha-sessions - Alle CAPTCHA Sessions`);
    console.log('\nVerteidigung:');
    console.log('  ✅ CAPTCHA aktiv');
    console.log('  ✅ Automatische Aktivierung');
    console.log('  ✅ IP-basierte Sessions');
    console.log('  ✅ Zeitbasierte Ablauf');
    console.log('  ✅ Automatisches Reset');
});
