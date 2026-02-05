<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 → 1.0.0
Bump rationale: Initial constitution ratification (MAJOR)

Modified principles: N/A (initial version)
Added sections:
  - I. Test-Driven Development (TDD)
  - II. Type Safety
  - III. Simplicity First
  - IV. Kibo Integration Standards
  - V. Documentation Alignment
  - Technology Stack
  - Development Workflow

Templates requiring updates:
  ✅ plan-template.md - Constitution Check section compatible
  ✅ spec-template.md - Requirements section compatible
  ✅ tasks-template.md - Test phases aligned with TDD principle

Follow-up TODOs: None
-->

# Kibo ONX Fulfillment Adapter Constitution

## Core Principles

### I. Test-Driven Development (TDD) — NON-NEGOTIABLE

TDD is mandatory for all code changes. The Red-Green-Refactor cycle MUST be strictly enforced.

- Tests MUST be written before implementation code
- Tests MUST fail before implementation begins (Red phase)
- Implementation MUST be minimal to pass tests (Green phase)
- Refactoring MUST occur only after tests pass (Refactor phase)
- Test coverage MUST be maintained at or above 80%
- Contract tests MUST validate adapter interface compliance with `@cof-org/mcp`
- Integration tests MUST cover Kibo API interactions

**Rationale**: TDD ensures correctness, prevents regression, and documents expected behavior. The 80% coverage threshold balances thoroughness with pragmatism for adapter code.

### II. Type Safety — NON-NEGOTIABLE

All code MUST be strictly typed. The use of `any` type is prohibited.

- `any` type MUST NOT be used anywhere in the codebase
- `unknown` MUST be used when type is genuinely uncertain, with proper type guards
- All function parameters and return types MUST be explicitly typed
- API responses MUST be validated against defined TypeScript interfaces
- Type guards in `src/utils/type-guards.ts` MUST be used for runtime validation
- Generic types (`<T>`) MUST be used over `any` for flexible type-safe patterns

**Rationale**: Type safety catches errors at compile time, improves IDE support, and serves as living documentation. Kibo API integrations especially benefit from strict typing to prevent runtime failures.

### III. Simplicity First

Prefer the simplest solution that meets requirements. Do not add abstraction layers or patterns without explicit agreement.

- YAGNI (You Aren't Gonna Need It) MUST be applied to all features
- New abstraction layers MUST NOT be added without explicit user approval
- Single Responsibility Principle SHOULD guide component design
- Dependencies MUST be minimized; each addition requires justification
- Code SHOULD be readable without extensive comments
- Patterns like factories, decorators, or proxies MUST be proposed before implementation

**Rationale**: This adapter has a focused purpose—bridging Kibo and COF. Over-engineering increases maintenance burden and obscures the core mapping logic.

### IV. Kibo Integration Standards

All Kibo API interactions MUST align with official Kibo documentation and SDK patterns.

- Use `@kibocommerce/rest-sdk` as the primary Kibo API client
- Consult Kibo docs MCP for API behavior, authentication, and data models
- Map Kibo entities to COF types as defined in `@cof-org/mcp`
- Handle Kibo-specific error codes and translate to `AdapterError` with meaningful codes
- Respect Kibo rate limits and implement appropriate backoff strategies
- Kibo authentication credentials MUST be passed via `ADAPTER_CONFIG`, never hardcoded

**Rationale**: Consistent Kibo integration patterns ensure reliability and maintainability. The SDK provides tested patterns that reduce implementation risk.

### V. Documentation Alignment

Implementation MUST align with project documentation in `docs/` and upstream COF documentation.

- `docs/API.md` MUST reflect current adapter method signatures
- `docs/CONFIGURATION.md` MUST list all configuration options
- New features MUST update relevant documentation before PR merge
- README.md MUST remain accurate for quick-start usage
- Use Context7 MCP for third-party library documentation (axios, Jest, TypeScript)
- Examples in `examples/` MUST be kept runnable and current

**Rationale**: Documentation is part of the deliverable. Users and maintainers depend on accurate docs to integrate and extend the adapter.

## Technology Stack

- **Language**: TypeScript 5.3+ with strict mode enabled
- **Runtime**: Node.js with ES modules (`"type": "module"`)
- **Testing**: Jest 29+ with `ts-jest` and `--experimental-vm-modules`
- **Kibo SDK**: `@kibocommerce/rest-sdk` for API interactions
- **HTTP Client**: axios for supplementary HTTP needs
- **Linting**: ESLint with TypeScript plugin
- **Platform Types**: `@cof-org/mcp` for COF interface contracts

## Development Workflow

### Quality Gates

1. **Pre-commit**: All tests MUST pass (`npm test`)
2. **Pre-commit**: Linting MUST pass (`npm run lint`)
3. **Pre-commit**: TypeScript MUST compile without errors (`npm run build`)
4. **Coverage**: Test coverage MUST meet 80% threshold
5. **Integration**: `npm run test:integration` MUST pass before release

### Code Review Requirements

- PRs MUST include tests for new functionality
- PRs MUST NOT introduce `any` types
- PRs MUST update documentation if API changes
- Constitution compliance MUST be verified in review

## Governance

This constitution supersedes all other development practices for this project. Amendments require:

1. Documentation of proposed change with rationale
2. Review of impact on existing code and templates
3. Version increment per semantic versioning rules
4. Update to this file with Sync Impact Report

All contributors MUST read this constitution before starting work. Violations discovered in review MUST be corrected before merge.

**Version**: 1.0.0 | **Ratified**: 2026-02-04 | **Last Amended**: 2026-02-04
