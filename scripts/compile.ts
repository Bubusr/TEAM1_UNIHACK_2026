import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function findImports(importPath: string) {
  try {
    let resolvedPath = '';
    if (importPath.startsWith('@openzeppelin/contracts/')) {
      resolvedPath = path.resolve(rootDir, 'node_modules', importPath);
    } else if (importPath.startsWith('./') || importPath.startsWith('../')) {
      resolvedPath = path.resolve(rootDir, 'contracts', 'src', importPath);
    } else {
      resolvedPath = path.resolve(rootDir, 'node_modules', importPath);
    }

    if (fs.existsSync(resolvedPath)) {
      return { contents: fs.readFileSync(resolvedPath, 'utf8') };
    }
    return { error: `File not found: ${resolvedPath}` };
  } catch (error: any) {
    return { error: error.message };
  }
}

export function compileContract() {
  const contractPath = path.resolve(rootDir, 'contracts', 'src', 'PawsAndPicketPassport.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'PawsAndPicketPassport.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  };

  console.log('Compiling PawsAndPicketPassport.sol...');
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    let hasFatal = false;
    for (const error of output.errors) {
      if (error.severity === 'error') {
        hasFatal = true;
        console.error('Compiler error:', error.formattedMessage);
      } else {
        console.warn('Compiler warning:', error.formattedMessage);
      }
    }
    if (hasFatal) {
      throw new Error('Compilation failed with errors.');
    }
  }

  const contract = output.contracts['PawsAndPicketPassport.sol']['PawsAndPicketPassport'];
  const abi = contract.abi;
  const bytecode = '0x' + contract.evm.bytecode.object;

  const outDir = path.resolve(rootDir, 'src', 'contracts');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outArtifact = {
    contractName: 'PawsAndPicketPassport',
    abi,
    bytecode,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.resolve(outDir, 'PawsAndPicketPassport.json'),
    JSON.stringify(outArtifact, null, 2),
    'utf8'
  );

  fs.writeFileSync(
    path.resolve(outDir, 'PawsAndPicketPassportABI.ts'),
    `export const PawsAndPicketPassportABI = ${JSON.stringify(abi, null, 2)} as const;\n`,
    'utf8'
  );

  console.log('Compilation succeeded! Output written to src/contracts/');
  return { abi, bytecode };
}

if (process.argv[1] === __filename) {
  compileContract();
}
