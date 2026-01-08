const fs = require('fs');
const path = require('path');

// The Modular Architecture for MatriBandhob
const structure = [
  'src/features/auth/components',
  'src/features/auth/hooks',
  'src/features/auth/types',
  
  'src/features/sos/components', // [cite: 97] Emergency SOS
  'src/features/sos/logic',
  
  'src/features/chat/components', // [cite: 101] Matri-AI
  'src/features/chat/api',
  
  'src/features/finance/components', // [cite: 94] Mayer Bank
  'src/features/finance/logic',
  
  'src/features/maps/components', // [cite: 107] Live Map
  'src/features/maps/data',

  'src/features/hardware/logic', // [cite: 72] Smart Ring Integration

  'src/components/ui',      // Reusable atoms (Buttons, Inputs)
  'src/components/layout',  // Header, Sidebar
  'src/lib',                // Firebase config, Utils
  'src/services',           // API calls
  'src/types',              // Global TS types
];

console.log("🚀 Initializing MatriBandhob Architecture...");

structure.forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  }
});

// Create a basic utils file for Tailwind
const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

fs.writeFileSync(path.join(process.cwd(), 'src/lib/utils.ts'), utilsContent);
console.log("✅ Created: src/lib/utils.ts (Tailwind Helper)");

console.log("\n🎉 Setup Complete! You are ready to code.");