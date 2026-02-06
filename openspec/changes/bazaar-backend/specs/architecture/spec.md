## ADDED Requirements

### Requirement: Vertical Slice Architecture
Code is organized by feature domain, not technical layer.

#### Scenario: Feature module structure
- **WHEN** a new feature is added (e.g., projects)
- **THEN** all related code lives in one directory: routes, service, repository, types, tests
- **THEN** the module has a single entry point (index.ts) exporting its public API
- **THEN** internal implementation details are not exported

#### Scenario: Module independence
- **WHEN** working on the projects module
- **THEN** changes do not require modifications to ideas, users, or other modules
- **THEN** the module can be tested in isolation
- **THEN** the module has its own test file(s) co-located with the code

#### Scenario: Shared code location
- **WHEN** code is genuinely shared across modules
- **THEN** it lives in a `shared/` or `common/` directory
- **THEN** shared code is minimal and stable (utilities, base types, middleware)
- **THEN** feature-specific code never lives in shared/

### Requirement: Explicit Module Contracts
Modules communicate through typed interfaces, not implementation details.

#### Scenario: Module exports
- **WHEN** a module exposes functionality to other modules
- **THEN** it exports types/interfaces, not concrete implementations
- **THEN** the exported API is documented with JSDoc comments
- **THEN** the exported API is versioned (breaking changes require major version)

#### Scenario: Cross-module dependencies
- **WHEN** module A needs functionality from module B
- **THEN** A depends on B's exported interface, not internal implementation
- **THEN** the dependency is injected, not imported directly
- **THEN** the dependency is mockable in tests

### Requirement: Dependency Injection
Dependencies are injected, not hard-coded.

#### Scenario: Service creation
- **WHEN** a service is created
- **THEN** its dependencies (database, other services, config) are passed as constructor parameters
- **THEN** the service does not import database clients or other services directly

#### Scenario: Route handler dependencies
- **WHEN** a route handler needs services
- **THEN** services are accessed via context (c.get('projectService'))
- **THEN** services are registered in a central composition root

#### Scenario: Test isolation
- **WHEN** testing a service
- **THEN** all dependencies can be replaced with mocks/stubs
- **THEN** no real database, network, or file system calls are made in unit tests

### Requirement: Repository Pattern
Database access is abstracted behind repository interfaces.

#### Scenario: Repository interface
- **WHEN** a module needs database access
- **THEN** it defines a repository interface (e.g., IProjectRepository)
- **THEN** the interface exposes domain operations, not raw SQL or ORM methods
- **THEN** the implementation uses Prisma but the interface is ORM-agnostic

#### Scenario: Repository testability
- **WHEN** testing business logic
- **THEN** the repository is mocked
- **THEN** tests verify correct repository method calls
- **THEN** tests do not depend on database state

#### Scenario: Transaction handling
- **WHEN** a business operation requires multiple database writes
- **THEN** the repository supports transaction passing
- **THEN** the service orchestrates the transaction, repository executes within it

### Requirement: Result Types for Error Handling
Functions return Result types instead of throwing exceptions.

#### Scenario: Service method returns
- **WHEN** a service method can fail
- **THEN** it returns `Result<T, E>` (success or typed error)
- **THEN** the error type is specific and actionable (NotFoundError, ValidationError, etc.)
- **THEN** callers handle both success and error cases explicitly

#### Scenario: No untyped throws
- **WHEN** an error occurs in business logic
- **THEN** it is returned as a typed error, not thrown
- **THEN** exceptions are only used for truly unexpected errors (bugs, infra failures)

#### Scenario: Error propagation
- **WHEN** a lower layer returns an error
- **THEN** the caller either handles it or returns it (possibly wrapped)
- **THEN** error context is preserved (what operation failed, with what inputs)

### Requirement: Small, Focused Functions
Functions do one thing and are easy to understand.

#### Scenario: Function size
- **WHEN** writing a function
- **THEN** it fits on one screen (~30 lines max)
- **THEN** it has a single responsibility
- **THEN** complex logic is extracted to named helper functions

#### Scenario: Function naming
- **WHEN** naming a function
- **THEN** the name describes what it does (verb + noun)
- **THEN** the name is specific enough to distinguish from similar functions
- **THEN** no abbreviations except widely understood ones (id, url, etc.)

#### Scenario: Pure functions preferred
- **WHEN** a function can be pure (no side effects)
- **THEN** it is written as pure
- **THEN** side effects are isolated to specific "impure" functions
- **THEN** pure functions are trivially testable

### Requirement: Type Safety Throughout
The codebase leverages TypeScript's type system fully.

#### Scenario: No any types
- **WHEN** writing TypeScript code
- **THEN** `any` is not used except in rare, documented cases
- **THEN** `unknown` is used when type is truly unknown, with proper narrowing

#### Scenario: Strict TypeScript config
- **WHEN** TypeScript is configured
- **THEN** strict mode is enabled
- **THEN** noImplicitAny, strictNullChecks, strictFunctionTypes are all true

#### Scenario: Zod for runtime validation
- **WHEN** external data enters the system (API requests, env vars)
- **THEN** it is validated with Zod schemas
- **THEN** the Zod schema generates the TypeScript type (single source of truth)

#### Scenario: Shared types package
- **WHEN** types are needed by multiple packages (api, web, mobile)
- **THEN** they are defined in packages/shared
- **THEN** API request/response types are shared between backend and clients

### Requirement: Comprehensive Test Coverage
Every feature has tests that run fast and catch regressions.

#### Scenario: Test pyramid
- **WHEN** tests are written
- **THEN** the majority are unit tests (fast, isolated)
- **THEN** integration tests cover module boundaries and database interactions
- **THEN** a small number of E2E tests cover critical user flows

#### Scenario: Unit test characteristics
- **WHEN** writing a unit test
- **THEN** it tests one behavior
- **THEN** it runs in <100ms
- **THEN** it has no external dependencies (DB, network, filesystem)
- **THEN** it uses descriptive test names ("should return error when user not found")

#### Scenario: Integration test characteristics
- **WHEN** writing an integration test
- **THEN** it tests module interactions or database behavior
- **THEN** it uses a test database (reset between tests)
- **THEN** it runs in <1 second

#### Scenario: Test co-location
- **WHEN** tests are organized
- **THEN** unit tests are co-located with source (foo.ts → foo.test.ts)
- **THEN** integration tests are in __tests__ or tests/ directories
- **THEN** test utilities are in test/helpers or similar

### Requirement: Continuous Integration Gates
All changes pass automated checks before merge.

#### Scenario: CI pipeline stages
- **WHEN** a PR is opened
- **THEN** CI runs: type check, lint, unit tests, integration tests
- **THEN** all stages must pass before merge is allowed
- **THEN** pipeline runs in <5 minutes for fast feedback

#### Scenario: Test coverage requirements
- **WHEN** CI runs
- **THEN** code coverage is measured
- **THEN** new code must have >80% coverage
- **THEN** coverage reports are visible in PR

#### Scenario: Dependency security
- **WHEN** CI runs
- **THEN** npm audit (or equivalent) runs
- **THEN** high/critical vulnerabilities fail the build
- **THEN** Dependabot or similar is configured for updates

### Requirement: Database Migration Safety
Schema changes are safe, reversible, and non-breaking.

#### Scenario: Migration reversibility
- **WHEN** a migration is created
- **THEN** it has both "up" and "down" functions
- **THEN** down completely reverses up
- **THEN** migrations are tested in both directions

#### Scenario: Non-breaking migrations
- **WHEN** a schema change is needed
- **THEN** it is done in multiple steps if breaking (add column → backfill → remove old)
- **THEN** the application handles both old and new schema during transition
- **THEN** column drops are delayed until code no longer references them

#### Scenario: Migration in CI
- **WHEN** CI runs
- **THEN** migrations are applied to test database
- **THEN** migration errors fail the build
- **THEN** seed data is applied for consistent test state

### Requirement: Configuration Management
Configuration is external, validated, and typed.

#### Scenario: Environment variables
- **WHEN** configuration is needed
- **THEN** it comes from environment variables
- **THEN** env vars are validated at startup with Zod
- **THEN** missing required config fails fast with clear error message

#### Scenario: Config typing
- **WHEN** config is accessed
- **THEN** it is accessed through a typed Config object
- **THEN** secrets are marked as such and not logged

#### Scenario: Config per environment
- **WHEN** different environments exist (dev, test, prod)
- **THEN** each has its own .env file (not committed) or environment config
- **THEN** .env.example documents all required variables

### Requirement: Logging and Observability
The system is observable and debuggable.

#### Scenario: Structured logging
- **WHEN** logging
- **THEN** logs are structured JSON (not plain text)
- **THEN** logs include: timestamp, level, message, context (requestId, userId)
- **THEN** sensitive data is never logged (passwords, tokens, PII)

#### Scenario: Request tracing
- **WHEN** a request is processed
- **THEN** a unique requestId is assigned
- **THEN** all logs for that request include the requestId
- **THEN** the requestId is returned in error responses for debugging

#### Scenario: Error logging
- **WHEN** an error occurs
- **THEN** it is logged with stack trace and context
- **THEN** expected errors (validation, not found) are logged at info/warn level
- **THEN** unexpected errors (bugs) are logged at error level

### Requirement: API Stability
API changes don't break existing clients.

#### Scenario: Versioned API
- **WHEN** the API is designed
- **THEN** routes are prefixed with version (/api/v1/...)
- **THEN** breaking changes require a new version
- **THEN** old versions are maintained for a deprecation period

#### Scenario: Additive changes only
- **WHEN** modifying an API response
- **THEN** new fields can be added (non-breaking)
- **THEN** existing fields are not removed or renamed
- **THEN** field types are not changed

#### Scenario: Response envelope
- **WHEN** an API responds
- **THEN** success responses have consistent shape: { data: T }
- **THEN** error responses have consistent shape: { error: { code, message, details? } }
- **THEN** clients can rely on these shapes

### Requirement: Graceful Degradation
Failures are contained and handled gracefully.

#### Scenario: Partial failure handling
- **WHEN** a non-critical operation fails (e.g., sending notification)
- **THEN** the primary operation still succeeds
- **THEN** the failure is logged
- **THEN** retry or fallback is attempted if appropriate

#### Scenario: Circuit breaker pattern
- **WHEN** an external dependency is failing
- **THEN** repeated failures trigger a circuit breaker
- **THEN** subsequent calls fail fast without hitting the dependency
- **THEN** the circuit resets after a cool-down period

#### Scenario: Timeout enforcement
- **WHEN** calling external services or database
- **THEN** timeouts are configured
- **THEN** slow operations are terminated
- **THEN** the caller receives a clear timeout error

### Requirement: Feature Flags
New features can be toggled without deployment.

#### Scenario: Feature flag infrastructure
- **WHEN** a new feature is risky or large
- **THEN** it is wrapped in a feature flag
- **THEN** the flag can be toggled via config/environment
- **THEN** the flag defaults to off in production until validated

#### Scenario: Flag cleanup
- **WHEN** a feature is fully rolled out
- **THEN** the feature flag is removed
- **THEN** flag removal is tracked as tech debt

### Requirement: Documentation
Code and APIs are documented for future maintainers.

#### Scenario: Code documentation
- **WHEN** writing public functions/classes
- **THEN** JSDoc comments describe purpose, parameters, return value
- **THEN** complex logic has inline comments explaining "why" not "what"
- **THEN** non-obvious design decisions are documented

#### Scenario: API documentation
- **WHEN** APIs are created
- **THEN** OpenAPI/Swagger spec is generated or maintained
- **THEN** each endpoint has description, parameters, response types, error codes
- **THEN** documentation is kept in sync with implementation

#### Scenario: Architecture documentation
- **WHEN** significant architectural decisions are made
- **THEN** they are documented in ADRs (Architecture Decision Records)
- **THEN** ADRs explain context, decision, and consequences
- **THEN** ADRs are stored in the repository (docs/adr/)
