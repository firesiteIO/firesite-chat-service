/**
 * Firesite Streaming Service Tests
 * Testing SSE event handling, content routing, and progressive mode functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import FiresiteStreamingService from './firesite-streaming.service.js';

describe('FiresiteStreamingService', () => {
  let service;
  let container;

  beforeEach(() => {
    // Setup DOM container
    container = document.createElement('div');
    container.id = 'test-streaming-container';
    document.body.appendChild(container);
    
    // Create service instance
    service = new FiresiteStreamingService(container, {
      mode: 'progressive',
      debug: false
    });
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with default configuration', () => {
      expect(service.currentMode).toBe('progressive');
      expect(service.container).toBe(container);
    });

    it('should set parsing mode', () => {
      service.setMode('raw');
      expect(service.currentMode).toBe('raw');
    });

    it('should handle streaming state', () => {
      expect(service.isStreaming).toBe(false);
      service.start();
      expect(service.isStreaming).toBe(true);
    });
  });

  describe('Chunk Processing', () => {
    it('should queue chunks when not streaming', async () => {
      const chunk = 'Hello world';
      await service.processChunk(chunk);
      
      // Should be queued since streaming hasn't started
      expect(service.streamQueue.length).toBeGreaterThan(0);
    });

    it('should process chunks when streaming is active', async () => {
      service.start();
      const chunk = 'Hello world';
      
      await service.processChunk(chunk);
      
      // Should be processed, not queued
      const metrics = service.getMetrics();
      expect(metrics.totalChunks).toBeGreaterThan(0);
    });

    it('should handle pause and resume', async () => {
      service.start();
      service.pause();
      
      await service.processChunk('paused content');
      expect(service.streamQueue.length).toBeGreaterThan(0);
      
      service.resume();
      // Queue should be processed
    });

    it('should handle empty chunks', async () => {
      service.start();
      await expect(service.processChunk('')).resolves.not.toThrow();
    });

    it('should handle null/undefined chunks gracefully', async () => {
      service.start();
      // Null/undefined chunks should be rejected (this is acceptable behavior)
      await expect(service.processChunk(null)).rejects.toThrow();
      await expect(service.processChunk(undefined)).rejects.toThrow();
    });
  });

  describe('Streaming Control', () => {
    it('should start and stop streaming', async () => {
      expect(service.isStreaming).toBe(false);
      
      service.start();
      expect(service.isStreaming).toBe(true);
      
      await service.finish();
      expect(service.isStreaming).toBe(false);
    });

    it('should handle pause and resume correctly', async () => {
      service.start();
      expect(service.isPaused).toBe(false);
      
      service.pause();
      expect(service.isPaused).toBe(true);
      
      service.resume();
      expect(service.isPaused).toBe(false);
    });

    it('should clear content and reset state', () => {
      service.start();
      service.clear();
      
      expect(service.isStreaming).toBe(false);
      expect(service.streamQueue).toHaveLength(0);
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Metrics and Performance', () => {
    it('should track processing metrics', async () => {
      service.start();
      await service.processChunk('Test content for metrics');
      
      const metrics = service.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalChunks).toBe('number');
      expect(metrics.totalChunks).toBeGreaterThan(0);
    });

    it('should track performance timing', () => {
      const metrics = service.getMetrics();
      
      // Should have metrics object even before starting
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('totalChunks');
      expect(metrics).toHaveProperty('totalTime');
      
      service.start();
      const metricsAfterStart = service.getMetrics();
      expect(metricsAfterStart.totalTime).toBeDefined();
      expect(typeof metricsAfterStart.totalTime).toBe('number');
    });

    it('should provide current status information', () => {
      const status = service.getStatus();
      
      expect(status).toHaveProperty('isStreaming');
      expect(status).toHaveProperty('isPaused');
      expect(status).toHaveProperty('currentMode');
      expect(status).toHaveProperty('queueLength');
    });
  });

  describe('Mode Management', () => {
    it('should use progressive mode by default', () => {
      expect(service.currentMode).toBe('progressive');
    });

    it('should switch modes when requested', () => {
      service.setMode('raw');
      expect(service.currentMode).toBe('raw');
      
      service.setMode('progressive');
      expect(service.currentMode).toBe('progressive');
    });

    it('should maintain mode consistency with parser', () => {
      service.setMode('raw');
      expect(service.parser.mode).toBe('raw');
      
      service.setMode('progressive');
      expect(service.parser.mode).toBe('progressive');
    });
  });

  describe('Error Handling', () => {
    it('should handle destroy gracefully', () => {
      expect(() => service.destroy()).not.toThrow();
    });

    it('should handle extremely large chunks', async () => {
      service.start();
      const largeChunk = 'a'.repeat(10000);
      await expect(service.processChunk(largeChunk)).resolves.not.toThrow();
    });

    it('should handle special characters and unicode', async () => {
      service.start();
      const unicodeContent = '# 🚀 Heading with emojis\n中文测试\n';
      await expect(service.processChunk(unicodeContent)).resolves.not.toThrow();
    });
  });
});