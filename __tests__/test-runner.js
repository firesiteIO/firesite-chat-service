/**
 * Test Runner for Firesite Chat Service
 * Comprehensive test suite for context integration and model selection
 */

import { readdir } from 'fs/promises';
import { join } from 'path';

const TEST_SUITES = {
  services: [
    'context-manager.test.js',
    'chat-service-context.test.js',
    'model-selection.test.js'
  ],
  components: [
    'settings-panel.test.js'
  ],
  integration: [
    'context-flow.test.js'
  ]
};

/**
 * Test Suite Summary
 */
export function getTestSuiteSummary() {
  return {
    total: Object.values(TEST_SUITES).flat().length,
    breakdown: {
      'Service Tests': TEST_SUITES.services.length,
      'Component Tests': TEST_SUITES.components.length,
      'Integration Tests': TEST_SUITES.integration.length
    },
    coverage: {
      target: '95%',
      areas: [
        'ContextManager service (MMCO, UACP, PACP management)',
        'ChatService context integration',
        'Settings Panel UI component',
        'Model selection functionality',
        'Complete context flow (Settings → Context → Chat → MCP)',
        'Persistence and error handling',
        'Real-world usage scenarios'
      ]
    }
  };
}

/**
 * Generate test coverage report
 */
export async function generateCoverageReport() {
  const summary = getTestSuiteSummary();
  
  console.log('\n🧪 Firesite Chat Service Test Suite');
  console.log('=====================================');
  console.log(`📊 Total Test Files: ${summary.total}`);
  console.log('\n📁 Test Categories:');
  
  Object.entries(summary.breakdown).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} files`);
  });
  
  console.log('\n🎯 Coverage Areas:');
  summary.coverage.areas.forEach(area => {
    console.log(`   ✓ ${area}`);
  });
  
  console.log(`\n🏆 Target Coverage: ${summary.coverage.target}`);
  console.log('\n🚀 To run tests:');
  console.log('   npm run test          # Run all tests');
  console.log('   npm run test:watch    # Watch mode');
  console.log('   npm run test:coverage # Coverage report');
  console.log('   npm run test:ui       # UI mode');
  
  return summary;
}

// Export test configuration for Vitest
export const testConfig = {
  testFiles: TEST_SUITES,
  coverageThreshold: 95,
  testEnvironment: 'jsdom',
  setupFiles: ['./tests/setup.js']
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateCoverageReport();
}