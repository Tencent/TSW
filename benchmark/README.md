## How to run benchmark

### 1. Install wrk
```
// macOS
brew install wrk
```
### 2. Install Npm
```
cd benchmark && npm i
```
### 3. Check if dist exists
```
// build if necessary
npm run build
```
### 4. Run the job
```
npm run benchmark
```