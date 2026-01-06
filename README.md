# Design Tokens CLI

A CLI tool that transforms design tokens from JSON to CSS variables using [Style Dictionary](https://amzn.github.io/style-dictionary/).

## Installation

```bash
# Install from GitHub Package Registry
npm install @anthropic/design-tokens

# Or install globally
npm install -g @anthropic/design-tokens
```

### Install from GitHub directly

```bash
npm install github:anthropic/design-tokens
```

## Usage

```bash
# Basic usage (outputs to ~/Downloads)
design-tokens path/to/tokens.zip

# Specify output directory
design-tokens path/to/tokens.zip --out ./output
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --out <dir>` | Output directory for CSS files | `~/Downloads` |
| `-V, --version` | Output version number | |
| `-h, --help` | Display help | |

## File Naming Conventions

The tool uses file naming conventions to determine how each token file should be processed:

| Pattern | CSS Selector | Output |
|---------|--------------|--------|
| `*.ref.inp.json` | N/A | No output (reference only) |
| `*.theme.inp.json` | `[data-mantine-color-scheme='<name>']` | Yes |
| `*.inp.json` | `:root` | Yes |

### Examples

- `primitive.ref.inp.json` → Loaded for reference resolution, no CSS output
- `dark.theme.inp.json` → `dark.vars.gen.css` with `[data-mantine-color-scheme='dark']` selector
- `light.theme.inp.json` → `light.vars.gen.css` with `[data-mantine-color-scheme='light']` selector
- `core.inp.json` → `core.vars.gen.css` with `:root` selector

## Token Format

Token files should follow the [Design Tokens Community Group](https://tr.designtokens.org/format/) format:

```json
{
  "color": {
    "primary": {
      "$type": "color",
      "$value": "#60a882"
    }
  }
}
```

### Token References

Tokens can reference other tokens using curly brace syntax:

```json
{
  "button": {
    "background": {
      "$type": "color",
      "$value": "{color.primary}"
    }
  }
}
```

References are preserved as CSS `var()` calls in the output:

```css
:root {
  --color-primary: #60a882;
  --button-background: var(--color-primary);
}
```

## Transformation Rules

1. **Spaces → Dashes**: `Deep Sage` becomes `deep-sage`
2. **Preserve Dashes**: `text-size` stays `text-size`
3. **Lowercase**: All keys are lowercased
4. **References**: Preserved as `var()` calls

## Output Example

**Input** (`core.inp.json`):
```json
{
  "mantine": {
    "primary": {
      "color": {
        "0": { "$type": "color", "$value": "{color.Sage.0}" }
      }
    }
  }
}
```

**Output** (`core.vars.gen.css`):
```css
:root {
  --mantine-primary-color-0: var(--color-sage-0);
}
```

## Zip File Structure

The zip file should contain token JSON files organized in folders:

```
tokens.zip
├── Primitives/
│   └── primitive.ref.inp.json
├── UI Core/
│   └── core.inp.json
└── UI Themes/
    ├── dark.theme.inp.json
    └── light.theme.inp.json
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
npm run dev -- path/to/tokens.zip --out ./output
```

## License

MIT

