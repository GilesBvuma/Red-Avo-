const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.css') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('c:/Users/Giles Bvuma/3D Website/Red Avo/frontend');
let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let matched = false;
  
  const regex = /font-family:\s*var\(--font-montserrat\),\s*sans-serif;\s*font-weight:\s*700;/g;
  if (regex.test(content)) {
    content = content.replace(regex, 'font-family: var(--font-montserrat), sans-serif;\n  font-weight: 600;');
    matched = true;
  }

  if (matched) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
    updatedCount++;
  }
});

console.log(`Total files updated: ${updatedCount}`);
