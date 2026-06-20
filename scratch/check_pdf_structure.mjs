import fs from 'fs';
import path from 'path';

const dir = 'public/uploads/evaluations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

if (files.length > 0) {
  const filePath = path.join(dir, files[0]);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Count pages by looking for Page objects
  const pagesRaw1 = (content.match(/\/Type\s*\/Page\b/g) || []).length;
  const pagesRaw2 = (content.match(/\/Type\s*\/Pages\b/g) || []).length;
  
  console.log(`File: ${files[0]}`);
  console.log(`Page count markers (/Type /Page): ${pagesRaw1}`);
  console.log(`Pages container markers (/Type /Pages): ${pagesRaw2}`);
} else {
  console.log('No files found in directory.');
}
