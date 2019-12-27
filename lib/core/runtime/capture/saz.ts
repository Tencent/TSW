/* !
 * Tencent is pleased to support the open source community by making Tencent Server Web available.
 * Copyright (C) 2018 THL A29 Limited, a Tencent company. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
 * http://opensource.org/licenses/MIT
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
import * as archiver from "archiver";
import * as fs from "fs";
import { RequestLog } from "../../context";

/**
 * Download a saz package which includes all requests sended by server
 * @param requests multi request logs sended by server
 */
export const downloadSaz = (requests: RequestLog[]): void => {
  const zip = archiver("zip");

  zip.append(`<html>
  <head>
      <style>
          body,thead,td,a,p{font-family:verdana,sans-serif;font-size: 10px;}
      </style>
  </head>
  <body>
      <table cols=13>
          <thead>
              <tr>
                  <th>&nbsp;</th>
                  <th>#</th>
                  <th>Result</th>
                  <th>Protocol</th>
                  <th>Host</th>
                  <th>URL</th>
                  <th>Body</th>
                  <th>Caching</th>
                  <th>Content-Type</th>
                  <th>Process</th>
                  <th>Comments</th>
                  <th>Custom</th>
                  <th>ServerIP</th>
              </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a href='raw\\1_c.txt'>
                  C
                </a>&nbsp;<a href='raw\\1_s.txt'>
                  S
                </a>&nbsp;<a href='raw\\1_m.xml'>
                  M
                </a>
              </td>
              <td>001</td>
              <td>200</td>
              <td>HTTP</td>
              <td></td>
              <td>log</td>
              <td>0</td>
              <td>0</td>
              <td>json</td>
              <td>TSW</td>
              <td></td>
              <td></td>
              <td></td>
          </tr>
          </tbody>
      </table>
  </body>
</html>`, { name: "_index.htm" });

  zip.append(`<?xml version="1.0" encoding="utf-8" ?>
  <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="htm" ContentType="text/html" />
  <Default Extension="xml" ContentType="application/xml" />
  <Default Extension="txt" ContentType="text/plain" />
</Types>`, { name: "[Content_Types].xml" });

  requests.forEach((req, index) => {
    let requestRaw: Buffer;

    if (req.requestHeader) {
      requestRaw = Buffer.concat([
        Buffer.from(req.requestHeader, "utf-8"),
        Buffer.from(req.requestBody, "base64")
      ]);
    } else {
      requestRaw = Buffer.from(req.requestBody, "base64");
    }

    zip.append(requestRaw, { name: `raw/00${index + 1}_c.txt` });
    zip.append(`<?xml version="1.0" encoding="utf-8"?>
<Session>
  <SessionTimers
    ClientConnected     ="${req.timestamps.requestStart}"
    ClientBeginRequest  ="${req.timestamps.onSocket}"
    GotRequestHeaders   ="${req.timestamps.onSocket}"
    ClientDoneRequest   ="${req.timestamps.requestFinish}"
    GatewayTime         ="0"
    DNSTime             ="${req.timestamps.dnsTime}"
    TCPConnectTime      ="0"
    HTTPSHandshakeTime  ="0"
    ServerConnected     ="${req.timestamps.requestStart}"
    FiddlerBeginRequest ="${req.timestamps.onSocket}"
    ServerGotRequest    ="${req.timestamps.requestFinish}"
    ServerBeginResponse ="${req.timestamps.onResponse}"
    GotResponseHeaders  ="${req.timestamps.onResponse}"
    ServerDoneResponse  ="${req.timestamps.responseClose}"
    ClientBeginResponse ="${req.timestamps.onResponse}"
    ClientDoneResponse  ="${req.timestamps.responseClose}"/>
  <PipeInfo />
  <SessionFlags>
    <SessionFlag N="x-clientport" V="${req.clientPort}" />
    <SessionFlag N="x-responsebodytransferlength" V="${req.responseLength}" />
    <SessionFlag N="x-egressport" V="${req.serverPort}" />
    <SessionFlag N="x-hostip" V="${req.serverIp}" />
    <SessionFlag N="x-processinfo" V="${req.process}" />
    <SessionFlag N="x-clientip" V="${req.clientIp}" />
    <SessionFlag N="ui-comments" V="00${index + 1}" />
  </SessionFlags>
</Session>`, { name: `raw/00${index + 1}_m.xml` });

    zip.append(Buffer.concat([
      Buffer.from(req.responseHeader, "utf-8"),
      Buffer.from(req.responseBody, "base64")
    ]), { name: `raw/00${index + 1}_s.txt` });
  });

  zip.pipe(fs.createWriteStream("/tmp/haha.saz"));
  zip.finalize();
};
