# Brute Force – Angriffe und Verteidigung (Ein README)

Dieses Projekt stellt eine Brute-Force-Testumgebung mit umschaltbaren Verteidigungsmodi bereit und enthält mehrere Angriffsmethoden zum Testen.

## 🚀 Installation und Start

### 1) Dependencies installieren
```bash
npm install
```

### 2) Server starten
```bash
npm start
```

### 3) Browser öffnen und Modus wählen
Rufe `http://localhost:3000` auf. Über folgende Routen stellst du den Verteidigungsmodus ein:

- `/` – ungeschützt (keine Verteidigung)
- `/easy` – 4.2.1 Rate Limiting (progressive Delays)
- `/medium` – 4.2.2 Kombination: CAPTCHA + Account Lockout
- `/hard` – 4.2.3 Logging & Monitoring
- `/all` – alle Verteidigungen gleichzeitig

Der Login-Endpoint bleibt in allen Modi gleich: `POST /login`.

## 🌐 Relevante Endpoints

- `GET /` | `/easy` | `/medium` | `/hard` | `/all` – Login-Seite laden und Modus setzen
- `POST /login` – Login (Verhalten abhängig vom Modus)

## 📋 Test-Benutzer

| Benutzername | Passwort | Zweck |
|-------------|----------|-------|
| dictionary  | admin123 | Dictionary-Angriffe |
| mono        | a*4      | Mono-Alphabet Brute-Force |
| poly        | ĞIİ      | Poly-Alphabet Brute-Force |
| rainbow     | admin    | Rainbow-Tables (Hash-Plain) |
| parallel    | ab       | Parallelisierter Angriff |

## 🛡️ Verteidigungsmodi (Überblick)

- **Easy (Rate Limiting)**: Zeitliche Verzögerungen bei Fehlversuchen; progressive Delays; Reset nach Erfolg
- **Medium (CAPTCHA + Lockout)**: Nach mehreren Fehlversuchen CAPTCHA-Pflicht; Account-Lockout bei zu vielen Fehlversuchen; automatische Resets
- **Hard (Logging & Monitoring)**: Umfassendes Request-Logging, Events und Metriken; Auswertung verdächtiger Aktivitäten; Log-Datei unter `logs/security.log`
- **All**: Kombination aus Logging, Rate Limiting und den kombinierten Mechanismen aus Medium

Hinweis: Die genaue Logik ist in `counterBruteForceAttackEasy.js`, `counterBruteForceAttackMedium.js` und `counterBruteForceAttackHard.js` implementiert und wird abhängig vom gewählten Modus automatisch aktiviert.

## ⚔️ Brute-Force-Angriffe ausführen

Du kannst Angriffe gegen den aktuell gewählten Modus fahren. Standardziel ist `http://localhost:3000`.

### Generischer Aufruf
```bash
node startBruteForceAttack.js [username] [attackType] [maxLength]
```

**Parameter:**
- `username` – Ziel-Benutzername (Standard: `admin` bzw. nutze einen der Test-User oben)
- `attackType` – `all | rainbow | parallel | dictionary | mono | poly` (Standard: `all`)
- `maxLength` – maximale Passwortlänge (optional; Standard: `3`)

### Beispiele
```bash
# Alle Angriffe gegen aktuellen Modus
node startBruteForceAttack.js admin

# Nur Rainbow-Tables
node startBruteForceAttack.js rainbow rainbow

# Nur parallelisiert
node startBruteForceAttack.js parallel parallel 3

# Nur Dictionary
node startBruteForceAttack.js dictionary dictionary

# Mono mit Länge 4
node startBruteForceAttack.js mono mono 4

# Poly mit Länge 2
node startBruteForceAttack.js poly poly 2
```

## 🔍 Angriffstypen (Kurzbeschreibung)

- **Rainbow-Tables**: Look-up vorberechneter Hash→Plain Tabellen; sehr schnell für bekannte Passwörter
- **Parallelisiert**: Aufteilung des Zeichensatzes auf mehrere Instanzen zur besseren Auslastung
- **Dictionary**: Systematische Wort-/Zahlen-/Sonderzeichen-Permutationen
- **Mono-Alphabet**: Vollständige Kombinationen aus a–z, A–Z, 0–9, Sonderzeichen (~62)
- **Poly-Alphabet**: Erweiterter internationaler Zeichensatz (~188)

## 🔧 Entwicklung

Auto-Neustart während der Entwicklung:
```bash
npm run dev
```

## 📁 Projektstruktur

```
BruteForce/
├── server.js                      # Express-Server (Modus per Route)
├── counterBruteForceAttackEasy.js # Rate Limiting
├── counterBruteForceAttackMedium.js # CAPTCHA + Lockout (+ State)
├── counterBruteForceAttackHard.js # Logging & Monitoring
├── startBruteForceAttack.js       # Angriffsskript (alle Methoden)
├── public/
│   └── login.html                 # Frontend
├── logs/
│   └── security.log               # Sicherheits-Logs (wenn aktiv)
├── CHANGELOG.md                   # Änderungsverlauf
└── README.md                      # Diese Dokumentation
```

## 🗂️ Versionierung (Kurzüberblick)

Siehe `CHANGELOG.md` für datierte Einträge (z. B. 2025-09-24: Easy; 2025-10-01: Medium; 2025-10-22: Hard; 2025-10-29: Refactor).

## 🔒 Sicherheitshinweise

- Diese Umgebung dient zu Demonstrations- und Lernzwecken (nicht für Produktion gedacht).
- In Memory-Zustände und einfache Cookies – für Produktion: persistente Stores und HTTPS verwenden.
- Rate Limiting in Produktion idealerweise per Reverse Proxy ergänzen; Logs zentralisieren.
