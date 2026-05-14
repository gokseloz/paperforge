# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/gokseloz/paperforge/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/gokseloz/paperforge/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/gokseloz/paperforge/releases/tag/v0.1.0
