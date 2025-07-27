import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

const REGISTRY_PATH = join(homedir(), '.firesite', 'registry.json');

/**
 * Get port for a specific service with timeout
 * @param {string} serviceName - Name of the service
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @returns {Promise<number>} Port number
 * @throws {Error} If service not found after timeout
 */
export async function getServicePort(serviceName, timeout = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
      const service = registry.services?.[serviceName];
      
      if (service && service.status === 'running') {
        return service.port;
      }
    } catch (error) {
      // Registry file doesn't exist yet
    }
    
    // Wait 100ms before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Service ${serviceName} not found after ${timeout}ms`);
}

/**
 * Register this service in the registry
 * @param {string} serviceName - Name of this service
 * @param {number} port - Port this service is running on
 * @param {number} pid - Process ID of this service
 * @param {string} healthEndpoint - Health check endpoint (default: '/health')
 */
export function registerService(serviceName, port, pid, healthEndpoint = '/health') {
  const registryDir = dirname(REGISTRY_PATH);
  
  // Ensure directory exists
  if (!existsSync(registryDir)) {
    mkdirSync(registryDir, { recursive: true });
  }
  
  let registry = { services: {} };
  
  // Load existing registry
  try {
    if (existsSync(REGISTRY_PATH)) {
      registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
    }
  } catch (error) {
    // File doesn't exist or is corrupted, use empty registry
  }
  
  // Update registry
  registry.services = registry.services || {};
  registry.services[serviceName] = {
    port,
    status: 'running',
    pid,
    startedAt: new Date().toISOString(),
    healthUrl: `http://localhost:${port}${healthEndpoint}`
  };
  registry.lastUpdated = new Date().toISOString();
  
  // Write registry
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

/**
 * Unregister this service from the registry
 * @param {string} serviceName - Name of this service
 */
export function unregisterService(serviceName) {
  try {
    if (!existsSync(REGISTRY_PATH)) return;
    
    const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
    if (registry.services) {
      delete registry.services[serviceName];
      registry.lastUpdated = new Date().toISOString();
      writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
    }
  } catch (error) {
    console.error('Failed to unregister service:', error);
  }
}

/**
 * Get URL for a service with fallback to production
 * @param {string} serviceName - Name of the service
 * @param {string} fallbackUrl - Production URL to use if service not found locally
 * @param {number} timeout - Timeout for local lookup (default: 2000ms)
 * @returns {Promise<string>} Service URL
 */
export async function getServiceUrl(serviceName, fallbackUrl, timeout = 2000) {
  try {
    const port = await getServicePort(serviceName, timeout);
    return `http://localhost:${port}`;
  } catch (error) {
    // Local service not found, use production URL
    console.warn(`Local ${serviceName} not found, using production endpoint: ${fallbackUrl}`);
    return fallbackUrl;
  }
}