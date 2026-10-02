// Copy the standalone GUI factory into the main hub so it works without HTTP/loadstring at startup.
// code-da-luu.lua is the source of truth; --check detects stale embedded copies.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const normalize = value => value.replace(/\r\n/g, '\n');
const standalone = normalize(fs.readFileSync(path.join(root, 'code-da-luu.lua'), 'utf8'));
const start = '-- BEGIN SAVED_CODE_FACTORY';
const end = '-- END SAVED_CODE_FACTORY';
const a = standalone.indexOf(start);
const b = standalone.indexOf(end, a);
if (a < 0 || b < 0) throw new Error('Missing standalone factory markers');
const factory = standalone.slice(a, b + end.length)
    .replace('local function CreateSavedCode(options)', 'S.SavedCodeFactory = function(options)');
const mainPath = path.join(root, 'script.js');
const main = normalize(fs.readFileSync(mainPath, 'utf8'));
const begin = main.indexOf(start);
const finish = main.indexOf(end, begin);
if (begin < 0 || finish < 0) throw new Error('Missing embedded factory markers in script.js');
const updated = main.slice(0, begin) + factory + main.slice(finish + end.length);
if (process.argv.includes('--check')) {
    if (updated !== main) {
        console.error('Embedded saved-code factory is stale. Run: node tools/sync-saved-code.cjs');
        process.exitCode = 1;
    } else console.log('Standalone and embedded saved-code factories match.');
} else {
    fs.writeFileSync(mainPath, updated.replace(/\n/g, '\r\n'));
    console.log('Updated the embedded saved-code factory in script.js.');
}
