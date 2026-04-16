## ESM Example

> Requires Node.js >= 24

This example demonstrates using TSW 3.0 with a pure ESM project (`"type": "module"` in package.json). The entry file and config file both use ESM syntax (`import` / `export default`).

### 1. Install dependencies

```bash
npm install
```

### 2. Start the server

```bash
npm run serve
```

### 3. Test

```bash
# Basic request
curl http://localhost:3000

# Request with upstream fetch
curl http://localhost:3000/api
```
