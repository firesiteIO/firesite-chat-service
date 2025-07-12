/**
 * Vitest Test Setup
 * Global test configuration and mocks
 */

import { vi } from 'vitest';

// Mock DOM globals that might be missing in jsdom
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock highlight.js for code syntax highlighting tests
vi.mock('highlight.js', () => ({
  default: {
    highlight: vi.fn((code, options) => ({
      value: `<span class="hljs">${code}</span>`
    })),
    highlightElement: vi.fn(),
    getLanguage: vi.fn(() => true)
  }
}));

// Mock DOMPurify for content sanitization tests
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((content) => content),
    isSupported: true
  }
}));

// Mock dom-purify service
vi.mock('/src/services/security/dom-purify.service.js', () => ({
  domPurifyService: {
    sanitize: vi.fn((content) => content),
    isReady: vi.fn(() => true)
  }
}));

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn()
}));

// Global test utilities
global.createMockSSEEvent = (data, type = 'chunk') => ({
  data: JSON.stringify({ content: data }),
  type: type
});

global.createMockDOMElement = (tagName = 'div') => {
  const element = document.createElement(tagName);
  element.appendChild = vi.fn((child) => {
    element.children.push || (element.children = []);
    element.children.push(child);
    return child;
  });
  return element;
};

// Console suppression for cleaner test output
const originalConsole = { ...console };
global.suppressConsole = () => {
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
};

global.restoreConsole = () => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});