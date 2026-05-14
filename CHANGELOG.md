# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-05-14

### Fixed

- `npm test` script no longer relies on shell glob expansion (failed on CI Ubuntu shell). Uses an explicit `test/*.test.js` pattern that Node's `--test` runner expands itself.

## [0.2.0] - 2026-05-14

### Added

- Comparison helpers: `ne`, `gt`, `gte`, `lt`, `lte` (block).
- Boolean composition helpers: `and`, `or`, `not` (block).
- Math helpers: `add`, `sub`, `mul`, `div`, `sum` (`sum` supports key and key-pair forms for line totals).
- Formatting helpers: `number` (thousand separators, fixed digits) and `percent`.
- Fallback / string helpers: `default` and `truncate` (ellipsis-safe).
- Unit tests for every built-in helper using `node:test` (no test dependencies added).
- `npm run test:unit` and `npm run test:smoke` scripts; `npm test` now runs both.

## [0.1.4] - 2026-05-14

### Changed

- Switch release workflow to npm OIDC trusted publisher (no token, no 2FA prompt).

## [0.1.3] - 2026-05-14

### Changed

- Retrigger release pipeline with a 2FA-bypass granular npm token.

## [0.1.2] - 2026-05-14

### Changed

- Verify automated release pipeline end-to-end via GitHub Actions + npm token.

## [0.1.1] - 2026-05-14

### Changed

- Verify automated release pipeline (no functional changes).

## [0.1.0] - 2026-05-14

### Added

- Recipe-driven Handlebars composition (`main.hbs` + optional `recipe.json` + `partials/`).
- Per-template `theme.json` with runtime override merging.
- Public API: `render`, `compose`, `htmlToPdf`, `inlineLocalAssets`, `registerHelper`.
- CLI `paperforge` with `--templates`, `--data` (stdin supported), `--theme`, `--out`, `--format`, `--landscape`, `--margin`.
- Built-in Handlebars helpers: `eq`, `formatDate`, `currency`, `json`, `lowercase`, `uppercase`, `capitalize`.
- Local asset inlining: `<img src>` and CSS `url(...)` relative references rewritten as `data:` URIs.
- Three working examples: `invoice` (no recipe), `report` (recipe + partials), `resume` (theme-heavy).
- CI workflow that renders all examples on every push.

[Unreleased]: https://github.com/gokseloz/paperforge/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/gokseloz/paperforge/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/gokseloz/paperforge/compare/v0.1.4...v0.2.0
[0.1.4]: https://github.com/gokseloz/paperforge/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/gokseloz/paperforge/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/gokseloz/paperforge/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/gokseloz/paperforge/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/gokseloz/paperforge/releases/tag/v0.1.0
