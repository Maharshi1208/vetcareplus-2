import '@testing-library/jest-dom/vitest';
import 'whatwg-fetch';

import { setupServer } from 'msw/node';
import { handlers } from './server/handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
