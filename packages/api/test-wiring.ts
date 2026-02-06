import { setupContainer } from './src/infra/container.js';

async function testWiring() {
  try {
    console.log('Setting up container...');
    const container = setupContainer();
    
    console.log('Testing service resolution...');
    const services = [
      'authService',
      'userService', 
      'projectService',
      'collaboratorService',
      'upvoteService',
      'ideaService',
      'notificationService',
      'searchService',
      'uploadService',
      'auditService',
      'privacyService',
      'karmaService'
    ];
    
    for (const serviceName of services) {
      const service = container.resolve(serviceName);
      console.log(`✓ ${serviceName} resolved successfully`);
    }
    
    console.log('\n✅ All services wired correctly!');
  } catch (error) {
    console.error('❌ Wiring test failed:', error);
    process.exit(1);
  }
}

testWiring();
