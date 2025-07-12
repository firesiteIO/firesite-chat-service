/**
 * Sample MMCO (Micro Meta Context Objects) for testing
 * These provide context for AI task execution in the Firesite ecosystem
 */

export const sampleMMCOContexts = {
  // Kanban Development Context
  kanbanDevelopment: {
    taskType: 'development',
    projectContext: {
      techStack: ['JavaScript', 'HTML5', 'CSS3', 'Vite', 'ES Modules'],
      codebase: 'Firesite Chat Service - Revolutionary streaming markdown interface',
      architecture: 'Service-first architecture with event-driven communication',
      frameworks: ['Vanilla JavaScript', 'CSS Grid', 'Flexbox'],
      libraries: ['highlight.js', 'DOMPurify'],
      fileStructure: {
        'src/': {
          'services/': 'Core business logic services',
          'ui/': 'UI components and interfaces',
          'assets/': 'CSS, images, and static assets',
          'core/': 'Core functionality and utilities'
        }
      },
      repositoryUrl: 'https://github.com/firesiteio/firesite-chat-service',
      branchName: 'main',
      environmentVariables: {
        'NODE_ENV': 'development',
        'VITE_DEV_MODE': 'true'
      },
      configuration: {
        buildTool: 'Vite',
        moduleSystem: 'ES Modules',
        testFramework: 'Vitest'
      }
    },
    systemPrompt: 'You are Claude, specialized in developing the Firesite Kanban system. Focus on clean, modular JavaScript code following the established service-first architecture. Prioritize zero re-renders, event-driven design, and seamless integration with the existing streaming chat service.',
    availableTools: [
      {
        toolId: 'file-editor',
        name: 'File Editor',
        description: 'Edit JavaScript, CSS, and HTML files',
        endpoint: '/tools/file-editor',
        permissions: ['read', 'write', 'create'],
        parameters: [
          {
            name: 'filePath',
            type: 'string',
            description: 'Path to the file to edit',
            required: true
          },
          {
            name: 'content',
            type: 'string',
            description: 'New file content',
            required: true
          }
        ]
      },
      {
        toolId: 'git-manager',
        name: 'Git Manager',
        description: 'Git operations for version control',
        endpoint: '/tools/git',
        permissions: ['commit', 'branch', 'merge'],
        parameters: [
          {
            name: 'operation',
            type: 'string',
            description: 'Git operation to perform',
            required: true
          }
        ]
      }
    ],
    credentials: {
      github: 'github-token-ref',
      firebase: 'firebase-config-ref'
    },
    metadata: {
      taskId: 'kanban-dev-001',
      priority: 'high',
      estimatedTime: '2-3 hours',
      dependencies: ['chat-service', 'mcp-integration']
    }
  },

  // Planning Context for Kanban
  kanbanPlanning: {
    taskType: 'planning',
    projectContext: {
      techStack: ['JavaScript', 'CSS3', 'HTML5'],
      codebase: 'Firesite Kanban Board Integration',
      architecture: 'Component-based with drag-and-drop functionality',
      frameworks: ['Native Drag & Drop API', 'CSS Grid'],
      libraries: ['sortable.js', 'date-fns']
    },
    systemPrompt: 'You are Claude, specialized in planning and task breakdown for the Firesite Kanban system. Create detailed, actionable plans using the SMARTED framework. Focus on integration with the existing chat service and MCP Max server.',
    availableTools: [
      {
        toolId: 'smarted-planner',
        name: 'SMARTED Planner',
        description: 'Create SMARTED task breakdowns',
        endpoint: '/tools/smarted',
        permissions: ['create', 'update']
      }
    ],
    metadata: {
      projectPhase: 'design',
      stakeholders: ['developers', 'users', 'product-team'],
      constraints: ['existing-architecture', 'zero-re-renders']
    }
  },

  // Testing Context
  kanbanTesting: {
    taskType: 'testing',
    projectContext: {
      techStack: ['Vitest', 'jsdom', 'JavaScript'],
      testingFrameworks: ['Vitest', 'Testing Library'],
      coverageTarget: 85
    },
    systemPrompt: 'You are Claude, specialized in testing the Firesite Kanban system. Create comprehensive test suites covering unit, integration, and user interaction tests. Focus on drag-and-drop functionality, state management, and chat service integration.',
    availableTools: [
      {
        toolId: 'test-runner',
        name: 'Test Runner',
        description: 'Run and manage test suites',
        endpoint: '/tools/test-runner',
        permissions: ['run', 'debug', 'coverage']
      }
    ]
  },

  // Documentation Context
  kanbanDocumentation: {
    taskType: 'documentation',
    projectContext: {
      audience: ['developers', 'end-users', 'contributors'],
      documentationTypes: ['API docs', 'user guides', 'tutorials']
    },
    systemPrompt: 'You are Claude, specialized in creating documentation for the Firesite Kanban system. Create clear, comprehensive documentation that covers both technical implementation and user experience. Include integration examples with the chat service.',
    availableTools: [
      {
        toolId: 'doc-generator',
        name: 'Documentation Generator',
        description: 'Generate and update documentation',
        endpoint: '/tools/docs',
        permissions: ['create', 'update', 'publish']
      }
    ]
  },

  // Analysis Context
  kanbanAnalysis: {
    taskType: 'analysis',
    projectContext: {
      analysisAreas: ['performance', 'usability', 'accessibility', 'security'],
      benchmarks: ['reaction-time', 'load-time', 'user-satisfaction']
    },
    systemPrompt: 'You are Claude, specialized in analyzing the Firesite Kanban system. Evaluate performance, user experience, code quality, and integration points. Provide actionable recommendations for improvement.',
    availableTools: [
      {
        toolId: 'performance-analyzer',
        name: 'Performance Analyzer',
        description: 'Analyze performance metrics',
        endpoint: '/tools/performance',
        permissions: ['measure', 'report', 'benchmark']
      }
    ]
  }
};

export const createCustomMMCO = (taskType, projectName, customOptions = {}) => {
  const baseContext = {
    taskType,
    projectContext: {
      techStack: ['JavaScript', 'HTML5', 'CSS3'],
      codebase: projectName,
      architecture: 'Service-first architecture',
      ...customOptions.projectContext
    },
    systemPrompt: customOptions.systemPrompt || `You are Claude, specialized in ${taskType} for ${projectName}.`,
    availableTools: customOptions.tools || [],
    metadata: {
      createdAt: new Date().toISOString(),
      customContext: true,
      ...customOptions.metadata
    }
  };

  return baseContext;
};

export default sampleMMCOContexts;