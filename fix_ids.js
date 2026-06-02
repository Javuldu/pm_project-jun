const fs = require('fs');
const content = fs.readFileSync('src/data.ts', 'utf8');
const lines = content.split('\n');
const newLines = lines.map(line => {
  const match = line.match(/^  ([a-z]+): \{ id: '([^']+)'/);
  if (match && match[1] !== match[2]) {
    return line.replace(`id: '${match[2]}'`, `id: '${match[1]}'`);
  }
  return line;
});
fs.writeFileSync('src/data.ts', newLines.join('\n'));
console.log('Fixed IDs in data.ts');
