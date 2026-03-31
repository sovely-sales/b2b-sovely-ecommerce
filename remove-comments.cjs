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
            
            // Strip comments safely using AST logic
            const cleanCode = strip(originalCode);
            
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
// Start from current directory (or change to './src' to be extra safe)
walkDir(__dirname, cleanFile);
console.log('🎉 Comment purge complete!');
