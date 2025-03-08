import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import fs from 'fs';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the functions directory
const functionsDir = join(__dirname, '../supabase/functions');

// Check if the functions directory exists
if (!fs.existsSync(functionsDir)) {
  console.error('Functions directory not found:', functionsDir);
  process.exit(1);
}

// Get all function directories (excluding _shared and any hidden directories)
const functionDirs = fs.readdirSync(functionsDir)
  .filter(dir => !dir.startsWith('_') && !dir.startsWith('.'))
  .map(dir => join(functionsDir, dir))
  .filter(dir => fs.statSync(dir).isDirectory());

if (functionDirs.length === 0) {
  console.error('No function directories found in:', functionsDir);
  process.exit(1);
}

// Deploy each function
console.log('Deploying Supabase Edge Functions...');

functionDirs.forEach(dir => {
  const functionName = basename(dir);
  console.log(`\nDeploying function: ${functionName}`);
  
  try {
    // Change directory to the function's parent directory
    process.chdir(functionsDir);
    
    // Deploy the function
    execSync(`npx supabase functions deploy ${functionName}`, { stdio: 'inherit' });
    
    console.log(`✅ Function ${functionName} deployed successfully.`);
  } catch (error) {
    console.error(`❌ Failed to deploy function ${functionName}:`, error.message);
  }
});

console.log('\nAll functions deployment completed!'); 