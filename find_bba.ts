import fs from 'fs';
import path from 'path';

function walk(dir: string) {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.mjs')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.toLowerCase().includes('bba')) {
          results.push(fullPath);
        }
      }
    }
  });
  return results;
}

try {
  console.log("Searching for BBA references in active project...");
  const matches = walk('./src');
  const scriptMatches = walk('./scripts');
  const allMatches = [...matches, ...scriptMatches];
  console.log("Matches found:");
  allMatches.forEach(m => console.log(` - ${m}`));
} catch (err) {
  console.error(err);
}
