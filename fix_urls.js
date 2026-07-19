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

  // Replace occurrences of hardcoded API URL
  const oldStr = 'http://localhost:8000/api';
  const newStr = '`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/py-api`';

  // For things like: const API = ... || "http://localhost:8000";
  // Then later: `${API}/api/...`
  // It's better to just regex replace `http://localhost:8000/api` -> `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/py-api`

  // Let's replace 'http://localhost:8000/api/' in single or double quotes
  // e.g. await fetch('http://localhost:8000/api/applications/')
  
  if (content.includes("'http://localhost:8000/api/")) {
    content = content.replace(/'http:\/\/localhost:8000\/api\//g, "`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/py-api/");
    changed = true;
  }
  
  if (content.includes('"http://localhost:8000/api/')) {
    content = content.replace(/"http:\/\/localhost:8000\/api\//g, "`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/py-api/");
    changed = true;
  }
  
  if (content.includes('`http://localhost:8000/api/')) {
    content = content.replace(/`http:\/\/localhost:8000\/api\//g, "`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/py-api/");
    changed = true;
  }

  // Also replace `const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";`
  // with `const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";`
  if (content.includes('NEXT_PUBLIC_API_URL')) {
    content = content.replace(/NEXT_PUBLIC_API_URL/g, 'NEXT_PUBLIC_BACKEND_URL');
    changed = true;
  }
  
  // Replace references to `${API}/api/` with `${API}/py-api/`
  if (content.includes('${API}/api/')) {
    content = content.replace(/\$\{API\}\/api\//g, '${API}/py-api/');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
