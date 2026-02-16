const fs = require('fs');
const code = fs.readFileSync('admin.js', 'utf8');
try {
    new Function(code);
    console.log('SYNTAX OK - No errors found');
} catch (e) {
    console.log('SYNTAX ERROR:', e.message);
    // Try to find the line
    const lines = code.split('\n');
    const match = e.message.match(/position (\d+)/);
    if (match) {
        let pos = parseInt(match[1]), count = 0;
        for (let i = 0; i < lines.length; i++) {
            count += lines[i].length + 1;
            if (count >= pos) {
                console.log('Around line:', i + 1);
                console.log('Content:', lines[i].trim());
                break;
            }
        }
    }
}
