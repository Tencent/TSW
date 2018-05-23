
## Introduction

Tencent Server side Web(TSW) is a Node.js infrastructure which is designed for improving the efficiency of locating problems, providing multiple functions for front-end developers: online dyeing/packet capture, holographic logging and abnormity discovery. TSW, focusing on the operation and maintenance of businesses, is suitable for web and mobile applications based on http or websocket protocols. It can be readily integrated with existing systems.

![tsw](./static/resource/structure_en.png)

#### Online dyeing/packet capture

TSW supports packet capture based on user granularity.

- Dye labelled user by users' feature IDs
- Collect packets within corresponding requests' lifecycles for dyed users.
- Provid functions to view and download captured packets.
- Support Fiddler(windows), Charles(mac) and HAR format.

#### Holographic logging

TSW provides powerful logging abilities for developers to locate problems quickly.

- Record packets within requests' lifecycles holographically in the form of log flow.
- Aggregate log flows based on user granularity.
- View log flows by user features. Help analyzing and solving problems efficiently.

#### Abnormity discovery

- Monitor preset indicators in real time
- Push alarms for code exceptions

## Requirement
- OS: Windows/Mac/Linux
- Node.js: 8.0.0+

## Getting started

- Before installing, [download and install Node.js](https://nodejs.org/en/download/). Node.js 8.0.0 or higher is required.

- Clone the repo: `git clone https://github.com/Tencent/TSW.git`

- Enter the TSW: `cd TSW`

- NPM : `npm install --no-optional`

- Config ``TSW/conf/config.js``
    ```js
    this.httpAddress = '0.0.0.0'

    this.httpPort = 80;
    ```

- Run `node index.js` to start Node.js server

- Open `http://127.0.0.1/` in your browser.


## Documentation

- More Tutorials [https://tswjs.org/guide/index](https://tswjs.org/guide/index)

- Manual [https://tswjs.org/doc/api/index](https://tswjs.org/doc/api/index)

## Supporting facilities

- TSW Open Platform [https://tswjs.org](https://tswjs.org)

## Contributing

Find a bug or have a feature request? Please read the [issues](https://github.com/Tencent/TSW/issues) guidelines and search for existing and closed issues.

If your problem or idea is not addressed yet, please read through our [contributing guidelines](./CONTRIBUTING.md) and open a new [issues](https://github.com/Tencent/TSW/issues).

## License

Tencent Server Web is released under [MIT license](./LICENSE).

## Contacts

tsw@tencent.com
