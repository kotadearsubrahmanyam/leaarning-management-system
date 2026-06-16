import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walk(filepath, callback);
      }
    } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css') || file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.json'))) {
      callback(filepath);
    }
  }
}

const rootDir = 'C:\\Users\\susanna\\OneDrive\\Desktop\\INTERN\\leaarning-management-system';
const results = [];

walk(rootDir, (filepath) => {
  const content = fs.readFileSync(filepath, 'utf8');
  if (content.toLowerCase().includes('24cse001')) {
    results.push(filepath);
  }
});

console.log('Found 24cse001 reference in:', results);
