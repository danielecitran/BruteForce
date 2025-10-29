/*
 * Dateiname: defense_4_2_4_logging_monitoring.js
 * Kurzbeschreibung: Verteidigung 4.2.4 - Logging und Monitoring System
 * Funktionalität: Überwacht und protokolliert alle Login-Versuche und verdächtige Aktivitäten
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3004; // Anderer Port für diese Verteidigung

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

// Logging Konfiguration
const loggingConfig = {
    // Log-Datei Pfad
    logFilePath: path.join(__dirname, 'logs', 'security.log'),
    
    // Log-Level
    logLevels: {
        INFO: 1,
        WARNING: 2,
        ERROR: 3,
        CRITICAL: 4
    },
    
    // Verdächtige Aktivitäten Schwellenwerte
    suspiciousThresholds: {
        // Anzahl fehlgeschlagener Versuche pro IP in 5 Minuten
        failedAttemptsPerIP: 10,
        
        // Anzahl verschiedener Benutzernamen pro IP in 5 Minuten
        differentUsernamesPerIP: 5,
        
        // Anzahl verschiedener IPs pro Benutzername in 5 Minuten
        differentIPsPerUsername: 3,
        
        // Zeitfenster für Schwellenwerte in Millisekunden
        timeWindow: 300000, // 5 Minuten
    },
    
    // Automatische Benachrichtigungen
    notifications: {
        enabled: true,
        // Email-Benachrichtigungen (simuliert)
        emailAlerts: true,
        // Console-Benachrichtigungen
        consoleAlerts: true,
        // Log-Datei Benachrichtigungen
        fileAlerts: true
    },
    
    // Log-Rotation
    logRotation: {
        enabled: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
    }
};

// Logging Speicher
const loggingStore = new Map();
const suspiciousActivities = new Map();

// Log-Verzeichnis erstellen
const logDir = path.dirname(loggingConfig.logFilePath);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Log-Funktion
function logEvent(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data,
        id: crypto.randomUUID()
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Console Log
    if (loggingConfig.notifications.consoleAlerts) {
        console.log(`[${timestamp}] ${level}: ${message}`, data);
    }
    
    // File Log
    if (loggingConfig.notifications.fileAlerts) {
        fs.appendFileSync(loggingConfig.logFilePath, logLine);
    }
    
    // Email Alert (simuliert)
    if (loggingConfig.notifications.emailAlerts && level >= loggingConfig.logLevels.CRITICAL) {
        console.log(`📧 EMAIL ALERT: ${message}`);
    }
    
    return logEntry;
}

// Verdächtige Aktivität erkennen
function detectSuspiciousActivity(clientIP, username, success) {
    const now = Date.now();
    
    // Hole oder erstelle Logging Eintrag für diese IP
    let ipData = loggingStore.get(clientIP);
    if (!ipData) {
        ipData = {
            attempts: [],
            usernames: new Set(),
            lastActivity: 0
        };
        loggingStore.set(clientIP, ipData);
    }
    
    // Aktualisiere IP-Daten
    ipData.attempts.push({
        timestamp: now,
        username,
        success,
        userAgent: 'Unknown' // In echter Anwendung aus Request Header
    });
    ipData.usernames.add(username);
    ipData.lastActivity = now;
    
    // Bereinige alte Einträge
    const cutoffTime = now - loggingConfig.suspiciousThresholds.timeWindow;
    ipData.attempts = ipData.attempts.filter(attempt => attempt.timestamp > cutoffTime);
    
    // Prüfe Schwellenwerte
    const recentFailedAttempts = ipData.attempts.filter(a => !a.success).length;
    const differentUsernames = ipData.usernames.size;
    
    let suspicious = false;
    let suspiciousReasons = [];
    
    if (recentFailedAttempts >= loggingConfig.suspiciousThresholds.failedAttemptsPerIP) {
        suspicious = true;
        suspiciousReasons.push(`Zu viele fehlgeschlagene Versuche: ${recentFailedAttempts}`);
    }
    
    if (differentUsernames >= loggingConfig.suspiciousThresholds.differentUsernamesPerIP) {
        suspicious = true;
        suspiciousReasons.push(`Zu viele verschiedene Benutzernamen: ${differentUsernames}`);
    }
    
    // Prüfe Benutzername-spezifische Aktivität
    let usernameData = loggingStore.get(`username:${username}`);
    if (!usernameData) {
        usernameData = {
            attempts: [],
            ips: new Set(),
            lastActivity: 0
        };
        loggingStore.set(`username:${username}`, usernameData);
    }
    
    usernameData.attempts.push({
        timestamp: now,
        ip: clientIP,
        success
    });
    usernameData.ips.add(clientIP);
    usernameData.lastActivity = now;
    
    // Bereinige alte Einträge
    usernameData.attempts = usernameData.attempts.filter(attempt => attempt.timestamp > cutoffTime);
    
    const differentIPs = usernameData.ips.size;
    if (differentIPs >= loggingConfig.suspiciousThresholds.differentIPsPerUsername) {
        suspicious = true;
        suspiciousReasons.push(`Zu viele verschiedene IPs für Benutzername: ${differentIPs}`);
    }
    
    // Log verdächtige Aktivität
    if (suspicious) {
        const suspiciousActivity = {
            id: crypto.randomUUID(),
            timestamp: now,
            ip: clientIP,
            username,
            reasons: suspiciousReasons,
            severity: 'HIGH',
            data: {
                recentFailedAttempts,
                differentUsernames,
                differentIPs,
                recentAttempts: ipData.attempts.slice(-10) // Letzte 10 Versuche
            }
        };
        
        suspiciousActivities.set(suspiciousActivity.id, suspiciousActivity);
        
        logEvent('CRITICAL', 'Verdächtige Aktivität erkannt', suspiciousActivity);
        
        return suspiciousActivity;
    }
    
    return null;
}

// Logging Middleware
function loggingMiddleware(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const { username } = req.body;
    
    // Log Request
    logEvent('INFO', 'Login-Versuch', {
        ip: clientIP,
        username,
        userAgent,
        timestamp: new Date().toISOString()
    });
    
    req.loggingData = {
        clientIP,
        userAgent,
        username,
        startTime: Date.now()
    };
    
    next();
}

// Hauptseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login-Endpoint mit Logging
app.post('/login', loggingMiddleware, (req, res) => {
    const { username, password } = req.body;
    const { clientIP, userAgent, startTime } = req.loggingData;
    const now = Date.now();
    
    // Credentials prüfen
    const success = testUsers[username] === password;
    
    // Verdächtige Aktivität erkennen
    const suspiciousActivity = detectSuspiciousActivity(clientIP, username, success);
    
    if (success) {
        // Erfolgreicher Login
        logEvent('INFO', 'Erfolgreicher Login', {
            ip: clientIP,
            username,
            userAgent,
            responseTime: now - startTime
        });
        
        res.json({
            success: true,
            message: 'Erfolgreich angemeldet!',
            type: 'success',
            loggingInfo: {
                logged: true,
                suspiciousActivity: suspiciousActivity ? true : false
            }
        });
    } else {
        // Fehlgeschlagener Login
        logEvent('WARNING', 'Fehlgeschlagener Login', {
            ip: clientIP,
            username,
            userAgent,
            responseTime: now - startTime,
            suspiciousActivity: suspiciousActivity ? true : false
        });
        
        res.json({
            success: false,
            message: 'Falsche Anmeldedaten!',
            type: 'error',
            loggingInfo: {
                logged: true,
                suspiciousActivity: suspiciousActivity ? true : false,
                suspiciousReasons: suspiciousActivity ? suspiciousActivity.reasons : null
            }
        });
    }
});

// Security Dashboard
app.get('/security-dashboard', (req, res) => {
    const now = Date.now();
    const cutoffTime = now - loggingConfig.suspiciousThresholds.timeWindow;
    
    // Statistiken sammeln
    const stats = {
        totalIPs: loggingStore.size,
        suspiciousActivities: suspiciousActivities.size,
        recentSuspiciousActivities: Array.from(suspiciousActivities.values())
            .filter(activity => activity.timestamp > cutoffTime),
        topFailedIPs: [],
        topTargetUsernames: [],
        config: loggingConfig
    };
    
    // Top fehlgeschlagene IPs
    const ipStats = new Map();
    for (const [key, data] of loggingStore.entries()) {
        if (!key.startsWith('username:')) {
            const recentFailed = data.attempts.filter(a => !a.success && a.timestamp > cutoffTime).length;
            if (recentFailed > 0) {
                ipStats.set(key, {
                    ip: key,
                    failedAttempts: recentFailed,
                    differentUsernames: data.usernames.size,
                    lastActivity: data.lastActivity
                });
            }
        }
    }
    
    stats.topFailedIPs = Array.from(ipStats.values())
        .sort((a, b) => b.failedAttempts - a.failedAttempts)
        .slice(0, 10);
    
    // Top angegriffene Benutzernamen
    const usernameStats = new Map();
    for (const [key, data] of loggingStore.entries()) {
        if (key.startsWith('username:')) {
            const username = key.replace('username:', '');
            const recentFailed = data.attempts.filter(a => !a.success && a.timestamp > cutoffTime).length;
            if (recentFailed > 0) {
                usernameStats.set(username, {
                    username,
                    failedAttempts: recentFailed,
                    differentIPs: data.ips.size,
                    lastActivity: data.lastActivity
                });
            }
        }
    }
    
    stats.topTargetUsernames = Array.from(usernameStats.values())
        .sort((a, b) => b.failedAttempts - a.failedAttempts)
        .slice(0, 10);
    
    res.json(stats);
});

// Verdächtige Aktivitäten
app.get('/suspicious-activities', (req, res) => {
    const activities = Array.from(suspiciousActivities.values())
        .sort((a, b) => b.timestamp - a.timestamp);
    
    res.json({
        total: activities.length,
        activities: activities
    });
});

// Log-Datei lesen
app.get('/logs', (req, res) => {
    try {
        const logs = fs.readFileSync(loggingConfig.logFilePath, 'utf8');
        const logLines = logs.trim().split('\n').map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return { raw: line };
            }
        });
        
        res.json({
            totalLines: logLines.length,
            logs: logLines.slice(-100) // Letzte 100 Einträge
        });
    } catch (error) {
        res.status(500).json({
            error: 'Log-Datei konnte nicht gelesen werden',
            message: error.message
        });
    }
});

// Log-Datei löschen
app.delete('/logs', (req, res) => {
    try {
        if (fs.existsSync(loggingConfig.logFilePath)) {
            fs.unlinkSync(loggingConfig.logFilePath);
        }
        loggingStore.clear();
        suspiciousActivities.clear();
        
        logEvent('INFO', 'Log-Datei und Speicher geleert', {
            clearedBy: req.ip || req.connection.remoteAddress
        });
        
        res.json({
            success: true,
            message: 'Log-Datei und Speicher erfolgreich geleert'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Log-Datei konnte nicht gelöscht werden',
            message: error.message
        });
    }
});

// Cleanup für alte Daten
setInterval(() => {
    const now = Date.now();
    const cutoffTime = now - (loggingConfig.suspiciousThresholds.timeWindow * 2);
    
    // Bereinige alte Logging-Daten
    for (const [key, data] of loggingStore.entries()) {
        if (data.lastActivity < cutoffTime) {
            loggingStore.delete(key);
        }
    }
    
    // Bereinige alte verdächtige Aktivitäten
    for (const [id, activity] of suspiciousActivities.entries()) {
        if (activity.timestamp < cutoffTime) {
            suspiciousActivities.delete(id);
        }
    }
    
    // Log-Rotation
    if (loggingConfig.logRotation.enabled && fs.existsSync(loggingConfig.logFilePath)) {
        const stats = fs.statSync(loggingConfig.logFilePath);
        if (stats.size > loggingConfig.logRotation.maxFileSize) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const rotatedFile = loggingConfig.logFilePath + '.' + timestamp;
            fs.renameSync(loggingConfig.logFilePath, rotatedFile);
            
            logEvent('INFO', 'Log-Datei rotiert', {
                originalSize: stats.size,
                rotatedFile: rotatedFile
            });
        }
    }
}, 300000); // Alle 5 Minuten

// Server starten
app.listen(PORT, () => {
    console.log('=== DEFENSE 4.2.4 - LOGGING & MONITORING ===');
    console.log(`Server läuft auf http://localhost:${PORT}`);
    console.log('\nLogging Konfiguration:');
    console.log(`  Log-Datei: ${loggingConfig.logFilePath}`);
    console.log(`  Console-Alerts: ${loggingConfig.notifications.consoleAlerts ? 'Aktiv' : 'Inaktiv'}`);
    console.log(`  File-Alerts: ${loggingConfig.notifications.fileAlerts ? 'Aktiv' : 'Inaktiv'}`);
    console.log(`  Email-Alerts: ${loggingConfig.notifications.emailAlerts ? 'Aktiv' : 'Inaktiv'}`);
    console.log('\nVerdächtige Aktivitäten Schwellenwerte:');
    console.log(`  Fehlgeschlagene Versuche pro IP: ${loggingConfig.suspiciousThresholds.failedAttemptsPerIP}`);
    console.log(`  Verschiedene Benutzernamen pro IP: ${loggingConfig.suspiciousThresholds.differentUsernamesPerIP}`);
    console.log(`  Verschiedene IPs pro Benutzername: ${loggingConfig.suspiciousThresholds.differentIPsPerUsername}`);
    console.log(`  Zeitfenster: ${loggingConfig.suspiciousThresholds.timeWindow / 1000}s`);
    console.log('\nTest-Benutzer:');
    Object.keys(testUsers).forEach(user => {
        console.log(`  ${user}: ${testUsers[user]}`);
    });
    console.log('\nEndpoints:');
    console.log(`  GET  /                    - Login-Seite`);
    console.log(`  POST /login              - Login mit Logging`);
    console.log(`  GET  /security-dashboard  - Security Dashboard`);
    console.log(`  GET  /suspicious-activities - Verdächtige Aktivitäten`);
    console.log(`  GET  /logs               - Log-Einträge`);
    console.log(`  DELETE /logs             - Log-Datei löschen`);
    console.log('\nVerteidigung:');
    console.log('  ✅ Vollständiges Logging');
    console.log('  ✅ Verdächtige Aktivitäten Erkennung');
    console.log('  ✅ Security Dashboard');
    console.log('  ✅ Automatische Benachrichtigungen');
    console.log('  ✅ Log-Rotation');
    console.log('  ✅ Real-time Monitoring');
});
