import '@testing-library/jest-dom';
import 'vitest-canvas-mock';

/**
 * AI assisted test files.
 * AI was used to help understand the workings of react-testing-library and vitest.
 * AI was also used to implement stubbing, capturing.
 * AI was used to find certain evaluation methods, like toHaveBeenCalledWith(expect.objectContaining({}))
 */

vi.mock('../src/contexts/WindowSizeContext', () => ({
  useWindowSize: () => ({
      isMobile: false,
      isAboveSm: true,
      isAboveMd: true,
  }),
}));
