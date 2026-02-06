# Multiverse Bazaar

A backend API for the Multiverse Bazaar marketplace application.

## Project Structure

This is a monorepo using npm workspaces with the following packages:

- `packages/api` - Hono-based REST API server
- `packages/shared` - Shared types and utilities

## Prerequisites

- Node.js >= 20.0.0
- npm (comes with Node.js)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the API in development mode:
```bash
npm run api
```

3. Run tests:
```bash
npm test
```

4. Type checking:
```bash
npm run typecheck
```

## Available Scripts

- `npm run api` - Start the API server in development mode
- `npm run build` - Build all packages
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run typecheck` - Type check all packages
- `npm run lint` - Lint all packages (to be configured)

## API Endpoints

- `GET /` - API welcome message
- `GET /health` - Health check endpoint

## Development

The API server runs on port 3000 by default. You can change this by setting the `PORT` environment variable.

```bash
PORT=8080 npm run api
```
