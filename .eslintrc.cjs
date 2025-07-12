module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: [],
  rules: {
    // General code quality rules aligned with CODERULES.md
    'no-console': 'off', // Allow console statements for debugging
    'no-unused-vars': 'error',
    'no-var': 'error', // Enforce let/const over var
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',

    // ES6+ features enforcement
    'object-shorthand': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',

    // Async/await preferences
    'prefer-promise-reject-errors': 'error',
    'no-async-promise-executor': 'error',
    'require-await': 'warn',

    // Import/Export rules
    'no-duplicate-imports': 'error',

    // Function and variable naming
    'camelcase': ['error', {
      properties: 'never',
      ignoreDestructuring: false,
      ignoreImports: false,
      ignoreGlobals: false,
    }],

    // Security and best practices
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-script-url': 'error',
    'no-undef': 'error',
    'no-global-assign': 'error',
    'no-implicit-globals': 'error',
  }
};