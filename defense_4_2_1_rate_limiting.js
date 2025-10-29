/*
 * Dateiname: defense_4_2_1_rate_limiting.js
 * Kurzbeschreibung: Verteidigung 4.2.1 - Rate Limiting mit progressiven Delays
 * Funktionalität: Verhindert Brute-Force-Angriffe durch zeitliche Verzögerungen
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001; // Anderer Port für diese Verteidigung

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

// Rate Limiting Konfiguration
const rateLimitConfig = {
    // Basis-Delay in Millisekunden
    baseDelay: 1000, // 1 Sekunde
    
    // Progressiver Multiplikator (Delay erhöht sich mit jedem Versuch)
    progressiveMultiplier: 1.5,
    
    // Maximale Delay-Zeit in Millisekunden
    maxDelay: 30000, // 30 Sekunden
    
    // Reset-Zeit für Versuche (in Millisekunden)
    resetTime: 300000, // 5 Minuten
};

// Speicher für Rate Limiting pro IP
const rateLimitStore = new Map();

// Rate Limiting Middleware
function rateLimitMiddleware(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Hole oder erstelle Rate Limit Eintrag für diese IP
    let rateLimitData = rateLimitStore.get(clientIP);
    
    if (!rateLimitData) {
        rateLimitData = {
            attempts: 0,
            lastAttempt: 0,
            nextAllowedTime: 0
        };
        rateLimitStore.set(clientIP, rateLimitData);
    }
    
    // Prüfe ob Reset-Zeit erreicht wurde
    if (now - rateLimitData.lastAttempt > rateLimitConfig.resetTime) {
        rateLimitData.attempts = 0;
        rateLimitData.nextAllowedTime = 0;
    }
    
    // Prüfe ob noch Delay-Zeit aktiv ist
    if (now < rateLimitData.nextAllowedTime) {
        const remainingTime = Math.ceil((rateLimitData.nextAllowedTime - now) / 1000);
        return res.status(429).json({
            success: false,
            message: `Rate Limit erreicht! Warten Sie ${remainingTime} Sekunden.`,
            type: 'rate_limit',
            remainingTime: remainingTime
        });
    }
    
    // Berechne nächste erlaubte Zeit basierend auf progressivem Delay
    const delay = Math.min(
        rateLimitConfig.baseDelay * Math.pow(rateLimitConfig.progressiveMultiplier, rateLimitData.attempts),
        rateLimitConfig.maxDelay
    );
    
    rateLimitData.nextAllowedTime = now + delay;
    rateLimitData.lastAttempt = now;
    
    // Füge Rate Limit Info zu Request hinzu
    req.rateLimitData = rateLimitData;
    
    next();
}

// Hauptseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login-Endpoint mit Rate Limiting
app.post('/login', rateLimitMiddleware, (req, res) => {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    const rateLimitData = req.rateLimitData;
    
    // Credentials prüfen
    if (testUsers[username] === password) {
        // Erfolgreicher Login - Reset Rate Limit
        rateLimitData.attempts = 0;
        rateLimitData.nextAllowedTime = 0;
        
        return res.json({
            success: true,
            message: 'Erfolgreich angemeldet!',
            type: 'success',
            rateLimitInfo: {
                attempts: rateLimitData.attempts,
                nextDelay: 0
            }
        });
    } else {
        // Fehlgeschlagener Login - Erhöhe Versuche
        rateLimitData.attempts++;
        
        // Berechne nächsten Delay
        const nextDelay = Math.min(
            rateLimitConfig.baseDelay * Math.pow(rateLimitConfig.progressiveMultiplier, rateLimitData.attempts),
            rateLimitConfig.maxDelay
        );
        
        return res.json({
            success: false,
            message: 'Falsche Anmeldedaten!',
            type: 'error',
            rateLimitInfo: {
                attempts: rateLimitData.attempts,
                nextDelay: Math.ceil(nextDelay / 1000), // In Sekunden
                progressiveDelay: true
            }
        });
    }
});

// Rate Limit Status Endpoint
app.get('/rate-limit-status', (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const rateLimitData = rateLimitStore.get(clientIP);
    
    if (!rateLimitData) {
        return res.json({
            attempts: 0,
            nextDelay: 0,
            status: 'clean'
        });
    }
    
    const now = Date.now();
    const remainingTime = Math.max(0, rateLimitData.nextAllowedTime - now);
    
    res.json({
        attempts: rateLimitData.attempts,
        nextDelay: Math.ceil(remainingTime / 1000),
        status: remainingTime > 0 ? 'blocked' : 'allowed',
        config: rateLimitConfig
    });
});

// Cleanup für alte Rate Limit Einträge
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimitStore.entries()) {
        if (now - data.lastAttempt > rateLimitConfig.resetTime * 2) {
            rateLimitStore.delete(ip);
        }
    }
}, 60000); // Jede Minute

// Server starten
app.listen(PORT, () => {
    console.log('=== DEFENSE 4.2.1 - RATE LIMITING ===');
    console.log(`Server läuft auf http://localhost:${PORT}`);
    console.log('\nRate Limiting Konfiguration:');
    console.log(`  Basis-Delay: ${rateLimitConfig.baseDelay}ms`);
    console.log(`  Progressiver Multiplikator: ${rateLimitConfig.progressiveMultiplier}`);
    console.log(`  Maximaler Delay: ${rateLimitConfig.maxDelay}ms`);
    console.log(`  Reset-Zeit: ${rateLimitConfig.resetTime / 1000}s`);
    console.log('\nTest-Benutzer:');
    Object.keys(testUsers).forEach(user => {
        console.log(`  ${user}: ${testUsers[user]}`);
    });
    console.log('\nEndpoints:');
    console.log(`  GET  /                    - Login-Seite`);
    console.log(`  POST /login              - Login mit Rate Limiting`);
    console.log(`  GET  /rate-limit-status   - Rate Limit Status`);
    console.log('\nVerteidigung:');
    console.log('  ✅ Rate Limiting aktiv');
    console.log('  ✅ Progressive Delays');
    console.log('  ✅ IP-basierte Sperrung');
    console.log('  ✅ Automatisches Reset');
});
