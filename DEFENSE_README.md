# Brute Force Defense Mechanisms

## 🛡️ Verteidigungsmaßnahmen 4.2.1 bis 4.2.4

Dieses Projekt implementiert vier verschiedene Verteidigungsmechanismen gegen Brute-Force-Angriffe, wie in den Abschnitten 4.2.1 bis 4.2.4 beschrieben.

## 📁 Projektstruktur

```
BruteForce/
├── defense_4_2_1_rate_limiting.js      # Rate Limiting mit progressiven Delays
├── defense_4_2_2_account_lockout.js    # Account Lockout nach fehlgeschlagenen Versuchen
├── defense_4_2_3_captcha.js            # CAPTCHA Implementation
├── defense_4_2_4_logging_monitoring.js # Logging und Monitoring System
├── server.js                           # Ursprünglicher Server (ohne Verteidigung)
├── startBruteForceAttack.js           # Brute-Force-Angriff Script
├── package.json                       # Dependencies
├── public/
│   └── login.html                     # Frontend
└── logs/                              # Log-Dateien (wird automatisch erstellt)
```

## 🚀 Installation und Start

### 1. Dependencies installieren
```bash
npm install
```

### 2. Verteidigungsmechanismen starten

Jeder Verteidigungsmechanismus läuft auf einem separaten Port:

#### 4.2.1 Rate Limiting (Port 3001)
```bash
node defense_4_2_1_rate_limiting.js
```

#### 4.2.2 Account Lockout (Port 3002)
```bash
node defense_4_2_2_account_lockout.js
```

#### 4.2.3 CAPTCHA (Port 3003)
```bash
node defense_4_2_3_captcha.js
```

#### 4.2.4 Logging & Monitoring (Port 3004)
```bash
node defense_4_2_4_logging_monitoring.js
```

## 🛡️ Verteidigungsmechanismen im Detail

### 4.2.1 Rate Limiting mit progressiven Delays

**Funktionalität:**
- Verhindert Brute-Force-Angriffe durch zeitliche Verzögerungen
- Progressive Delays: Verzögerung erhöht sich mit jedem Versuch
- IP-basierte Sperrung
- Automatisches Reset nach bestimmter Zeit

**Konfiguration:**
- Basis-Delay: 1 Sekunde
- Progressiver Multiplikator: 1.5x
- Maximaler Delay: 30 Sekunden
- Reset-Zeit: 5 Minuten

**Endpoints:**
- `GET /` - Login-Seite
- `POST /login` - Login mit Rate Limiting
- `GET /rate-limit-status` - Rate Limit Status

**Verteidigung:**
- ✅ Rate Limiting aktiv
- ✅ Progressive Delays
- ✅ IP-basierte Sperrung
- ✅ Automatisches Reset

---

### 4.2.2 Account Lockout nach fehlgeschlagenen Versuchen

**Funktionalität:**
- Sperrt Accounts nach einer bestimmten Anzahl fehlgeschlagener Login-Versuche
- Progressive Sperrzeiten (erhöhen sich mit jeder Sperrung)
- Benutzer-spezifische Sperrung
- Admin-Funktion zum manuellen Entsperren

**Konfiguration:**
- Max. fehlgeschlagene Versuche: 5
- Basis-Sperrzeit: 5 Minuten
- Progressive Sperrung: Aktiv (Multiplikator: 2x)
- Max. Sperrzeit: 1 Stunde
- Reset-Zeit: 15 Minuten

**Endpoints:**
- `GET /` - Login-Seite
- `POST /login` - Login mit Account Lockout
- `GET /account-status/:username` - Account Status
- `GET /all-accounts-status` - Alle Accounts Status
- `POST /unlock-account` - Account manuell entsperren

**Verteidigung:**
- ✅ Account Lockout aktiv
- ✅ Progressive Sperrzeiten
- ✅ Benutzer-spezifische Sperrung
- ✅ Automatisches Reset
- ✅ Admin-Entsperrung

---

### 4.2.3 CAPTCHA Implementation

**Funktionalität:**
- Verhindert automatisierte Angriffe durch CAPTCHA-Verifikation
- Automatische Aktivierung nach bestimmten fehlgeschlagenen Versuchen
- IP-basierte CAPTCHA-Sessions
- Zeitbasierte Ablauf der CAPTCHAs

**Konfiguration:**
- Versuche vor CAPTCHA: 3
- CAPTCHA Länge: 6 Zeichen
- Verfügbare Zeichen: A-Z, 0-9
- Gültigkeitsdauer: 5 Minuten
- Reset-Zeit: 15 Minuten

**Endpoints:**
- `GET /` - Login-Seite
- `POST /login` - Login mit CAPTCHA
- `GET /generate-captcha` - CAPTCHA generieren
- `POST /validate-captcha` - CAPTCHA validieren
- `GET /captcha-status` - CAPTCHA Status
- `GET /all-captcha-sessions` - Alle CAPTCHA Sessions

**Verteidigung:**
- ✅ CAPTCHA aktiv
- ✅ Automatische Aktivierung
- ✅ IP-basierte Sessions
- ✅ Zeitbasierte Ablauf
- ✅ Automatisches Reset

---

### 4.2.4 Logging und Monitoring System

**Funktionalität:**
- Überwacht und protokolliert alle Login-Versuche
- Erkennt verdächtige Aktivitäten automatisch
- Security Dashboard für Überwachung
- Automatische Benachrichtigungen bei kritischen Ereignissen
- Log-Rotation für Speicherverwaltung

**Konfiguration:**
- Verdächtige Schwellenwerte:
  - Fehlgeschlagene Versuche pro IP: 10 (in 5 Min)
  - Verschiedene Benutzernamen pro IP: 5 (in 5 Min)
  - Verschiedene IPs pro Benutzername: 3 (in 5 Min)
- Log-Rotation: 10MB max, 5 Dateien
- Benachrichtigungen: Console, File, Email (simuliert)

**Endpoints:**
- `GET /` - Login-Seite
- `POST /login` - Login mit Logging
- `GET /security-dashboard` - Security Dashboard
- `GET /suspicious-activities` - Verdächtige Aktivitäten
- `GET /logs` - Log-Einträge
- `DELETE /logs` - Log-Datei löschen

**Verteidigung:**
- ✅ Vollständiges Logging
- ✅ Verdächtige Aktivitäten Erkennung
- ✅ Security Dashboard
- ✅ Automatische Benachrichtigungen
- ✅ Log-Rotation
- ✅ Real-time Monitoring

## 🧪 Test-Benutzer

Alle Verteidigungsmechanismen verwenden die gleichen Test-Benutzer:

| Benutzername | Passwort | Beschreibung |
|-------------|----------|-------------|
| admin       | admin123 | Standard Admin Account |
| user        | password | Standard User Account |
| test        | test123  | Test Account |
| demo        | demo456  | Demo Account |

## 🔧 Testing der Verteidigungsmechanismen

### Rate Limiting testen
```bash
# Server starten
node defense_4_2_1_rate_limiting.js

# Browser öffnen: http://localhost:3001
# Mehrere fehlgeschlagene Login-Versuche durchführen
# Beobachten der progressiven Delays
```

### Account Lockout testen
```bash
# Server starten
node defense_4_2_2_account_lockout.js

# Browser öffnen: http://localhost:3002
# 5 fehlgeschlagene Versuche mit demselben Benutzername
# Account wird gesperrt
```

### CAPTCHA testen
```bash
# Server starten
node defense_4_2_3_captcha.js

# Browser öffnen: http://localhost:3003
# 3 fehlgeschlagene Versuche
# CAPTCHA wird aktiviert
```

### Logging & Monitoring testen
```bash
# Server starten
node defense_4_2_4_logging_monitoring.js

# Browser öffnen: http://localhost:3004
# Mehrere Login-Versuche durchführen
# Security Dashboard besuchen: http://localhost:3004/security-dashboard
```

## 🚨 Brute-Force-Angriffe testen

Um die Wirksamkeit der Verteidigungsmechanismen zu testen, können Sie das Brute-Force-Angriff Script verwenden:

```bash
# Gegen Rate Limiting Server (Port 3001)
node startBruteForceAttack.js admin

# Gegen Account Lockout Server (Port 3002)
node startBruteForceAttack.js admin

# Gegen CAPTCHA Server (Port 3003)
node startBruteForceAttack.js admin

# Gegen Logging Server (Port 3004)
node startBruteForceAttack.js admin
```

**Hinweis:** Die Verteidigungsmechanismen werden die Angriffe blockieren oder verlangsamen.

## 📊 Monitoring und Überwachung

### Security Dashboard
Besuchen Sie das Security Dashboard für jeden Verteidigungsmechanismus:

- Rate Limiting: `http://localhost:3001/rate-limit-status`
- Account Lockout: `http://localhost:3002/all-accounts-status`
- CAPTCHA: `http://localhost:3003/all-captcha-sessions`
- Logging: `http://localhost:3004/security-dashboard`

### Log-Dateien
Log-Dateien werden automatisch erstellt:
- `logs/security.log` - Alle Sicherheitsereignisse
- Automatische Rotation bei 10MB
- JSON-Format für einfache Analyse

## 🔒 Sicherheitshinweise

1. **Produktionsumgebung:** Diese Implementierungen sind für Testzwecke gedacht. Für Produktionsumgebungen sollten zusätzliche Sicherheitsmaßnahmen implementiert werden.

2. **Speicher-basierte Sessions:** Die aktuellen Implementierungen verwenden In-Memory-Speicher. Für Produktionsumgebungen sollten persistente Datenbanken verwendet werden.

3. **HTTPS:** Alle Login-Endpoints sollten über HTTPS geschützt werden.

4. **Rate Limiting:** Die Rate Limiting Implementierung sollte mit einem Reverse Proxy (wie nginx) kombiniert werden.

5. **Monitoring:** Das Logging-System sollte mit einem zentralen Log-Management-System (wie ELK Stack) integriert werden.

## 🛠️ Entwicklung

Für Entwicklung mit automatischem Neustart:
```bash
npm install -g nodemon
nodemon defense_4_2_1_rate_limiting.js
nodemon defense_4_2_2_account_lockout.js
nodemon defense_4_2_3_captcha.js
nodemon defense_4_2_4_logging_monitoring.js
```

## 📝 Lizenz

Dieses Projekt ist für Bildungszwecke erstellt und dient der Demonstration von Brute-Force-Verteidigungsmechanismen.
