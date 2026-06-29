const fs = require('fs');
const path = require('path');
const strip = require('strip-comments');

// Directories to completely ignore (crucial so you don't break modules or git)
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'public'];

// File extensions you want to clean
const TARGET_EXTENSIONS = ['.js', '.jsx', '.css'];

/**
 * Recursively walks through a directory and processes files
 */
function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();

        if (isDirectory) {
            if (!IGNORE_DIRS.includes(f)) {
                walkDir(dirPath, callback);
            }
        } else {
            callback(dirPath);
        }
    });
}

/**
 * Cleans a single file safely
 */
function cleanFile(filePath) {
    const ext = path.extname(filePath);
    
    if (TARGET_EXTENSIONS.includes(ext)) {
        try {
            const originalCode = fs.readFileSync(filePath, 'utf8');
            let cleanCode;

            if (ext === '.css') {
                // FIX 1: CSS ONLY uses block comments (/* */). 
                // Passing CSS into a JS comment stripper risks breaking URLs.
                cleanCode = originalCode.replace(/\/\*[\s\S]*?\*\//g, '');
            } else {
                // FIX 2: JS/JSX URL Masking
                // Temporarily hide known URL protocols from the parser so it 
                // doesn't mistake them for inline line comments in JSX text.
                const maskedCode = originalCode.replace(/(https?|ftp|wss?|file):\/\//ig, '$1:__URL_SLASHES__');
                
                // Strip the comments using the masked code
                const strippedMasked = strip(maskedCode);
                
                // Restore the slashes back to normal URLs
                cleanCode = strippedMasked.replace(/(https?|ftp|wss?|file):__URL_SLASHES__/ig, '$1://');
            }
            
            // Only write back if something actually changed
            if (originalCode !== cleanCode) {
                fs.writeFileSync(filePath, cleanCode, 'utf8');
                console.log(`✅ Cleaned: ${filePath}`);
            }
        } catch (err) {
            console.error(`❌ Failed to clean ${filePath}:`, err.message);
        }
    }
}

console.log('🚀 Starting robust comment removal...');
walkDir(__dirname, cleanFile);
console.log('🎉 Comment purge complete!');