const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envFile = path.join(__dirname, '.env');
if (!fs.existsSync(envFile)) {
  console.log('No .env file found');
  process.exit(1);
}

const content = fs.readFileSync(envFile, 'utf-8');
const lines = content.split('\n');

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  
  if (!key || !val) continue;
  
  try {
    console.log(`Setting ${key}...`);
    execSync(`railway variables --set "${key}=${val}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Failed to set ${key}: ${e.message}`);
  }
}

console.log('Done setting variables!');
