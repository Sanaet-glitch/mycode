import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the templates directory exists
const templatesDir = join(__dirname, '../public/templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Create user import template
function createUserImportTemplate() {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Create sample data
  const data = [
    { email: "student@institution.edu", fullName: "Student Name", role: "student" },
    { email: "lecturer@institution.edu", fullName: "Lecturer Name", role: "lecturer" },
    { email: "admin@institution.edu", fullName: "Admin Name", role: "admin" }
  ];

  // Convert to worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Users");

  // Write to file
  const outputPath = join(templatesDir, 'user_import_template.xlsx');
  XLSX.writeFile(wb, outputPath);
  
  console.log(`User import template created: ${outputPath}`);
}

// Generate all templates
function generateTemplates() {
  console.log('Generating application templates...');
  createUserImportTemplate();
  console.log('Templates generation complete!');
}

// Run if called directly (node scripts/generate-templates.js)
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTemplates();
}

// Export for use in other modules
export { generateTemplates, createUserImportTemplate }; 