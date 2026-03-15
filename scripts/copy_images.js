const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\c01b1019-990f-40f1-aece-b905279edb6f';
const destDir = 'c:\\Users\\ADMIN\\Desktop\\CODING\\SOVELY\\sovely-ecommerce\\web-app\\src\\assets\\images';

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log('Created directory:', destDir);
}

// Map of substrings to match in source files -> destination filenames
const filesToCopy = {
    'homepod_mini': 'homepod_mini.png',
    'instax_mini': 'instax_mini.png',
    'base_camp_duffel': 'base_camp_duffel.png',
    'hero_banner': 'hero_banner.png',
    'smart_watch': 'smart_watch.png',
    'adidas_sneakers': 'adidas_sneakers.png'
};

const srcFiles = fs.readdirSync(srcDir);

for (const [key, destName] of Object.entries(filesToCopy)) {
    const matchedFile = srcFiles.find(f => f.includes(key) && f.endsWith('.png'));
    if (matchedFile) {
        const srcPath = path.join(srcDir, matchedFile);
        const destPath = path.join(destDir, destName);
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${matchedFile} to ${destName}`);
    } else {
        console.log(`Could not find source image for ${key}`);
    }
}
