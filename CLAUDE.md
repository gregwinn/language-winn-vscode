# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

VS Code extension for the Winn programming language. Provides syntax highlighting via a TextMate grammar and inline compiler diagnostics (errors/warnings) on save.

## Build Commands

```bash
npm run compile        # TypeScript → JavaScript (outputs to out/)
npm run watch          # Continuous compilation during development
```

No test infrastructure exists yet. To test, open the project in VS Code and press F5 to launch an Extension Development Host window.

To package: `npx vsce package` (produces a .vsix file).

## Architecture

Three source files in `src/`, one grammar file in `syntaxes/`:

- **extension.ts** — Entry point. Registers save/close event listeners and creates the diagnostic collection. Activates on `onLanguage:winn`.
- **linter.ts** — Spawns `winn compile [file]` via `execFile`, with 300ms debounce and 10s timeout. Kills in-flight processes before starting new ones. Reads compiler path from `winn.compilerPath` config setting.
- **outputParser.ts** — Parses compiler stderr into `WinnDiagnostic[]`. Expected format is blocks starting with `-- Error Title --- file.winn --`, followed by numbered source lines, a caret line (`| ^`), message text, and optional `Hint:` lines. Strips ANSI codes before parsing.
- **syntaxes/winn.tmLanguage.json** — TextMate grammar (`source.winn`). Winn uses `#` line comments, `end`-terminated blocks, `:atoms`, `#{...}` string interpolation, `|>` pipe operator, and `%{` map literals.

## Winn Language Basics

- Comments: `#`
- Blocks terminated by `end` (module, def, do, if, switch, match, try, for, schema)
- Identifiers can end with `!` or `?`
- Keywords include schema DSL (`schema`, `field`, `has_many`, `belongs_to`) and query DSL (`from`, `where`, `order_by`)
- Logical operators are words: `and`, `or`, `not`

## Extension Configuration

Two user-facing settings defined in package.json `contributes.configuration`:
- `winn.compilerPath` (default: `"winn"`) — path to the Winn compiler
- `winn.lintOnSave` (default: `true`) — toggle lint-on-save
