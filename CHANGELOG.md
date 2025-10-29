# Changelog

Alle relevanten Änderungen an diesem Projekt werden in diesem Dokument festgehalten.


## 2025-10-29

### Added
- Defense auf Middleware-Only umgestellt und zentral über `server.js` aktivierbar (Routen: `/`, `/easy`, `/medium`, `/hard`, `/all`).
- 4.2.1 Easy: Lineares Rate Limiting mit steigender Wartezeit pro Fehlversuch (`counterBruteForceAttackEasy.js`).
- 4.2.2 Medium: CAPTCHA-Anforderung und Account-Lockout (`counterBruteForceAttackMedium.js`).
- 4.2.4 Hard: Logging von Login-Versuchen in `logs/security.log` (`counterBruteForceAttackHard.js`).
- Startup-Hinweis im Server-Log zur Moduswahl.

### Changed
- Kommentare bereinigt und auf beschreibende, kurze Hinweise reduziert.
- Defense-Dateien umbenannt: `counterBruteForceAttackEasy|Medium|Hard`.


## 2025-10-22

### Added
- Hard-Verteidigung: Logging von Login-Versuchen (Beginn der 4.2.4-Umsetzung).
- Log-Datei `logs/security.log` eingeführt.

### Changed
- Erste Integration der Logging-Middleware in den Login-Flow.


## 2025-10-01

### Added
- Medium-Verteidigung: CAPTCHA-Anforderung nach mehreren Fehlversuchen.
- Account-Lockout bei zu vielen Fehlversuchen (zeitbasiert/permanent je nach Schwellenwert).

### Changed
- Client: CAPTCHA-Eingabe-Feld und Aktualisierungsschaltfläche vorbereitet.


## 2025-09-24

### Added
- Basisserver mit Login-Endpoint und Test-Benutzern.
- Easy-Verteidigung: Lineares Rate Limiting (steigende Wartezeit je Fehlversuch).
- Erste einfache Angriffe (Mono/Dictionary) getestet.


