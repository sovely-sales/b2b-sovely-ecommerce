import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const targetDir = path.join(__dirname, 'src');

function stripComments(content) {
    
    let cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // 2. Remove single-line comments // ... (but ignore URLs like http://)
    cleaned = cleaned.replace(/([^:]|^)\/\/.*/g, '$1');
    
    
    cleaned = cleaned.replace(/^\s*[\r\n]/gm, '\n');
    
    return cleaned;
}

function processDirectory(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath); 
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) { 
            const content = fs.readFileSync(fullPath, 'utf8');
            const cleanedContent = stripComments(content);
            fs.writeFileSync(fullPath, cleanedContent, 'utf8');
            console.log(`🧹 Cleaned: ${file}`);
        }
    }
}

console.log('Starting frontend comment cleanup...');
processDirectory(targetDir);
console.log('✅ Done! All AI comments stripped from your frontend src/ directory.');
