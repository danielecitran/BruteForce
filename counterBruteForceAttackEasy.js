/*
 * Filename: counterBruteForceAttackEasy.js
 * Kurzbeschreibung: Rate-Limiting mit linear ansteigender Wartezeit pro Fehlversuch.
 * Aufrufparameter: keine (über server.js als Middleware genutzt; Modus /easy oder /all).
 * Autor: Student
 * Datum: 2025-10-29
 */

// Konfiguration
const rateLimitConfig = {
    baseDelayMs: 1500,       // Basis 1.5s
    resetTime: 300000        // 5min ohne Versuche -> Reset
};

// In-Memory-Store pro IP
const rateLimitStore = new Map();

// Middleware: blockiert Anfragen während der Wartezeit
/** Middleware blockiert Anfragen während der aktuellen Wartezeit. */
function rateLimitMiddleware(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    let rateLimitData = rateLimitStore.get(clientIP);
    
    if (!rateLimitData) {
        rateLimitData = {
            failedAttempts: 0,
            lastAttempt: 0,
            nextAllowedTime: 0
        };
        rateLimitStore.set(clientIP, rateLimitData);
    }
    
    if (now - rateLimitData.lastAttempt > rateLimitConfig.resetTime) {
        rateLimitData.failedAttempts = 0;
        rateLimitData.nextAllowedTime = 0;
    }
    
    if (now < rateLimitData.nextAllowedTime) {
        const remainingTime = Math.ceil((rateLimitData.nextAllowedTime - now) / 1000);
        return res.status(429).json({
            success: false,
            message: `Rate Limit erreicht! Warten Sie ${remainingTime} Sekunden.`,
            type: 'rate_limit',
            remainingTime: remainingTime
        });
    }
    
    req.rateLimitData = rateLimitData;
    next();
}

// Reset nach erfolgreichem Login
/** Setzt das Rate-Limit nach erfolgreichem Login zurück. */
function rateLimitOnSuccessfulLogin(req) {
    const clientIP = req.ip || req.connection.remoteAddress;
    let d = rateLimitStore.get(clientIP);
    if (!d) return;
    d.failedAttempts = 0;
    d.nextAllowedTime = 0;
    d.lastAttempt = Date.now();
}

// Erhöht Wartezeit nach fehlgeschlagenem Login
/** Erhöht die Wartezeit linear nach fehlgeschlagenem Login. */
function rateLimitOnFailedLogin(req) {
    const clientIP = req.ip || req.connection.remoteAddress;
    let d = rateLimitStore.get(clientIP);
    const now = Date.now();
    if (!d) {
        d = { failedAttempts: 0, lastAttempt: 0, nextAllowedTime: 0 };
        rateLimitStore.set(clientIP, d);
    }
    d.failedAttempts += 1;
    d.lastAttempt = now;
    const delayMs = rateLimitConfig.baseDelayMs * d.failedAttempts; // linearer Backoff
    d.nextAllowedTime = now + delayMs;
    return { delayMs };
}

module.exports = {
    rateLimitMiddleware,
    rateLimitOnSuccessfulLogin,
    rateLimitOnFailedLogin,
    rateLimitConfig
};


