import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\susanna\\OneDrive\\Desktop\\INTERN\\leaarning-management-system\\scripts\\seed-large.ts', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('24cse001') || line.includes('24CSE001') || line.includes('susanna')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
