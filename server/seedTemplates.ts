import { readFileSync } from 'fs';
import { storage } from './storage';
import { insertTemplateSchema } from '@shared/schema';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function seedTemplates() {
  try {
    console.log('Starting template seeding...');

    // Load the Meeting → Action template
    const templatePath = path.join(__dirname, 'templates', 'meeting-action-template.json');
    const templateRaw = readFileSync(templatePath, 'utf-8');
    const templateData = JSON.parse(templateRaw);

    // Validate and create the template
    const templateInput = insertTemplateSchema.parse({
      name: templateData.name,
      description: templateData.description,
      category: templateData.category,
      isPublic: templateData.isPublic,
      templateData: templateData.templateData
    });

    // Check if template already exists
    const existingTemplates = await storage.getTemplates();
    const existingTemplate = existingTemplates.find(t => t.name === templateInput.name);

    if (existingTemplate) {
      console.log(`Template "${templateInput.name}" already exists, skipping...`);
      return existingTemplate;
    }

    // Create the template
    const createdTemplate = await storage.createTemplate(templateInput);
    console.log(`✅ Created template: ${createdTemplate.name} (ID: ${createdTemplate.id})`);

    return createdTemplate;

  } catch (error) {
    console.error('❌ Failed to seed templates:', error);
    throw error;
  }
}

export async function seedAllTemplates() {
  console.log('🌱 Seeding all templates...');
  
  try {
    const meetingActionTemplate = await seedTemplates();
    
    console.log('✅ Template seeding completed successfully!');
    console.log('📋 Available templates:');
    console.log(`  - ${meetingActionTemplate.name}`);
    
    return {
      success: true,
      templates: [meetingActionTemplate]
    };
  } catch (error) {
    console.error('❌ Template seeding failed:', error);
    return {
      success: false,
      error: error
    };
  }
}

// Export for use in other modules
export { seedTemplates as seedMeetingActionTemplate };