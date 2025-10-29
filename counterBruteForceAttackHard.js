/*
 * Filename: counterBruteForceAttackHard.js
 * Kurzbeschreibung: Login-Versuche in logs/security.log protokollieren.
 * Aufrufparameter: keine (über server.js als Middleware genutzt; Modus /hard oder /all).
 * Autor: Theodor Schneider, Oliver Piechocki, Daniele Zitran
 * Datum: 2025-10-29
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Konfiguration
const loggingConfig = {
	logFilePath: path.join(__dirname, 'logs', 'security.log')
};

// Alarm-Konfiguration (verdächtige Aktivitäten)
const alarmConfig = {
	windowMs: 5 * 60 * 1000, // 5 Minuten Zeitfenster
	failedAttemptsThreshold: 10, // ab 10 Fehlversuchen pro IP im Fenster Alarm
	cooldownMs: 5 * 60 * 1000 // mindestens 5 Minuten zwischen zwei Alarmen pro IP
};

// In-Memory-Tracker für Fehlversuche pro IP
const failedAttemptsByIp = new Map(); // ip -> { timestamps: number[], lastAlarmAt?: number }

// Log-Verzeichnis erstellen, falls nicht vorhanden
const logDir = path.dirname(loggingConfig.logFilePath);
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir, { recursive: true });
}

// Log-Writer
/** Schreibt einen Logeintrag. */
function logEvent(level, message, data = {}) {
	const timestamp = new Date().toISOString();
	const entry = { id: crypto.randomUUID(), timestamp, level, message, data };
	const line = JSON.stringify(entry) + '\n';
	console.log(`[${timestamp}] ${level}: ${message}`, data);
	fs.appendFileSync(loggingConfig.logFilePath, line);

	// Heuristik: Bei Fehlversuchen prüfen, ob ein Alarm ausgelöst werden soll
	try {
		if ((level === 'WARNING' || /Fehlgeschlagener Login/i.test(message)) && data && data.ip) {
			trackFailedAttemptAndMaybeAlarm(data.ip, data);
		}
	} catch (_) {
		// kein Hard-Fail im Logger
	}
	return entry;
}

/**
 * Merkt sich einen Fehlversuch für die gegebene IP und löst bei Überschreitung
 * des Schwellwerts innerhalb des Zeitfensters einen Alarm aus.
 */
function trackFailedAttemptAndMaybeAlarm(ip, context = {}) {
	const now = Date.now();
	let record = failedAttemptsByIp.get(ip);
	if (!record) {
		record = { timestamps: [], lastAlarmAt: undefined };
		failedAttemptsByIp.set(ip, record);
	}

	// alten Ballast entfernen (außerhalb des Fensters)
	record.timestamps = record.timestamps.filter(ts => now - ts <= alarmConfig.windowMs);
	// aktuellen Fehlversuch speichern
	record.timestamps.push(now);

	// prüfen, ob Schwellwert überschritten und Cooldown vorbei
	const attemptsInWindow = record.timestamps.length;
	const cooldownPassed = !record.lastAlarmAt || (now - record.lastAlarmAt >= alarmConfig.cooldownMs);
	if (attemptsInWindow >= alarmConfig.failedAttemptsThreshold && cooldownPassed) {
		triggerAlarm(ip, attemptsInWindow, context);
		record.lastAlarmAt = now;
	}
}

/** Löst einen Alarm aus (Konsole, Log-Eintrag, Alarmdatei). */
function triggerAlarm(ip, attempts, context = {}) {
	const details = {
		ip,
		attemptsInWindow: attempts,
		windowMinutes: Math.round(alarmConfig.windowMs / 60000),
		threshold: alarmConfig.failedAttemptsThreshold,
		userAgent: context.userAgent || 'Unknown',
		username: context.username || 'Unknown'
	};

	// Prominente Konsolen-Ausgabe
	const banner = '\n' +
		'================= SECURITY ALARM =================\n' +
		`Verdächtige Aktivität von ${ip}: ${attempts} Fehlversuche in ${Math.round(alarmConfig.windowMs/60000)} Min.\n` +
		'===================================================\n';
	console.warn(banner);

	// Als ALERT ins Log schreiben
	logEvent('ALERT', 'ALARM: Verdächtige Aktivität erkannt', details);

	// Alarm-Trigger-Datei für externe Tools/Watcher schreiben
	try {
		const alarmFile = path.join(path.dirname(loggingConfig.logFilePath), 'alarm.triggered');
		fs.writeFileSync(alarmFile, JSON.stringify({ timestamp: new Date().toISOString(), ...details }, null, 2));
	} catch (_) {
		// Ignorieren – Alarm bleibt dennoch in Konsole/Log sichtbar
	}
}

// Middleware: schreibt Login-Versuchsdaten
/** Protokolliert eingehende Login-Versuche. */
function loggingMiddleware(req, res, next) {
	const clientIP = req.ip || req.connection.remoteAddress;
	const userAgent = req.get('User-Agent') || 'Unknown';
	const { username } = req.body;
	logEvent('INFO', 'Login-Versuch', { ip: clientIP, username, userAgent });
	req.loggingData = { clientIP, userAgent, username, startTime: Date.now() };
	next();
}

module.exports = {
	logEvent,
	loggingMiddleware,
	loggingConfig
};


