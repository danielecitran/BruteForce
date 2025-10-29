/*
 * Filename: counterBruteForceAttackMedium.js
 * Kurzbeschreibung: CAPTCHA-Anforderung und Account-Lockout basierend auf Fehlversuchen.
 * Aufrufparameter: keine (über server.js als Middleware genutzt; Modus /medium oder /all).
 * Autor: Theodor Schneider, Oliver Piechocki, Daniele Zitran
 * Datum: 2025-10-29
 */

// Konfiguration
const cfg = {
    captchaAttemptsBeforeRequired: 3,
    captchaLength: 6,
    captchaChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    captchaValidityMs: 300000, // 5min
    resetWindowMs: 900000, // 15min
    maxFailedAttemptsBeforeLock: 5,
    lockoutMs: 300000 // 5min
};

// In-Memory-Store pro IP und Benutzer
const store = new Map(); // key: `${ip}_${username}`

function keyFor(ip, username) {
    return `${ip}_${username}`;
}

function genCaptcha() {
    let s = '';
    for (let i = 0; i < cfg.captchaLength; i++) {
        s += cfg.captchaChars[Math.floor(Math.random() * cfg.captchaChars.length)];
    }
    return s;
}

/** Prüft Lockout und CAPTCHA-Anforderung vor dem Login. */
function combinedMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const { username, captcha } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: 'Benutzername erforderlich', type: 'error' });
    }

    const k = keyFor(ip, username);
    let d = store.get(k);
    if (!d) {
        d = {
            // captcha
            capAttempts: 0,
            capRequired: false,
            capValue: '',
            capGeneratedAt: 0,
            // lockout
            failedAttempts: 0,
            lockoutUntil: 0,
            permanentlyLocked: false,
            // misc
            lastAttemptAt: 0
        };
        store.set(k, d);
    }

    const now = Date.now();

    // Zurücksetzen nach Inaktivität
    if (now - d.lastAttemptAt > cfg.resetWindowMs) {
        d.failedAttempts = 0;
        d.capAttempts = 0;
        d.capRequired = false;
        d.capValue = '';
    }

    // Sperrprüfung
    if (d.permanentlyLocked) {
        return res.status(423).json({ success: false, message: 'Account dauerhaft gesperrt! Zu viele fehlgeschlagene Versuche.', type: 'account_permanently_locked' });
    }
    if (now < d.lockoutUntil) {
        const remaining = Math.max(0, Math.ceil((d.lockoutUntil - now) / 1000));
        return res.status(423).json({ success: false, message: `Account gesperrt! Warten Sie ${remaining} Sekunden.`, type: 'account_locked' });
    }

    // CAPTCHA-Anforderung
    if (d.capAttempts >= cfg.captchaAttemptsBeforeRequired) {
        d.capRequired = true;
        if (!d.capValue || now - d.capGeneratedAt > cfg.captchaValidityMs) {
            d.capValue = genCaptcha();
            d.capGeneratedAt = now;
        }
        if (!captcha) {
            return res.status(400).json({ success: false, message: 'CAPTCHA erforderlich!', type: 'captcha_required', captcha: d.capValue });
        }
        if (String(captcha).toUpperCase() !== d.capValue) {
            d.capValue = genCaptcha();
            d.capGeneratedAt = now;
            return res.status(400).json({ success: false, message: 'CAPTCHA falsch!', type: 'captcha_error', newCaptcha: d.capValue });
        }
        // korrektes Captcha -> freigeben für Handler
        d.capValue = '';
        d.capRequired = false;
        d.capAttempts = 0;
    }

    req.defenseData = d;
    req.clientKey = k;
    next();
}

/** Erzeugt ein neues CAPTCHA für eine IP/Benutzer-Kombination. */
function generateCaptchaHandler(req, res) {
    const ip = req.ip || req.connection.remoteAddress;
    const username = req.query.username;
    if (!username) return res.status(400).json({ success: false, message: 'Benutzername erforderlich' });
    const k = keyFor(ip, username);
    const d = store.get(k);
    if (!d || !d.capRequired) return res.status(400).json({ success: false, message: 'CAPTCHA nicht erforderlich' });
    d.capValue = genCaptcha();
    d.capGeneratedAt = Date.now();
    return res.json({ success: true, captcha: d.capValue });
}

/** Liefert den aktuellen Status von CAPTCHA- und Lockout-Anforderungen. */
function defenseStatusHandler(req, res) {
    const ip = req.ip || req.connection.remoteAddress;
    const username = req.query.username;
    if (!username) return res.status(400).json({ success: false, message: 'Benutzername erforderlich' });
    const k = keyFor(ip, username);
    const d = store.get(k);
    if (!d) {
        return res.json({ captcha: { required: false }, lockout: { status: 'unlocked', remainingTime: 0 } });
    }
    const now = Date.now();
    const locked = d.permanentlyLocked || now < d.lockoutUntil;
    return res.json({
        captcha: { required: d.capRequired },
        lockout: { status: d.permanentlyLocked ? 'permanently_locked' : (locked ? 'locked' : 'unlocked'), remainingTime: d.permanentlyLocked ? null : (locked ? Math.ceil((d.lockoutUntil - now) / 1000) : 0) }
    });
}

// Hilfsfunktionen für Login-Erfolg/Fehlschlag
/** Setzt Zähler nach erfolgreichem Login zurück. */
function onSuccessfulLogin(req) {
    const d = req.defenseData;
    if (!d) return;
    d.failedAttempts = 0;
    d.capAttempts = 0;
    d.capRequired = false;
    d.capValue = '';
    d.lastAttemptAt = Date.now();
}

/** Erhöht Fehlversuche und fordert ggf. CAPTCHA an oder sperrt den Account. */
function onFailedLogin(req) {
    const d = req.defenseData;
    if (!d) return null;
    const now = Date.now();
    d.failedAttempts += 1;
    d.capAttempts += 1;
    d.lastAttemptAt = now;

    if (d.failedAttempts >= cfg.maxFailedAttemptsBeforeLock) {
        d.permanentlyLocked = true;
        d.lockoutUntil = Number.POSITIVE_INFINITY;
        return { code: 423, payload: { success: false, message: 'Account dauerhaft gesperrt! Zu viele fehlgeschlagene Versuche.', type: 'account_permanently_locked' } };
    }

    if (d.capAttempts >= cfg.captchaAttemptsBeforeRequired) {
        d.capRequired = true;
        d.capValue = genCaptcha();
        d.capGeneratedAt = now;
        return { code: 200, payload: { success: false, message: 'Falsche Anmeldedaten!', type: 'error', captcha: d.capValue } };
    }

    return { code: 200, payload: { success: false, message: 'Falsche Anmeldedaten!', type: 'error' } };
}

module.exports = {
    combinedMiddleware,
    generateCaptchaHandler,
    defenseStatusHandler,
    onSuccessfulLogin,
    onFailedLogin
};


