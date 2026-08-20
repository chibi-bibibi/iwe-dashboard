const fs = require('fs');
const path = require('path');

const root = process.cwd();
const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

function walk(dir) {
  let results = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === '.next') continue;
      results = results.concat(walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function isSourceFile(f) {
  return exts.includes(path.extname(f)) && !/\.d\.ts$/.test(f);
}

const allFiles = walk(root).filter(isSourceFile);
const relFiles = allFiles.map(f => path.relative(root, f).replace(/\\/g, '/'));
const importsMap = new Map();
for (const f of relFiles) importsMap.set(f, new Set());

const importRegex = /(?:import\s+(?:[^'";]+)\s+from\s+|import\(|require\(|require\s*\()?["'`](.+?)["'`]/g;

for (const f of relFiles) {
  const abs = path.join(root, f);
  const src = fs.readFileSync(abs, 'utf8');
  let m;
  while ((m = importRegex.exec(src))) {
    const imp = m[1];
    if (imp.startsWith('.') || imp.startsWith('/')) {
      // resolve relative
      const basedir = path.dirname(abs);
      const resolvedCandidates = [];
      const p1 = path.resolve(basedir, imp);
      // try with extensions and index
      for (const ex of exts) {
        resolvedCandidates.push(p1 + ex);
      }
      for (const ex of exts) {
        resolvedCandidates.push(path.join(p1, 'index' + ex));
      }
      // also as provided (if has extension)
      resolvedCandidates.push(p1);
      for (const cand of resolvedCandidates) {
        const rel = path.relative(root, cand).replace(/\\/g, '/');
        if (importsMap.has(rel)) {
          importsMap.get(rel).add(f);
          break;
        }
      }
    } else {
      // module import, ignore
    }
  }
}

// files considered entry points (allowlist)
const allowlist = new Set([
  'next.config.ts',
  'package.json',
]);

// mark server entry points like app/page.tsx and layout.tsx as used
for (const f of relFiles) {
  if (/app\/(.*)page\.(tsx|ts|jsx|js)$/.test(f) || /layout\.(tsx|ts|jsx|js)$/.test(path.basename(f))) {
    importsMap.get(f) && importsMap.get(f).add('<ENTRY>');
  }
}

const orphans = [];
for (const [f, s] of importsMap.entries()) {
  if (s.size === 0 && !allowlist.has(path.basename(f))) {
    orphans.push(f);
  }
}

console.log('Found', orphans.length, 'candidate unused source files (dry-run).');
for (const o of orphans) console.log(o);

// write to file
fs.writeFileSync(path.join(root, 'scripts', 'orphan-report.txt'), ['Found ' + orphans.length + ' candidate unused files (dry-run).', ...orphans].join('\n'));
console.log('\nReport written to scripts/orphan-report.txt');
