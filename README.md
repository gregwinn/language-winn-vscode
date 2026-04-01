# Winn Language for VS Code

Syntax highlighting and compiler diagnostics for the [Winn programming language](https://github.com/gregwinn/winn-lang).

## Features

### Syntax Highlighting

Full TextMate grammar covering all Winn syntax:
- Keywords (`module`, `def`, `end`, `if/else`, `switch`, `match`, `try/rescue`, `fn`, `for`)
- Struct and protocol keywords (`struct`, `protocol`, `impl`)
- String interpolation (`"Hello, #{name}!"`)
- Triple-quoted strings (`"""..."""`)
- Block comments (`#| ... |#`) and line comments (`# ...`)
- Atoms (`:ok`, `:error`)
- Operators (`|>`, `|>=`, `=>`, `<>`, `..`, `==`, etc.)
- Module names, function definitions, function calls
- Maps (`%{key: val}`), tuples, lists
- Block parameters (`do |x, acc| ... end`)

### Diagnostics (Linting)

Runs the Winn compiler on save and shows errors inline:
- Syntax errors with caret position
- Undefined variables
- Semantic warnings
- Transform and codegen errors

Errors appear as red squigglies with messages in the Problems panel.

### Language Features

- Toggle block comments with `Ctrl+Shift+/`
- Auto-close `#|` → `|#`
- Folding for `module`, `def`, `struct`, `protocol`, `impl`, `do`, `if`, `switch`, `try`, `for`, `fn`
- Smart indentation

## Requirements

- The `winn` compiler must be installed and on your PATH
- Install via Homebrew: `brew tap gregwinn/winn && brew install winn`

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `winn.compilerPath` | `"winn"` | Path to the winn compiler |
| `winn.lintOnSave` | `true` | Run compiler on save for diagnostics |

## File Association

The extension automatically activates for `.winn` files.
