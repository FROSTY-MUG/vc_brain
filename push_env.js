const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function pushEnvs(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const equalIdx = trimmed.indexOf('=');
    if (equalIdx === -1) continue;
    
    const key = trimmed.slice(0, equalIdx).trim();
    const val = trimmed.slice(equalIdx + 1).trim();
    
    if (key === 'NEXTAUTH_URL') continue; // Vercel handles this
    
    console.log(`Pushing ${key}...`);
    try {
      execSync(`npx vercel env add ${key} production`, {
        input: val,
        stdio: ['pipe', 'inherit', 'inherit']
      });
      execSync(`npx vercel env add ${key} preview`, {
        input: val,
        stdio: ['pipe', 'inherit', 'inherit']
      });
    } catch (e) {
      console.error(`Failed to push ${key}`);
    }
  }
}

console.log('Pushing from .env.local');
pushEnvs(path.join(__dirname, '.env.local'));

console.log('Pushing from backend/.env');
pushEnvs(path.join(__dirname, 'backend', '.env'));

console.log('Done!');
