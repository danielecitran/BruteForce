# Brute Force Test Umgebung

## 🚀 Installation und Start

### 1. Dependencies installieren
```bash
npm install
```

### 2. Server starten
```bash
npm start
```

### 3. Browser öffnen
Öffne http://localhost:3000 in deinem Browser

## ⚔️ Brute-Force-Angriffe

### Brute-Force-Angriff mit allen Methoden
```bash
node startBruteForceAttack.js [username] [attackType] [maxLength]
```

**Parameter:**
- `username` - Ziel-Benutzername (Standard: admin)
- `attackType` - Angriffstyp: all|rainbow|parallel|dictionary|mono|poly (Standard: all)
- `maxLength` - Maximale Passwort-Länge für Brute-Force (Standard: 3)

## 🎯 Implementierte Angriffe

### 4.1.1 Einfach - Mono-Alphabet
- **Zeichen:** Klein-/Großschreibung, Zahlen, Sonderzeichen (62 Zeichen)
- **Methode:** Brute-Force mit allen Kombinationen
- **Test:** `node startBruteForceAttack.js mono mono 4`

### 4.1.2 Mittel - Poly-Alphabet
- **Zeichen:** Türkisch, Ungarisch, Finnisch, Kyrillisch, Chinesisch, Römisch (188 Zeichen)
- **Methode:** Brute-Force mit internationalen Zeichen
- **Test:** `node startBruteForceAttack.js poly poly 2`

### 4.1.2 Mittel - Dictionaries
- **Methode:** Smart-Vorgehen mit Benutzer-Kredentials und Permutationen
- **Kombinationen:** Wörter + Zahlen, Wörter + Wörter, Wörter + Sonderzeichen
- **Test:** `node startBruteForceAttack.js dictionary dictionary`

### 4.1.3 Komplex - Rainbow-Tables
- **Methode:** Hash-Plain Look-Up-Dateien
- **Funktion:** Hash-Werte zu Passwörtern zurückverfolgen
- **Test:** `node startBruteForceAttack.js rainbow rainbow`

### 4.1.3 Komplex - Parallelisierter Angriff
- **Methode:** Mehrere Instanzen mit Wertebereichen
- **Instanzen:** 8 verschiedene Zeichenbereiche (a-m, n-z, A-M, N-Z, 0-4, 5-9, Sonderzeichen, International)
- **Test:** `node startBruteForceAttack.js parallel parallel 3`

### 4.1.4 Parametrisierbar
- **Separates File:** Eigenständiges Angriffsscript
- **Konfigurierbar:** Verschiedene Parameter für verschiedene Angriffe
- **Flexibel:** Einzelne Angriffstypen testbar

## 🔧 Beispiele

```bash
# Alle Angriffe
node startBruteForceAttack.js admin

# Nur Rainbow-Tables
node startBruteForceAttack.js rainbow rainbow

# Nur Parallelisierter Angriff
node startBruteForceAttack.js parallel parallel

# Nur Dictionary-Angriffe
node startBruteForceAttack.js dictionary dictionary

# Mono-Alphabet mit Länge 4
node startBruteForceAttack.js mono mono 4

# Poly-Alphabet mit Länge 2
node startBruteForceAttack.js poly poly 2
```

## 🔧 Entwicklung

Für Entwicklung mit automatischem Neustart:
```bash
npm run dev
```

## 🗂️ Versionierung (rekonstruiert)

- Interne Versionierung wurde nachgetragen. Siehe `CHANGELOG.md` mit datierten Einträgen:
  - 2025-09-24: Easy (Angriff/Verteidigung), Basisserver
  - 2025-10-01: Medium (CAPTCHA + Lockout)
  - 2025-10-22: Hard (Logging, Beginn)
  - 2025-10-29: Refactor, Umbenennungen, Middleware-Only, Startup-Hinweis

## 📋 Test-Benutzer

| Benutzername | Passwort | Angriffstyp |
|-------------|----------|-------------|
| dictionary  | admin123 | Dictionary-Angriffe |
| mono        | a*4      | Mono-Alphabet Brute-Force |
| poly        | ĞIİ      | Poly-Alphabet Brute-Force |
| rainbow     | admin    | Rainbow-Tables (Hash-Plain) |
| parallel    | ab       | Parallelisierter Angriff (Instanz a-m) |

## 🛡️ Server-Status

- **Keine Verteidigungen aktiv**
- **Bereit für Brute-Force-Angriffe**
- **Kein Delay - maximale Geschwindigkeit**
- **Kein Logging - nur für Angriffe**

## 🌐 API Endpoints

- `GET /` - Login-Seite
- `POST /login` - Login-Endpoint

## 📁 Projektstruktur

```
BruteForce/
├── server.js                    # Express Server
├── package.json                  # Dependencies
├── startBruteForceAttack.js      # Brute-Force-Angriff (alle Methoden)
├── public/
│   └── login.html               # Frontend
└── README.md                    # Dokumentation
└── CHANGELOG.md                 # Änderungsverlauf (rekonstruiert ab 2025-10-29)
```

## 🔍 Angriffstypen im Detail

### Rainbow-Tables (Hash-Plain Look-Up)
- **Vorbereitete Hash-Plain-Tabelle** mit häufigen Passwörtern
- **Hash-Extraktion** vom Server (simuliert)
- **Look-Up** in vorberechneter Tabelle
- **Schnellster Angriff** für bekannte Passwörter

### Parallelisierter Angriff (Mehrere Instanzen)
- **8 Instanzen** mit verschiedenen Wertebereichen
- **Jede Instanz** greift ihren Bereich parallel an
- **Optimale Ressourcennutzung**
- **Skalierbar** auf mehrere Server/Threads

### Dictionary-Angriffe (Smart-Vorgehen)
- **Benutzer-Kredentials** und Permutationen
- **Wörter + Zahlen** (admin123, 123admin)
- **Wörter + Wörter** (adminuser, useradmin)
- **Wörter + Sonderzeichen** (admin!, !admin)

### Mono-Alphabet Brute-Force
- **62 Zeichen:** a-z, A-Z, 0-9, Sonderzeichen
- **Systematische** Abarbeitung aller Kombinationen
- **Vollständige Abdeckung** des Zeichenraums

### Poly-Alphabet Brute-Force
- **188 Zeichen:** Internationale Zeichen + Mono-Alphabet
- **Erweiterte** Zeichenpalette
- **Höhere** Erfolgswahrscheinlichkeit bei internationalen Passwörtern