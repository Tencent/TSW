## HTTPS Example

> Requires Node.js >= 24

### 1. Generate a self-signed certificate

```bash
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
npm run serve
```

### 4. Test

```bash
curl -k https://localhost:8000
```
