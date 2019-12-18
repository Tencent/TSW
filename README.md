# [Tencent Server Web](https://tswjs.org)


[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/Tencent/TSW/blob/master/LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Tencent/TSW/pulls) [![wiki](https://img.shields.io/badge/Wiki-open-brightgreen.svg)](https://tswjs.org/guide/index) ![node](https://img.shields.io/badge/node-%3E%3D8.0.0-green.svg) [![Actions Status](https://github.com/Tencent/TSW/workflows/build/badge.svg)](https://github.com/Tencent/TSW/actions)

---


[English Version](https://github.com/Tencent/TSW/blob/master/README_en.md) 


## 简介

Tencent Server Web(TSW)，是一套面向WEB前端开发者，以提升问题定位效率为初衷，提供染色抓包、全息日志和异常发现的Node.js基础设施。TSW关注业务的运维监控能力，适用于http、websocket协议的业务场景，可无缝与即有项目进行整合。支持公有云、私有云和本地部署。

![tsw](https://raw.githubusercontent.com/Tencent/TSW/master/static/resource/structure.png)

#### 染色抓包

TSW 支持用户维度的抓包

- 对于指定的用户（白名单内）
- 请求生命周期内，对请求本身及衍生请求进行抓包
- 提供抓包查看、下载等功能
- 抓包格式支持Fiddler和Charles，以及HAR

#### 全息日志

通过日志可以洞见请求的全部

- 对请求生命周期内的日志，采用全息的方式记录，形成流水
- 流水按用户维度聚合
- 提供查看功能，快速定位问题原因

#### 异常发现

- 内置指标实时监控
- 代码异常推送告警

## 环境要求

- 操作系统: Windows/Mac/Linux
- Node.js: 8.0.0+

## npm

1. 需先安装[Node.js](https://nodejs.org/en/download/)，并且Node.js的版本需不低于8.0.0。
1. npm i @tswjs/tsw
1. npx --node-arg=--inspect tsw
1. 预览 -- 打开浏览器，访问 `http://127.0.0.1/` 即可

## git

1. 需先安装[Node.js](https://nodejs.org/en/download/)，并且Node.js的版本需不低于8.0.0。
1. 安装 -- `git clone https://github.com/Tencent/TSW.git`
1. 切换工作目录 -- `cd TSW`
1. 补全依赖 -- `npm install`
1. 启动 --  `node --inspect index.js`
1. 预览 -- 打开浏览器，访问 `http://127.0.0.1/` 即可

## docker
```shell
# build
docker build -t tsw .
# run
docker run -v configure_dir:/data/release/node_modules -p 8080:80 tsw
```

## 官方网站

- 更多教程 [https://tswjs.org/guide/index](https://tswjs.org/guide/index)

- 使用手册 [https://tswjs.org/doc/api/index](https://tswjs.org/doc/api/index)

## 配套设施

- TSW开放平台 [https://tswjs.org](https://tswjs.org)

## 贡献代码

如果您使用过程中发现Bug，请通过 [https://github.com/Tencent/TSW/issues](https://github.com/Tencent/TSW/issues) 来提交并描述相关的问题，您也可以在这里查看其它的issue，通过解决这些issue来贡献代码。

如果您是第一次贡献代码，请阅读 [CONTRIBUTING](https://github.com/Tencent/TSW/blob/master/CONTRIBUTING.md) 了解我们的贡献流程，并提交 pull request 给我们。

## 许可证

Tencent Server Web 的开源协议为 MIT, 详情参见 [LICENSE](https://github.com/Tencent/TSW/blob/master/LICENSE) 。

## 联系方式

tsw@tencent.com
