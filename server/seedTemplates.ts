import { readFileSync } from 'fs';
import { storage } from './storage';
import { insertTemplateSchema } from '@shared/schema';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedSingleTemplate(templateFileName: string) {
  try {
    console.log(`Starting seeding for ${templateFileName}...`);

    // Load the template
    const templatePath = path.join(__dirname, 'templates', templateFileName);
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
    console.error(`❌ Failed to seed template ${templateFileName}:`, error);
    throw error;
  }
}

export async function seedTemplates() {
  try {
    console.log('Starting template seeding...');

    // Seed all templates
    const meetingActionTemplate = await seedSingleTemplate('meeting-action-template.json');
    const invoiceProcessingTemplate = await seedSingleTemplate('invoice-processing-template.json');
    const contentPipelineTemplate = await seedSingleTemplate('content-pipeline-template.json');

    return {
      meetingAction: meetingActionTemplate,
      invoiceProcessing: invoiceProcessingTemplate,
      contentPipeline: contentPipelineTemplate
    };

  } catch (error) {
    console.error('❌ Failed to seed templates:', error);
    throw error;
  }
}

export async function seedAllTemplates() {
  console.log('🌱 Seeding all templates...');
  
  try {
    const seededTemplates = await seedTemplates();
    
    console.log('✅ Template seeding completed successfully!');
    console.log('📋 Available templates:');
    console.log(`  - ${seededTemplates.meetingAction.name}`);
    console.log(`  - ${seededTemplates.invoiceProcessing.name}`);
    console.log(`  - ${seededTemplates.contentPipeline.name}`);
    
    return {
      success: true,
      templates: [
        seededTemplates.meetingAction,
        seededTemplates.invoiceProcessing,
        seededTemplates.contentPipeline
      ]
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
export { 
  seedTemplates as seedAllTemplateFiles,
  seedSingleTemplate
};