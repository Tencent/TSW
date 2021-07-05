## How to run demo

### 1. Generate a self-signed certificate (key.pem and cert.pem)
```bash
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
```

### 2. Install Npm
```bash
yarn
// npm i
```

### 3. Start the server
```
npm run serve
```