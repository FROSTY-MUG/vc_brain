const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // We need to fix the template literal.
  // It looks like: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/py-api/sourcing/outbound/signals')
  // We need to change the trailing ') or ") to `)
  
  // A regex to match the pattern:
  const regex = /(\$\{process\.env\.NEXT_PUBLIC_BACKEND_URL \|\| 'http:\/\/localhost:8000'\}\/py-api\/.*?)(['"])/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, "$1`");
    changed = true;
  }
  
  // But wait, what if it was already a template literal? Then it would end with ` and not be matched by ['"].
  // What about just `; at the end of a string like const foo = `${...}';
  const regex2 = /(\$\{process\.env\.NEXT_PUBLIC_BACKEND_URL \|\| 'http:\/\/localhost:8000'\}\/py-api\/.*?)(['"]);/g;
  if (regex2.test(content)) {
    content = content.replace(regex2, "$1`;");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Fixed syntax in ${file}`);
  }
}
