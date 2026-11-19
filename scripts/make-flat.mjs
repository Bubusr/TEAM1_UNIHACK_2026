import { execSync } from 'child_process';
import fs from 'fs';

const result = execSync('npx hardhat flatten contracts/src/PawsAndPicketPassport.sol', {
  encoding: 'utf8',
  stdio: ['pipe', 'pipe', 'pipe']
});

// Split into lines
let lines = result.split('\n');

// Remove lines that are dotenv injection logs (not Solidity)
// These start with the diamond "◇" char or contain "injected env"
lines = lines.filter(line => {
  const trimmed = line.trim();
  // Skip dotenv log line
  if (trimmed.includes('injected env') && trimmed.includes('from .env')) return false;
  // Skip hardhat sources flattened comment
  if (trimmed.startsWith('// Sources flattened with hardhat')) return false;
  return true;
});

// Remove BOM from first line if present
if (lines[0] && lines[0].charCodeAt(0) === 0xFEFF) {
  lines[0] = lines[0].slice(1);
}

// Join and trim
const clean = lines.join('\n').replace(/^\n+/, '').trim() + '\n';

fs.writeFileSync('contracts/PawsAndPicketPassport_Flat.sol', clean, { encoding: 'utf8' });
console.log('Written', clean.length, 'chars');
console.log('First 120 chars:', JSON.stringify(clean.slice(0, 120)));
