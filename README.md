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

<h2 align="center">License</h2>

Tencent Server Web 的开源协议为 MIT, 详情参见 [LICENSE](https://github.com/Tencent/TSW/blob/master/LICENSE) 。
