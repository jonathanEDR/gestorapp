#!/usr/bin/env node

/**
 * Script de validación pre-deploy
 * Ejecutar con: node scripts/pre-deploy-check.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Ejecutando validaciones pre-deploy...\n');

const checks = {
  '✅ Vercel.json existe': () => fs.existsSync('vercel.json'),
  '✅ _redirects existe':  () => fs.existsSync('public/_redirects'),
  '✅ Variables de entorno': () => {
    const env = fs.readFileSync('.env.example', 'utf8');
    return env.includes('VITE_CLERK_PUBLISHABLE_KEY') && 
           env.includes('VITE_API_URL');
  },
  '✅ Package.json tiene build script': () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pkg.scripts && pkg.scripts.build;
  },
  '✅ React Router instalado': () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pkg.dependencies && pkg.dependencies['react-router-dom'];
  },
  '✅ Tailwind CSS configurado': () => {
    return fs.existsSync('tailwind.config.js') && 
           fs.existsSync('src/styles/tailwind.css');
  }
};

let passed = 0;
let total = Object.keys(checks).length;

for (const [name, check] of Object.entries(checks)) {
  try {
    if (check()) {
      console.log(name);
      passed++;
    } else {
      console.log(name.replace('✅', '❌'));
    }
  } catch (error) {
    console.log(name.replace('✅', '❌'), '- Error:', error.message);
  }
}

console.log(`\n📊 Resultado: ${passed}/${total} validaciones pasaron`);

if (passed === total) {
  console.log('🎉 ¡Listo para deploy!');
  process.exit(0);
} else {
  console.log('⚠️  Corrige los errores antes del deploy');
  process.exit(1);
}
