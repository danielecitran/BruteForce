/*
 * Filename: counterBruteForceAttackHard.js
 * Kurzbeschreibung: Login-Versuche in logs/security.log protokollieren.
 * Aufrufparameter: keine (über server.js als Middleware genutzt; Modus /hard oder /all).
 * Autor: Student
 * Datum: 2025-10-29
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Konfiguration
const loggingConfig = {
	logFilePath: path.join(__dirname, 'logs', 'security.log')
};

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
	return entry;
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


