# [Tencent Server Web 2.0](https://tswjs.org)


[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/Tencent/TSW/blob/master/LICENSE) [![Build Status](https://github.com/tencent/tsw/workflows/build/badge.svg)](https://github.com/Tencent/TSW/actions?query=workflow%3Abuild) [![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)

2.0 进度参见：https://github.com/Tencent/TSW/projects

<h2 align="center">What is it</h2>

Tencent Server Web(TSW) 是一套面向 WEB 前端开发者，以提升问题定位效率为初衷，提供**染色抓包**、**全息日志**和**异常发现**的 Node.js 基础设施。TSW 关注业务的运维监控能力，适用于 http、websocket 协议的业务场景，可无缝与现有应用（Koa、Express）进行整合。

TSW 2.0 是在 1.0 的基础上抽丝剥茧，辅以现代化的设计模式演化而来，去除了 1.0 中的大量糟粕，同时对容器化、云原生更加友好。做到了无侵入、低成本接入。

<h2 align="center">Highlights</h2>

<table>
  <tr>
    <th><h4 align="center">🚀<h4 align="center">~0 侵入</h4 align="center"></th>
    <th><h4 align="center">🗡️</h4 align="center"><h4 align="center">定位问题如手术刀般犀利</h4 align="center"></th>
  </tr>
  <tr>
    <td width="33%"><sub>通过 Hack NodeJS 底层代码实现抓包、全息日志功能。对原有业务代码几乎零侵入。</sub></td>
    <td width="33%"><sub>TSW 提供了显微镜级别的全息日志，给开发者以完美的现场还原。可以重现每一个请求现场。一秒定位问题。</sub></td>
  </tr>
</table>

<h2 align="center">Quick Start</h2>

TODO

<h2 align="center">Plugins</h2>

### 插件是什么？

TSW 核心的实现方式是 Hack NodeJS 自身的 `http.request` 以及 `http.createServer`， 以此来实现抓包机制。在服务器处理请求的前后，在服务器向其他服务器发包的前后，等等，都会有相应的事件抛出，以供用户来进行自定义处理。**为了让用户更加方便地复用、传播这样一组组自定义处理，我们将他们抽象出来，形成了插件机制。**

### 一个最简单的插件

#### Commonjs

```js
// simple-plugin-commonjs.js

export.modules = (eventBus, config) => {
  eventBus.on("RESPONSE_CLOSE", (payload) => {
    console.log(payload);
  })
}
```

#### ES6 module

```js
// simple-plugin-es6module.js

export default (eventBus, config) => {
  eventBus.on("RESPONSE_CLOSE", (payload) => {
    console.log(payload);
  })
}
```

#### `eventBus`

`eventBus` 是通过 `new EventEmitter()` 得到的。TSW 核心会在各个关键时机触发上面的事件。

| key | 含义（触发时机） | payload |
| -- | -- | -- |
| `DNS_LOOKUP_SUCCESS` | 在每次 DNS 查询成功之后触发 | `string | dns.LookupAddress[]` |
| `DNS_LOOKUP_ERROR` | 在每次 DNS 查询失败之后触发 | `NodeJS.ErrnoException` |
| `RESPONSE_START` | 在每次服务器开始返回响应（执行 `writeHead`）时触发 | `ResponseEventPayload` |
| `RESPONSE_FINISH` | 在响应结束时（`res.on("finish")`）触发 | `ResponseEventPayload` |
| `RESPONSE_CLOSE` | 在底层链接关闭时 （`res.on("close")`）触发 | `ResponseEventPayload` |

#### `config`

`config` 是用户的自定义配置。

### 配置文件

| key | 必传 | 类型 | 含义 | 
| -- | -- | -- | -- |
| appid | 否 | `String` | [TSW 开放平台](https://tswjs.org) 接入时获得 | 
| appkey | 否 | `String` | [TSW 开放平台](https://tswjs.org) 接入时获得 | 
| plugins | 否 | `String[]` | 插件列表 |

<h2 align="center">License</h2>

Tencent Server Web 的开源协议为 MIT, 详情参见 [LICENSE](https://github.com/Tencent/TSW/blob/master/LICENSE) 。
