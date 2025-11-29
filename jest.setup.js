// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock @react-pdf/renderer for testing
jest.mock('@react-pdf/renderer', () => ({
  pdf: jest.fn((component) => ({
    toBlob: jest.fn(() => Promise.resolve(new Blob(['mock pdf content'], { type: 'application/pdf' }))),
  })),
  Document: jest.fn(({ children }) => children),
  Page: jest.fn(({ children }) => children),
  Text: jest.fn(({ children }) => children),
  View: jest.fn(({ children }) => children),
  Image: jest.fn(() => null),
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
  Font: {
    register: jest.fn(),
  },
}))
