/*
 * Dateiname: defense_4_2_2_account_lockout.js
 * Kurzbeschreibung: Verteidigung 4.2.2 - Account Lockout nach fehlgeschlagenen Versuchen
 * Funktionalität: Sperrt Accounts nach einer bestimmten Anzahl fehlgeschlagener Login-Versuche
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3002; // Anderer Port für diese Verteidigung

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

// Account Lockout Konfiguration
const lockoutConfig = {
    // Maximale Anzahl fehlgeschlagener Versuche vor Sperrung
    maxFailedAttempts: 5,
    
    // Sperrzeit in Millisekunden
    lockoutDuration: 300000, // 5 Minuten
    
    // Progressive Sperrzeit (erhöht sich mit jeder Sperrung)
    progressiveLockout: true,
    
    // Basis-Sperrzeit für progressive Sperrung
    baseLockoutDuration: 300000, // 5 Minuten
    
    // Multiplikator für progressive Sperrung
    lockoutMultiplier: 2,
    
    // Maximale Sperrzeit
    maxLockoutDuration: 3600000, // 1 Stunde
    
    // Reset-Zeit für Versuche (in Millisekunden)
    resetTime: 900000, // 15 Minuten
};

// Speicher für Account Lockout Daten
const accountLockoutStore = new Map();

// Account Lockout Middleware
function accountLockoutMiddleware(req, res, next) {
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({
            success: false,
            message: 'Benutzername erforderlich',
            type: 'error'
        });
    }
    
    const now = Date.now();
    
    // Hole oder erstelle Lockout Eintrag für diesen Benutzer
    let lockoutData = accountLockoutStore.get(username);
    
    if (!lockoutData) {
        lockoutData = {
            failedAttempts: 0,
            lastFailedAttempt: 0,
            lockoutUntil: 0,
            lockoutCount: 0,
            lastSuccessfulLogin: 0
        };
        accountLockoutStore.set(username, lockoutData);
    }
    
    // Prüfe ob Account gesperrt ist
    if (now < lockoutData.lockoutUntil) {
        const remainingTime = Math.ceil((lockoutData.lockoutUntil - now) / 1000);
        return res.status(423).json({
            success: false,
            message: `Account gesperrt! Warten Sie ${remainingTime} Sekunden.`,
            type: 'account_locked',
            lockoutInfo: {
                remainingTime: remainingTime,
                lockoutCount: lockoutData.lockoutCount,
                failedAttempts: lockoutData.failedAttempts
            }
        });
    }
    
    // Prüfe ob Reset-Zeit erreicht wurde
    if (now - lockoutData.lastFailedAttempt > lockoutConfig.resetTime) {
        lockoutData.failedAttempts = 0;
        lockoutData.lockoutCount = 0;
    }
    
    // Füge Lockout Info zu Request hinzu
    req.lockoutData = lockoutData;
    req.username = username;
    
    next();
}

// Hauptseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login-Endpoint mit Account Lockout
app.post('/login', accountLockoutMiddleware, (req, res) => {
    const { username, password } = req.body;
    const lockoutData = req.lockoutData;
    const now = Date.now();
    
    // Credentials prüfen
    if (testUsers[username] === password) {
        // Erfolgreicher Login - Reset Lockout Daten
        lockoutData.failedAttempts = 0;
        lockoutData.lockoutCount = 0;
        lockoutData.lockoutUntil = 0;
        lockoutData.lastSuccessfulLogin = now;
        
        return res.json({
            success: true,
            message: 'Erfolgreich angemeldet!',
            type: 'success',
            lockoutInfo: {
                failedAttempts: 0,
                lockoutCount: 0,
                status: 'unlocked'
            }
        });
    } else {
        // Fehlgeschlagener Login - Erhöhe Versuche
        lockoutData.failedAttempts++;
        lockoutData.lastFailedAttempt = now;
        
        // Prüfe ob Account gesperrt werden soll
        if (lockoutData.failedAttempts >= lockoutConfig.maxFailedAttempts) {
            lockoutData.lockoutCount++;
            
            // Berechne Sperrzeit (progressiv oder fest)
            let lockoutDuration = lockoutConfig.lockoutDuration;
            
            if (lockoutConfig.progressiveLockout) {
                lockoutDuration = Math.min(
                    lockoutConfig.baseLockoutDuration * Math.pow(lockoutConfig.lockoutMultiplier, lockoutData.lockoutCount - 1),
                    lockoutConfig.maxLockoutDuration
                );
            }
            
            lockoutData.lockoutUntil = now + lockoutDuration;
            
            return res.status(423).json({
                success: false,
                message: `Account gesperrt! Zu viele fehlgeschlagene Versuche.`,
                type: 'account_locked',
                lockoutInfo: {
                    failedAttempts: lockoutData.failedAttempts,
                    lockoutCount: lockoutData.lockoutCount,
                    lockoutDuration: Math.ceil(lockoutDuration / 1000),
                    remainingTime: Math.ceil(lockoutDuration / 1000),
                    progressiveLockout: lockoutConfig.progressiveLockout
                }
            });
        }
        
        // Noch nicht gesperrt, aber fehlgeschlagener Versuch
        return res.json({
            success: false,
            message: 'Falsche Anmeldedaten!',
            type: 'error',
            lockoutInfo: {
                failedAttempts: lockoutData.failedAttempts,
                remainingAttempts: lockoutConfig.maxFailedAttempts - lockoutData.failedAttempts,
                lockoutCount: lockoutData.lockoutCount,
                status: 'warning'
            }
        });
    }
});

// Account Status Endpoint
app.get('/account-status/:username', (req, res) => {
    const { username } = req.params;
    const lockoutData = accountLockoutStore.get(username);
    
    if (!lockoutData) {
        return res.json({
            username: username,
            status: 'clean',
            failedAttempts: 0,
            lockoutCount: 0,
            lockoutUntil: 0
        });
    }
    
    const now = Date.now();
    const isLocked = now < lockoutData.lockoutUntil;
    
    res.json({
        username: username,
        status: isLocked ? 'locked' : 'unlocked',
        failedAttempts: lockoutData.failedAttempts,
        lockoutCount: lockoutData.lockoutCount,
        lockoutUntil: lockoutData.lockoutUntil,
        remainingTime: isLocked ? Math.ceil((lockoutData.lockoutUntil - now) / 1000) : 0,
        lastSuccessfulLogin: lockoutData.lastSuccessfulLogin,
        config: lockoutConfig
    });
});

// Alle Accounts Status
app.get('/all-accounts-status', (req, res) => {
    const now = Date.now();
    const accounts = [];
    
    for (const [username, lockoutData] of accountLockoutStore.entries()) {
        const isLocked = now < lockoutData.lockoutUntil;
        accounts.push({
            username: username,
            status: isLocked ? 'locked' : 'unlocked',
            failedAttempts: lockoutData.failedAttempts,
            lockoutCount: lockoutData.lockoutCount,
            remainingTime: isLocked ? Math.ceil((lockoutData.lockoutUntil - now) / 1000) : 0
        });
    }
    
    res.json({
        totalAccounts: accounts.length,
        lockedAccounts: accounts.filter(acc => acc.status === 'locked').length,
        accounts: accounts
    });
});

// Account manuell entsperren (Admin-Funktion)
app.post('/unlock-account', (req, res) => {
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({
            success: false,
            message: 'Benutzername erforderlich'
        });
    }
    
    const lockoutData = accountLockoutStore.get(username);
    
    if (!lockoutData) {
        return res.status(404).json({
            success: false,
            message: 'Account nicht gefunden'
        });
    }
    
    // Account entsperren
    lockoutData.failedAttempts = 0;
    lockoutData.lockoutCount = 0;
    lockoutData.lockoutUntil = 0;
    
    res.json({
        success: true,
        message: `Account ${username} wurde entsperrt`,
        lockoutInfo: {
            failedAttempts: 0,
            lockoutCount: 0,
            status: 'unlocked'
        }
    });
});

// Cleanup für alte Lockout Einträge
setInterval(() => {
    const now = Date.now();
    for (const [username, data] of accountLockoutStore.entries()) {
        // Lösche Einträge die länger als 24 Stunden nicht verwendet wurden
        if (now - data.lastFailedAttempt > 86400000 && now - data.lastSuccessfulLogin > 86400000) {
            accountLockoutStore.delete(username);
        }
    }
}, 300000); // Alle 5 Minuten

// Server starten
app.listen(PORT, () => {
    console.log('=== DEFENSE 4.2.2 - ACCOUNT LOCKOUT ===');
    console.log(`Server läuft auf http://localhost:${PORT}`);
    console.log('\nAccount Lockout Konfiguration:');
    console.log(`  Max. fehlgeschlagene Versuche: ${lockoutConfig.maxFailedAttempts}`);
    console.log(`  Basis-Sperrzeit: ${lockoutConfig.baseLockoutDuration / 1000}s`);
    console.log(`  Progressive Sperrung: ${lockoutConfig.progressiveLockout ? 'Aktiv' : 'Inaktiv'}`);
    if (lockoutConfig.progressiveLockout) {
        console.log(`  Sperrzeit-Multiplikator: ${lockoutConfig.lockoutMultiplier}`);
        console.log(`  Max. Sperrzeit: ${lockoutConfig.maxLockoutDuration / 1000}s`);
    }
    console.log(`  Reset-Zeit: ${lockoutConfig.resetTime / 1000}s`);
    console.log('\nTest-Benutzer:');
    Object.keys(testUsers).forEach(user => {
        console.log(`  ${user}: ${testUsers[user]}`);
    });
    console.log('\nEndpoints:');
    console.log(`  GET  /                           - Login-Seite`);
    console.log(`  POST /login                      - Login mit Account Lockout`);
    console.log(`  GET  /account-status/:username    - Account Status`);
    console.log(`  GET  /all-accounts-status         - Alle Accounts Status`);
    console.log(`  POST /unlock-account             - Account manuell entsperren`);
    console.log('\nVerteidigung:');
    console.log('  ✅ Account Lockout aktiv');
    console.log('  ✅ Progressive Sperrzeiten');
    console.log('  ✅ Benutzer-spezifische Sperrung');
    console.log('  ✅ Automatisches Reset');
    console.log('  ✅ Admin-Entsperrung');
});
