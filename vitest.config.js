import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment setup
    environment: 'jsdom', // For DOM testing
    globals: true,        // Enable global test functions (describe, it, expect)
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      threshold: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      },
      // Include only our source files
      include: [
        'src/services/**/*.js'
      ],
      // Exclude test files and certain patterns
      exclude: [
        'src/services/**/*.test.js',
        'src/services/**/*.spec.js',
        'src/services/testing/**/*',
        'node_modules/**',
        // Exclude animation/timing related code for this round
        'src/services/**/streaming/**/*timing*',
        'src/services/**/streaming/**/*animation*',
        'src/services/**/streaming/**/*cursor*'
      ]
    },
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.js',
      'tests/**/*.{test,spec}.js'
    ],
    
    // Test timeout
    testTimeout: 5000,
    
    // Setup files
    setupFiles: ['./tests/setup.js']
  },
  
  // Resolve configuration for ES modules
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});