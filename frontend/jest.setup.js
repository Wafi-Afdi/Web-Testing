// jest.setup.js
import '@testing-library/jest-dom'

// Mock fetch API
global.fetch = jest.fn();

// Mock window.matchMedia (jika ada komponen yang menggunakannya, misal dari library UI)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});