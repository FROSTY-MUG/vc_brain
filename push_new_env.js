const { execSync } = require('child_process');

const key = 'NEXT_PUBLIC_BACKEND_URL';
const val = 'https://vc-brain-seven.vercel.app';

try {
  execSync(`npx vercel env add ${key} production`, {
    input: val,
    stdio: ['pipe', 'inherit', 'inherit']
  });
  execSync(`npx vercel env add ${key} preview`, {
    input: val,
    stdio: ['pipe', 'inherit', 'inherit']
  });
  console.log(`Added ${key}`);
} catch (e) {
  console.error(`Failed to push ${key}`, e);
}
