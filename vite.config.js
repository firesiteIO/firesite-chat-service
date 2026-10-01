import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    headers: {
      // Required for WebContainer support
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  plugins: [
    {
      name: 'firesite-service-registry',
      configureServer(server) {
        // Register service with service registry on startup
        server.httpServer?.on('listening', async () => {
          try {
            const { ServiceRegistry } = await import('@firesite/service-registry');
            const port = server.config.server.port || 5173;
            
            await ServiceRegistry.register('chat-service', {
              port: parseInt(port),
              pid: process.pid,
              healthUrl: '/health',
              metadata: {
                service: 'firesite-chat-service',
                version: '1.0.0',
                capabilities: ['streaming', 'chat', 'mcp-proxy', 'export'],
                environment: server.config.mode || 'development'
              }
            });
            
            console.log('✅ Chat service registered with service registry on port', port);
          } catch (error) {
            console.warn('⚠️ Service registry registration failed:', error.message);
          }
        });
        
        // Add health endpoint
        server.middlewares.use('/health', (req, res, next) => {
          if (req.method === 'GET') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'healthy',
              service: 'firesite-chat-service',
              version: '1.0.0',
              timestamp: new Date().toISOString(),
              port: server.config.server.port || 5173,
              capabilities: ['streaming', 'chat', 'mcp-proxy', 'export']
            }));
          } else {
            next();
          }
        });
      }
    }
  ],
  optimizeDeps: {
    exclude: ['@webcontainer/api']
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      },
      include: [
        'src/**/*.js'
      ],
      exclude: [
        'src/**/*.test.js',
        'src/**/*.spec.js',
        'node_modules/**',
        'tests/**'
      ]
    }
  }
});