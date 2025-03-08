// Import test libraries
import '@testing-library/jest-dom';

// Mock global objects that might not be available in the test environment
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation(success => 
    success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      }
    })
  ),
  watchPosition: jest.fn().mockImplementation(success => {
    success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      }
    });
    return 1; // Mock watch ID
  }),
  clearWatch: jest.fn()
};

global.navigator.geolocation = mockGeolocation;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}); 