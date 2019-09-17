# ChangeLog

## [2019-07-19, Version  v1.4.1](https://github.com/Tencent/TSW/releases/tag/v1.4.1)


### Bug fixes
	
 - [[```8d678781```](https://github.com/Tencent/TSW/commit/8d6787814f53f1c45b60e11a9e5fa665ca0d8cf0)] __-__ get user IP from XXF first (youkunhuang)
 - [[```fda2ad28```](https://github.com/Tencent/TSW/commit/fda2ad28791a08c5c22564cc593d2a02ef0ca32f)] __-__ resolved #324 (Zhang Kaidong)
 - [[```5d27976e```](https://github.com/Tencent/TSW/commit/5d27976e01b5202c184d970e4952ba8835345847)] __-__ upgrade ws version to 7 (RobinzZH)


### Code Refactoring

 - [[```8bb067c0```](https://github.com/Tencent/TSW/commit/8bb067c06c653afab55ed07a15cc86e5a6f2945a)] __-__ fix Dockerfile (mapleeit)
 - [[```98762a59```](https://github.com/Tencent/TSW/commit/98762a593ba846fc814bb5d4c88d9cb787fa59d6)] __-__ refactor some code (youkunhuang)


### Other commits

 - [[```2d2e0112```](https://github.com/Tencent/TSW/commit/2d2e0112f47175a06f5cd24f1be7a67d8dd1140c)] __-__ 1.4.1 (robinzhxie)




## [2019-05-09, Version  v1.4.0](https://github.com/Tencent/TSW/releases/tag/v1.4.0)


### Bug fixes
	
 - [[```e555f55b```](https://github.com/Tencent/TSW/commit/e555f55bb34bd9ad3717dc4897d1314b5e10136a)] __-__ resolved Tencent/TSW#317 (lemanzhang)
 - [[```e8dd7e14```](https://github.com/Tencent/TSW/commit/e8dd7e1404535f8c3d13d89f9ac206c674dcfe74)] __-__ __websocket__: window not find (tarotlwei)
 - [[```da266d91```](https://github.com/Tencent/TSW/commit/da266d9150aeb2b6e4a899f407f3059d36751176)] __-__ __encryption__: update iterations for pbkdf2 (robinzhxie)
 - [[```c5727216```](https://github.com/Tencent/TSW/commit/c572721662904f52f628a2280f5f950459578467)] __-__ __docker__: update Dockerfile (mapleeit)


### Features

 - [[```edf16146```](https://github.com/Tencent/TSW/commit/edf16146d0706567ce38a5cd1c8727d8a75d8d49)] __-__ __docker__: don&#39;t redirect stdout in dockerfile (mapleeit)
 - [[```4ff24c26```](https://github.com/Tencent/TSW/commit/4ff24c26e0ce3dd9f0ddc9d2bb1578a79c77f905)] __-__ add ignoreSIGTERM config (lemanzhang)


### Code Refactoring

 - [[```868c498b```](https://github.com/Tencent/TSW/commit/868c498b19cc61088fba944e2f130ce79f318ddf)] __-__ sync from tencent interal TSW (youkunhuang)
 - [[```2bc400b2```](https://github.com/Tencent/TSW/commit/2bc400b201312350eb4ac8964f14d86deda47afc)] __-__ __docker__: add nodejs-npm for building image (lemanzhang)


### Other commits

 - [[```fc28436d```](https://github.com/Tencent/TSW/commit/fc28436dc42de6897f9c577380255431628d35fe)] __-__ 1.4.0 (mapleeit)
 - [[```0805d72c```](https://github.com/Tencent/TSW/commit/0805d72cb0a87fc59899b11cc70a8c0c04b7d459)] __-__ __test(encryption)__ : test decode for v1 &amp; v2 (robinzhxie)
 - [[```17f15fe6```](https://github.com/Tencent/TSW/commit/17f15fe60e5334f039c928f6cb7146cede226f2c)] __-__ __docs(changelog)__ : update change log (robinzhxie)




## [2019-03-08, Version  v1.3.0](https://github.com/Tencent/TSW/releases/tag/v1.3.0)


### Bug fixes
	
 - [[```c168fdfb```](https://github.com/Tencent/TSW/commit/c168fdfb9ceae77786acea9fc5cad611cf7d9d48)] __-__ __encryption__: upgrading des to aes for #304 (robinzhxie)
 - [[```10689be6```](https://github.com/Tencent/TSW/commit/10689be68cd518674e61ded27f66d5d658ca4b54)] __-__ modify maxBodySize of capturer from 1MB to 5KB (yippeehuang)
 - [[```d7a1ff60```](https://github.com/Tencent/TSW/commit/d7a1ff60c7385594b3c449cd61dc025e1e844ee4)] __-__ __config__: resovle circular dependency (neilcui)
 - [[```9f8eb041```](https://github.com/Tencent/TSW/commit/9f8eb041731f099462d2970b00bf076d5badcf6f)] __-__ __config__: update dependencies (Zhang Kaidong)
 - [[```daeaa84b```](https://github.com/Tencent/TSW/commit/daeaa84bd26d19ad8676e4bbc3bbe4b1fa511d11)] __-__ __logman__: keep log clear always (youkunhuang)
 - [[```01eba311```](https://github.com/Tencent/TSW/commit/01eba3116b2d3bb54b5ccfce0cd7ac22fb1a5402)] __-__ __master__: do not close self (youkunhuang)


### Features

 - [[```69f1a182```](https://github.com/Tencent/TSW/commit/69f1a18295a2c7850d73f7b2aa99949e3a30e87c)] __-__ use `devMode` and `autoCleanCache` to handle cache cleaning (JrainLau)
 - [[```633f8c60```](https://github.com/Tencent/TSW/commit/633f8c60ceeeb35f40039c5171793c4f36261aa3)] __-__ __changelogs__: add script for changelog (RobinzZH)
 - [[```091b2274```](https://github.com/Tencent/TSW/commit/091b227434ef2f530db129d364eee60f62a48aad)] __-__ __config__: support /data/release/tsw.config.js config path (mc-zone)
 - [[```a26a51e3```](https://github.com/Tencent/TSW/commit/a26a51e3595dbad18d4087be8a4f6c0099500e03)] __-__ __logman__: add stop funciton for stopping (maplemiao)
 - [[```209fbd01```](https://github.com/Tencent/TSW/commit/209fbd0173177cae9d176697b3af5ed75c58e994)] __-__ __master-monitor__: restart tsw when master is not reply (loviselu)
 - [[```b1e1d4cf```](https://github.com/Tencent/TSW/commit/b1e1d4cf8d28b1ea6df411816d67abfe88133d2e)] __-__ __config__: now cpuRecordTime can configure (youkunhuang)
 - [[```f92f90c0```](https://github.com/Tencent/TSW/commit/f92f90c06879acd82d08c8d04d8614436ba02b01)] __-__ __ccfinder__: add CCIPLimitQuiet options to close notify (youkunhuang)


### Code Refactoring

 - [[```a423efc3```](https://github.com/Tencent/TSW/commit/a423efc3506eece3715b7d92a3f9ab58b509c1b3)] __-__ upgrade 1.3.0-alpha (robinzhxie)
 - [[```774f626a```](https://github.com/Tencent/TSW/commit/774f626a334364350e7440fa997bb4df8b93264d)] __-__ __server__: exit while listening failure (youkunhuang)
 - [[```43ad32f8```](https://github.com/Tencent/TSW/commit/43ad32f8d0261af79d327f156242dc5b537e7b9e)] __-__ __master__: update overload rules (youkunhuang)
 - [[```eee94bf0```](https://github.com/Tencent/TSW/commit/eee94bf0ae306db980ebc82b62c18502b69eeb6f)] __-__ __util__: use realIp first (youkunhuang)


### Other commits

 - [[```9872a70f```](https://github.com/Tencent/TSW/commit/9872a70f347028c920ae051c96da55f8a767c259)] __-__ __docs(changelog)__ : update tag name (RobinzZH)
 - [[```b49ba073```](https://github.com/Tencent/TSW/commit/b49ba07364d6c35cc91692d45938c47210882c06)] __-__ __docs__ : update change log (robinzhxie)




## [2018-11-08, Version  v1.2.3](https://github.com/Tencent/TSW/releases/tag/v1.2.3)


### Bug fixes
	
 - [[```d850b5d7```](https://github.com/Tencent/TSW/commit/d850b5d7085ce803d74f36f25ad347f73e73c40d)] __-__ __h5test__: add port in deduplication for testenv (RobinzZH)
 - [[```bb714a85```](https://github.com/Tencent/TSW/commit/bb714a851374c5ea060c9a0c8d62f7c734390d38)] __-__ __start__: exit if node cmd is not exists (youkunhuang)
 - [[```4076025c```](https://github.com/Tencent/TSW/commit/4076025cdf4e8add981e03431b49bf75c7c67a9e)] __-__ __har__: fix bug for hardata (yinghaowang)
 - [[```c206dab0```](https://github.com/Tencent/TSW/commit/c206dab0fc88d3b725e61a0c82ef187aa998a8a8)] __-__ websocket server should be a func param (kingweicai)
 - [[```192fd21b```](https://github.com/Tencent/TSW/commit/192fd21b4299ef141863c0334f7bd5cb53b8c4ff)] __-__ remove other commits (kingweicai)
 - [[```30680a4c```](https://github.com/Tencent/TSW/commit/30680a4c69b8c1ef55f2dcb775f427753d25288a)] __-__ __test__: fix bug for tester (youkunhuang)
 - [[```e53b3d2d```](https://github.com/Tencent/TSW/commit/e53b3d2da6009058800d595f812068dfb4ae1f9b)] __-__ fix isAlphaUin test cast (kingweicai)
 - [[```556354eb```](https://github.com/Tencent/TSW/commit/556354ebddc8cddec4bba677181f127b53d2252b)] __-__ alpha test case (kingweicai)
 - [[```ff6b3c8d```](https://github.com/Tencent/TSW/commit/ff6b3c8dd43dfe341b36353d50b9290067d2b57e)] __-__ __logman__: fix bug for fs status (youkunhuang)
 - [[```a7be8382```](https://github.com/Tencent/TSW/commit/a7be8382ab9b2ecb464f71985aae0d2281a3e9fd)] __-__ __router__: let it going while response closing (youkunhuang)
 - [[```6de11c0d```](https://github.com/Tencent/TSW/commit/6de11c0d7faf4afb5b5734d81d77c9a662492fe7)] __-__ __ccfinder__: fix IDENTICAL_BRANCHES (youkunhuang)
 - [[```db999512```](https://github.com/Tencent/TSW/commit/db999512fba9ed940fbf173e1cda4b6bad7ef02d)] __-__ __cmem__: modified cmem option and added websocket log (iscowei)
 - [[```e2488b86```](https://github.com/Tencent/TSW/commit/e2488b8643fb5f5fe8def5a2c4b927c6dd4189fa)] __-__ rejecting condition of overloadProtection (sunxen)
 - [[```d6c2d80a```](https://github.com/Tencent/TSW/commit/d6c2d80a24fb373dbcb9a09e7c23d8cb4bb44982)] __-__ __cmem__: reduce cmem client retry and reconnect time (mapleeit)
 - [[```05b74d90```](https://github.com/Tencent/TSW/commit/05b74d90e388522d5d6c00ad359a5ec327b91dc2)] __-__ __download__: compatibility with uppercase &amp; lowercase header (neilcui)
 - [[```0ec74e8d```](https://github.com/Tencent/TSW/commit/0ec74e8d8d545a6018f2c067705e6d4649fe96b4)] __-__ __package__: change version to alpha (RobinzZH)


### Features

 - [[```c364ad29```](https://github.com/Tencent/TSW/commit/c364ad2964ea4756b4f701bfc3a42a0e453d1594)] __-__ add TSW_CONFIG_PATH env (maplemiao)
 - [[```0adfb658```](https://github.com/Tencent/TSW/commit/0adfb658932f7294497f0418fad5091dc07737fa)] __-__ expose websocket server to global (kingweicai)
 - [[```cc8e46d9```](https://github.com/Tencent/TSW/commit/cc8e46d998ab1d368a6d1c39668103d6c9526f07)] __-__ add a test case for isAlphaUin func (kingweicai)
 - [[```4aff9c86```](https://github.com/Tencent/TSW/commit/4aff9c86dda273e1638512e1b57605a7f9431f07)] __-__ add a function to judege a uin is alpha or not (kingweicai)
 - [[```f3d031b8```](https://github.com/Tencent/TSW/commit/f3d031b8b06f6bbd539c7928a501cd4bebb81857)] __-__ __config__: modify download.js (yinghaowang)
 - [[```57cb546f```](https://github.com/Tencent/TSW/commit/57cb546f32eb0804d18182df1fce279179a81822)] __-__ __origin__: add origin config (tarotlwei)
 - [[```86013ea2```](https://github.com/Tencent/TSW/commit/86013ea26ace52d7d9a80216732a54fee77efb63)] __-__ __config__: add config.httpAdminAddress (youkunhuang)
 - [[```0395141e```](https://github.com/Tencent/TSW/commit/0395141ee7e3e438c415af4a5e3bea195fa50a3b)] __-__ __log__: view log capture online by whistle (neilcui)
 - [[```ed3783f7```](https://github.com/Tencent/TSW/commit/ed3783f77e05df068e9228ea78321ada4c81d255)] __-__ __log__: view log capture online by whistle (neilcui)
 - [[```88792d9c```](https://github.com/Tencent/TSW/commit/88792d9cc305e7e17323ac3c26a99499f8f09534)] __-__ __package__: start dev for 1.2.3 (RobinzZH)


### Code Refactoring

 - [[```b3c5942d```](https://github.com/Tencent/TSW/commit/b3c5942ddaddeee186a80bc24422bc555f2cfed8)] __-__ __master__: log configFrom on startup (youkunhuang)
 - [[```685697ce```](https://github.com/Tencent/TSW/commit/685697cea76c0c5f58c4d093d5167a13734a95f1)] __-__ __capture__: revert response.close event listening (youkunhuang)
 - [[```fd902415```](https://github.com/Tencent/TSW/commit/fd9024156a036f726dcdb8ec19cee7594e92675c)] __-__ __route__: log level use debug  instead of info (youkunhuang)
 - [[```5e7a5b75```](https://github.com/Tencent/TSW/commit/5e7a5b7501719bca174945216124851ac3638eed)] __-__ __ccfinder__: add min sum to deny block (youkunhuang)
 - [[```0c677a30```](https://github.com/Tencent/TSW/commit/0c677a30f8b638846387b812b66f3c5c4bb78032)] __-__ __test__: update tester for config (youkunhuang)
 - [[```a446aa56```](https://github.com/Tencent/TSW/commit/a446aa565552a3545b3ebe69db50d1de164315f6)] __-__ __ajax__: revert default ua for ajax (youkunhuang)
 - [[```cf6b21f6```](https://github.com/Tencent/TSW/commit/cf6b21f6c6c07e6a774c6640f310ddeeb97ebbd4)] __-__ __ajax__: add default user-agent for ajax (youkunhuang)
 - [[```a5e2b4fd```](https://github.com/Tencent/TSW/commit/a5e2b4fdd436cbf31a77052d245011578be60469)] __-__ __logman__: logDir now can configure (youkunhuang)
 - [[```3a97a94c```](https://github.com/Tencent/TSW/commit/3a97a94c7628a57e39757385330395f9d731a9fb)] __-__ __config__: update default value of memoryLimit (youkunhuang)
 - [[```9b7f9f92```](https://github.com/Tencent/TSW/commit/9b7f9f92e16abda7768644f8feb20cd9a83b9328)] __-__ __logman__: use async api instead of sync (youkunhuang)
 - [[```a8561791```](https://github.com/Tencent/TSW/commit/a856179171bd20064755c8270a644ef9e58a4380)] __-__ __capture__: delete response.close event listening (youkunhuang)
 - [[```4e8d1b67```](https://github.com/Tencent/TSW/commit/4e8d1b6765b537a3b14550d59a4e670b06af4704)] __-__ __ajax__: httpProxy keep limit by isWin32Like (youkunhuang)
 - [[```aed0b896```](https://github.com/Tencent/TSW/commit/aed0b89649370b0d044ae4853bf13f73ad659332)] __-__ __master__: cpu notify use cpuLimit (youkunhuang)
 - [[```f3f87fd1```](https://github.com/Tencent/TSW/commit/f3f87fd1453176694b5c9b58a8bd7922087ea8bb)] __-__ __master__: refactor master (youkunhuang)
 - [[```d7969066```](https://github.com/Tencent/TSW/commit/d796906601c554dd051df06ca3aa432f9e46f82e)] __-__ __ajax__: use httpProxy global instead of only devMode (youkunhuang)
 - [[```e54ff1f1```](https://github.com/Tencent/TSW/commit/e54ff1f12b4e691cc38b7f58d345ff5c6f926826)] __-__ __config__: support ipv6 as default (youkunhuang)


### Other commits

 - [[```615b7e59```](https://github.com/Tencent/TSW/commit/615b7e59c00928e7a029f792e68a82b8590d4c76)] __-__ __docs__ : update change logs for v1.2.3 (RobinzZH)
 - [[```6d9db67b```](https://github.com/Tencent/TSW/commit/6d9db67bba2b8411ee2a699da9b8c7b77a57c552)] __-__ fix:memory-leak when chean require.cache (loviselu)
 - [[```66a5f0d0```](https://github.com/Tencent/TSW/commit/66a5f0d034ac25996bd7090a7bc92833486f0a48)] __-__ __docs(changelog)__ : append changelog for 1.2.2 (RobinzZH)
 - [[```f45e6470```](https://github.com/Tencent/TSW/commit/f45e6470b31eaf408a6a677d120f55ace276feb9)] __-__ __docs(changelog)__ : append changelog for 1.2.2 (RobinzZH)




## [2018-08-16, Version  v1.2.2](https://github.com/Tencent/TSW/releases/tag/v1.2.2)


### Bug fixes
	
 - [[```88f35c4d```](https://github.com/Tencent/TSW/commit/88f35c4da7b32dfedec89e8615804e6ea0a93aa5)] __-__ __config__: use resolve support absolute path &amp; fix require (neilcui)
 - [[```2a426a67```](https://github.com/Tencent/TSW/commit/2a426a6752dac7000fa3f3b916ea2b8fe9cd5d1f)] __-__ __ajax__: assert null of request before use (youkunhuang)
 - [[```94d80397```](https://github.com/Tencent/TSW/commit/94d8039798daae48625b26f2f333e48a7de6a94d)] __-__ __ccfinder__: solve conflict (sunYanxl)
 - [[```0d785747```](https://github.com/Tencent/TSW/commit/0d7857479a2a95567c1089014eb20d2a4be6ad77)] __-__ __lang__: fix translate error (sunYanxl)
 - [[```35754f66```](https://github.com/Tencent/TSW/commit/35754f66288f1b5df9ba494b9a381cb7bc0607cc)] __-__ __ccfinder__: fix bug for miss end tag (youkunhuang)
 - [[```f868ab32```](https://github.com/Tencent/TSW/commit/f868ab32c8893074d37e4ec990ec2a268180f30f)] __-__ __cpu__: ignore support for windows (youkunhuang)
 - [[```cbd16ca2```](https://github.com/Tencent/TSW/commit/cbd16ca23786bbb6d0a7035f4f4752765b753563)] __-__ __logger__: fix log is null (tarotlwei)
 - [[```ceaa05e5```](https://github.com/Tencent/TSW/commit/ceaa05e5347bdf657ee0d8973470a74fdb890181)] __-__ __logreport__: log filled report (tarotlwei)
 - [[```83799985```](https://github.com/Tencent/TSW/commit/83799985f9b055d910e6889ea209368cc1feaa23)] __-__ __websocket__: bugfix (tarotlwei)
 - [[```84449e56```](https://github.com/Tencent/TSW/commit/84449e561593987bfa2159045a4a57d940b78616)] __-__ __runtime__: let url string instead of Tag a (wikibady)
 - [[```d4f72e68```](https://github.com/Tencent/TSW/commit/d4f72e68b64c59fcc6704300e265c8213867821e)] __-__ __runtime__: let url string instead of Tag a (wikibady)
 - [[```6bb5be88```](https://github.com/Tencent/TSW/commit/6bb5be88faf5e6127cab80de82b0c8ba7c851142)] __-__ __websocket__: log message length instead of message body (neilcui)


### Features

 - [[```c5d2ff7c```](https://github.com/Tencent/TSW/commit/c5d2ff7cfcec85ab8a80be0c948f746e3d1f2789)] __-__ __http__: support ipv6 (youkunhuang)
 - [[```3ff1e380```](https://github.com/Tencent/TSW/commit/3ff1e3808f68bb62ef419ccfccdda721552a3ec2)] __-__ __config__: add search path of config file (sunYanxl)
 - [[```a5f8819c```](https://github.com/Tencent/TSW/commit/a5f8819ca2d738d135b5314d5cc9176818491622)] __-__ __config__: add search path of config.js (sunYanxl)
 - [[```ab923d50```](https://github.com/Tencent/TSW/commit/ab923d5086117a7ff56141bee440eb6120894ee3)] __-__ __package.json__: start 1.2.1 development (RobinzZH)
 - [[```275f1104```](https://github.com/Tencent/TSW/commit/275f1104f72059aa462455646344c3dae8d9b5e6)] __-__ __i18n__: support i18n (sunYanxl)


### Code Refactoring

 - [[```8e0860f5```](https://github.com/Tencent/TSW/commit/8e0860f57f699bd57ed3e47a4977c2a6445a9402)] __-__ __ccfinder__: list hostname and pathname for black ip (youkunhuang)
 - [[```2792e695```](https://github.com/Tencent/TSW/commit/2792e695806be38913167bd6f4de203fdad1c6bc)] __-__ __all__: refactor filename (youkunhuang)
 - [[```a17851db```](https://github.com/Tencent/TSW/commit/a17851dba24b79940542005e60c793c357be6864)] __-__ __config__: refactor config (youkunhuang)
 - [[```107cdeea```](https://github.com/Tencent/TSW/commit/107cdeea477644af1f95a041ae70eed27d964cb0)] __-__ __http2__: ignore http2 ExperimentalWarning (youkunhuang)
 - [[```bedc8245```](https://github.com/Tencent/TSW/commit/bedc82457cf286143b7f1ad5350c85cbd347fc8e)] __-__ __startup__: add log in startup.sh (youkunhuang)
 - [[```54b79bcd```](https://github.com/Tencent/TSW/commit/54b79bcd240695accff14ccc84604c1cdf4f66f6)] __-__ __cclint__: use 3x instead of 1x (youkunhuang)
 - [[```eb551a17```](https://github.com/Tencent/TSW/commit/eb551a1734bce7f3178eb2ead2a27de7e8f111b6)] __-__ __cciplimit__: update default value to 200 on config.CCIPLimit (youkunhuang)
 - [[```cb7a92f8```](https://github.com/Tencent/TSW/commit/cb7a92f864873b81fd0c50d37887841ed38d876b)] __-__ __ccfinder__: refactor ccfinder (youkunhuang)
 - [[```1883db19```](https://github.com/Tencent/TSW/commit/1883db1947b4571fe236a1b456c34a24a91ca87e)] __-__ __tnm2__: keep report async (youkunhuang)
 - [[```3405e926```](https://github.com/Tencent/TSW/commit/3405e926a5480f9a87572f1a2f1f885172288b6d)] __-__ __logger__: write once (youkunhuang)
 - [[```3a0f3905```](https://github.com/Tencent/TSW/commit/3a0f3905d0c85cf1a37d21ac3ab8fbb8507969b1)] __-__ __websocket__: clean beforelogclean callback (tarotlwei)
 - [[```89f958e3```](https://github.com/Tencent/TSW/commit/89f958e3afa3967c1d961f84cae197a89e38c9f3)] __-__ __logger__: add before log report callback (tarotlwei)
 - [[```c77dbd60```](https://github.com/Tencent/TSW/commit/c77dbd60369199fa17da53bae04e8c1371c236d9)] __-__ __tnm2__: async while reporting (youkunhuang)
 - [[```247bc3a4```](https://github.com/Tencent/TSW/commit/247bc3a43fe8c3d0472ecfb3a456f4db25368054)] __-__ __master__: keep process.title as TSW (youkunhuang)
 - [[```3bda8727```](https://github.com/Tencent/TSW/commit/3bda87271668b53e61caaa68c5829865ec16ab57)] __-__ __runtime__: add Memory over load alert (wikibady)
 - [[```2ece2769```](https://github.com/Tencent/TSW/commit/2ece27691634f4d4de2fb3007fd1c7a7a0b30417)] __-__ __runtime__: add new runtime type &#39;CPU alert&#39; (wikibady)
 - [[```a0a3c0b3```](https://github.com/Tencent/TSW/commit/a0a3c0b3ff04d52d491b420797e41c1bf7286829)] __-__ __runtime__: add a doc link in CCFinder mail (wikibady)
 - [[```fc7e1e23```](https://github.com/Tencent/TSW/commit/fc7e1e23884b5c1866374ebee5561336d6ccb0ae)] __-__ __runtime__: add Memory over load alert (wikibady)
 - [[```040fe549```](https://github.com/Tencent/TSW/commit/040fe549d235dcac29cac84b5e8bd60de3e4dc75)] __-__ __runtime__: add new runtime type &#39;CPU alert&#39; (wikibady)
 - [[```b633d266```](https://github.com/Tencent/TSW/commit/b633d266c3f8ac373eb7d18b95309ee0dc870f40)] __-__ __runtime__: add a doc link in CCFinder mail (wikibady)


### Other commits

 - [[```8d2387e3```](https://github.com/Tencent/TSW/commit/8d2387e356f91fe4005bbf58b77bd6d9e991da31)] __-__ __docs(changelog)__ : update change log (RobinzZH)




## [2018-07-26, Version  v1.2.1](https://github.com/Tencent/TSW/releases/tag/v1.2.1)



### Features

 - [[```34a01ec2```](https://github.com/Tencent/TSW/commit/34a01ec21d921b1a62ed456958f9926ec3c5b71e)] __-__ __npm__: support npm and npx (youkunhuang)




## [2018-07-26, Version  v1.2.0](https://github.com/Tencent/TSW/releases/tag/v1.2.0)


### Bug fixes
	
 - [[```447cd38f```](https://github.com/Tencent/TSW/commit/447cd38f5922310d083e8bb7a7f7db45ba0219da)] __-__ __websocket__: default allow origin (tarotlwei)
 - [[```d389c5cb```](https://github.com/Tencent/TSW/commit/d389c5cb628628ac376501857bc5363f2cb6ef85)] __-__ __httpproxy__: rename variable user_00 -&gt; workerUid (mapleeit)
 - [[```36bbfe85```](https://github.com/Tencent/TSW/commit/36bbfe8527d14e21c6f56281f908407572810566)] __-__ __contextwrap__: remove window and context while ContextWrap.destory (youkunhuang)
 - [[```7d8a2917```](https://github.com/Tencent/TSW/commit/7d8a2917c98e89954d4a7200f746fb6863f00ceb)] __-__ __h5test__: handle type error (RobinzZH)
 - [[```e8fc11d7```](https://github.com/Tencent/TSW/commit/e8fc11d77e2bde31c3427517b7b98a66012cacdb)] __-__ __h5test__: fix batch delete bug (RobinzZH)
 - [[```611a1baa```](https://github.com/Tencent/TSW/commit/611a1baa30c2b9e1f790857340eabd2e69ab1bf5)] __-__ __logreport__: clean logJson (tarotlwei)
 - [[```335da911```](https://github.com/Tencent/TSW/commit/335da91178e7d89c14e28f7e904dd4f5a60f2767)] __-__ __websocket__: check origin host bugfix (tarotlwei)
 - [[```7a88e9de```](https://github.com/Tencent/TSW/commit/7a88e9de370cf954cd2f4d46aac4ffc7741d67f4)] __-__ __h5test__: support batch request to resolve #188 (RobinzZH)
 - [[```537207c9```](https://github.com/Tencent/TSW/commit/537207c95a860b7a9fac9cf3216d55b42512d0c7)] __-__ __version__: limit nodejs version (muyan)
 - [[```9ae90cf1```](https://github.com/Tencent/TSW/commit/9ae90cf1dc1651f08655e7f05acb28acd1fd3765)] __-__ __version__: restricted version (muyan)
 - [[```2f94faa7```](https://github.com/Tencent/TSW/commit/2f94faa7ee5eb1fb69bc788af62e9408f0425e96)] __-__ __websocket log__: clear logJson (tarotlwei)
 - [[```ff964601```](https://github.com/Tencent/TSW/commit/ff9646010b6474de873445ba68e883e95f841181)] __-__ __logreport__: fixbug logText --&gt; logJson (youkunhuang)
 - [[```273a1c9f```](https://github.com/Tencent/TSW/commit/273a1c9fdff843c94e58add0989533b5ec9e78c5)] __-__ __runtime__: let url string instead of Tag a (bdliu(刘彬德))
 - [[```3eb9b54c```](https://github.com/Tencent/TSW/commit/3eb9b54cf1ecb1454a8aefbb9e1132b9a288640d)] __-__ __logreport__: fixbug for logText assert (youkunhuang)
 - [[```1c221644```](https://github.com/Tencent/TSW/commit/1c221644b73471dc4e4d03373ee57a42ffec8d94)] __-__ __cmem.l5__: use instances cache instead of poolsize (RobinzZH)
 - [[```a985a38c```](https://github.com/Tencent/TSW/commit/a985a38c2cdff1645ed2bc181fb535aaec4df097)] __-__ __runtime__: bugfix for find bad code (youkunhuang)
 - [[```0cc071c6```](https://github.com/Tencent/TSW/commit/0cc071c632bc0bf628c6920b1aab8bed9f35e1d9)] __-__ __config.js__: fix config file path (wayenli)
 - [[```20964052```](https://github.com/Tencent/TSW/commit/209640527dc5621789428269e1d70ba4d5235b51)] __-__ __h5-test__: use local instead of context (youkunhuang)


### Features

 - [[```eff338f8```](https://github.com/Tencent/TSW/commit/eff338f82eda86a934529a2ba83e75f51e05d460)] __-__ __npm__: change pkg name to support npm (RobinzZH)
 - [[```c6608dd1```](https://github.com/Tencent/TSW/commit/c6608dd1eb6f30fedc75d81d885a3745740ac4ab)] __-__ __websocket__: optimize report log (tarotlwei)
 - [[```7e2bb222```](https://github.com/Tencent/TSW/commit/7e2bb22254930ef85592be25296fe52b3a23ffd2)] __-__ __websocket__: add websocket origin limit (tarotlwei)
 - [[```07947d13```](https://github.com/Tencent/TSW/commit/07947d131e07258df8fed5c1cf59a42edf0c5224)] __-__ __logview__: add navigation in logview (muyan)
 - [[```b9375127```](https://github.com/Tencent/TSW/commit/b93751278930f9dcdfc33af0f73b17fdaffd22c1)] __-__ __master__: add event report for worker (youkunhuang)
 - [[```b22f8e0b```](https://github.com/Tencent/TSW/commit/b22f8e0b2118fba6c8ca0f5a347212a27e10a23e)] __-__ __h5-test__: add ckv report (youkunhuang)
 - [[```90671833```](https://github.com/Tencent/TSW/commit/90671833d69aa1d9144e4130c55618d94e85b5c4)] __-__ __memcached__: add ckv monitor (youkunhuang)
 - [[```15ebc877```](https://github.com/Tencent/TSW/commit/15ebc877740a97758d8dbf7939cbc85c74799bf2)] __-__ __package.json__: update package.json for R1.1.6 (RobinzZH)


### Code Refactoring

 - [[```0f08a194```](https://github.com/Tencent/TSW/commit/0f08a1942f88e3cc26834086d5ecc643f8e6f4ed)] __-__ __websocket__: dead code removal (tarotlwei)
 - [[```0e36f924```](https://github.com/Tencent/TSW/commit/0e36f9240ffd81d8c168fe5db92f8d966d24f0d8)] __-__ __mail__: remove deprecated template (RobinzZH)
 - [[```fdc5b808```](https://github.com/Tencent/TSW/commit/fdc5b8086624e43401b960934daa68a2c8c3371f)] __-__ __heapdump__: add heapdump (youkunhuang)
 - [[```e5591538```](https://github.com/Tencent/TSW/commit/e55915387efcc7a784d54b911d7d77fed6734340)] __-__ __runtime__: add Memory over load alert (bdliu(刘彬德))
 - [[```92581286```](https://github.com/Tencent/TSW/commit/92581286ac772c43c103b90bc9c185b8815e95ac)] __-__ __alpha__: move require to function (youkunhuang)
 - [[```7e5d4e99```](https://github.com/Tencent/TSW/commit/7e5d4e9953fd4e201dce3c15da0ec916bbfff4f3)] __-__ __runtime__: add new runtime type &#39;CPU alert&#39; (bdliu(刘彬德))
 - [[```eadd9923```](https://github.com/Tencent/TSW/commit/eadd99233ca4844ab8c8ac757ef43a23c8c90c91)] __-__ __runtime__: add a doc link in CCFinder mail (bdliu(刘彬德))
 - [[```caf1e626```](https://github.com/Tencent/TSW/commit/caf1e626102ce45e9f48b45d1b8c23fa3b3d7511)] __-__ __logger__: logger add limit (youkunhuang)
 - [[```62887378```](https://github.com/Tencent/TSW/commit/6288737866af3c29b2fef363a8c3cd0b4db85e80)] __-__ __http__: ignore errors after a stream was destroyed (youkunhuang)


### Other commits

 - [[```48ad4612```](https://github.com/Tencent/TSW/commit/48ad46121463d4dc21ad46bfdfb5e192cdf47fb4)] __-__ __docs(changelog)__ : add release log (RobinzZH)
 - [[```3544e4fd```](https://github.com/Tencent/TSW/commit/3544e4fd2c2c40e9cc0ff86e935f1b1d3c0918ce)] __-__ __test(cd)__ : reset appid after test cases (RobinzZH)
 - [[```2b4e656e```](https://github.com/Tencent/TSW/commit/2b4e656ec068040728a8f86bc5ef9f9d3a7e6584)] __-__ __docs(contributing)__ : add contributing_en.md (muyan)
 - [[```20793621```](https://github.com/Tencent/TSW/commit/207936217a51079815075610163f6a7ded89d99f)] __-__ __docs(contributing)__ : add contributing.md (muyan)




## [2018-07-06, Version  v1.1.5](https://github.com/Tencent/TSW/releases/tag/v1.1.5)


### Bug fixes
	
 - [[```f2804618```](https://github.com/Tencent/TSW/commit/f2804618af3d92f0cd66c5545cb7c3e07e91883f)] __-__ __websocket__: fix websocket not opened (tarotlwei)
 - [[```46083939```](https://github.com/Tencent/TSW/commit/46083939519f6a773608b0f536f5f7b2a3d22205)] __-__ __h5test__: deal with res headersSent after fail (youkunhuang)
 - [[```efc566e9```](https://github.com/Tencent/TSW/commit/efc566e9b38d19269b9f70f89f87f7b0e5c8d57d)] __-__ __cpu__: fix COPY_PASTE_ERROR (youkunhuang)
 - [[```0933d6f8```](https://github.com/Tencent/TSW/commit/0933d6f839a8a282b89f7bcdbacd74bc129633cf)] __-__ __capture__: revert merge for ajax and capturer (youkunhuang)
 - [[```dd2be781```](https://github.com/Tencent/TSW/commit/dd2be7815af4f7d2e44801f29b74e2c022de83ef)] __-__ __captrue__: must return the push result (timcui)
 - [[```486dc509```](https://github.com/Tencent/TSW/commit/486dc5098e7182bad7ad22f64b6743dc3a3241c7)] __-__ __network__: bugfix for use address instead of tmp (youkunhuang)
 - [[```5afbea18```](https://github.com/Tencent/TSW/commit/5afbea18fc7c6564ef908087c3104ee090d97fab)] __-__ __coverity__: fix errors in coverity report (RobinzZH)
 - [[```dec08cf1```](https://github.com/Tencent/TSW/commit/dec08cf16645ebfe2fd04e96706dc4937219a47b)] __-__ __capture__: http.request capture on-data =&gt; push (timcui)
 - [[```a88841fa```](https://github.com/Tencent/TSW/commit/a88841fa1f9677cb734ef2597921cd122ff0e244)] __-__ __capture__: push method instead of on-data event to capture (timcui)
 - [[```c814f83c```](https://github.com/Tencent/TSW/commit/c814f83caa0822f762557f61a6d5f990f4aa1a1e)] __-__ __ajax__: do something for pipe on error (youkunhuang)
 - [[```418cfc42```](https://github.com/Tencent/TSW/commit/418cfc429d02bcd6bd6ea3838d5e4a1c45438b57)] __-__ __ajax__: error events remove before close bug fix (youkunhuang)
 - [[```eb891379```](https://github.com/Tencent/TSW/commit/eb891379753abd89c2a16a302814e0cf9703861f)] __-__ __coverity__: fix errors in coverity report (RobinzZH)
 - [[```c2dee9f4```](https://github.com/Tencent/TSW/commit/c2dee9f4dfc1717dacf3c9d4e70930f93b9f1787)] __-__ __websocket__: fix websocket log reportLogIndex (tarotlwei)
 - [[```93b30c91```](https://github.com/Tencent/TSW/commit/93b30c9134b82e1e575d26421d06f483aabc7475)] __-__ __openapi__: set default value for ip (youkunhuang)


### Features

 - [[```3de60dc6```](https://github.com/Tencent/TSW/commit/3de60dc6332b69219e961abd73c99ddae2398caa)] __-__ __package.json__: upgrade tsw version (RobinzZH)
 - [[```93124a3c```](https://github.com/Tencent/TSW/commit/93124a3cafe0746516bca6c84fbfe02844615dfc)] __-__ __network__: use bps instead of kbps (youkunhuang)
 - [[```958e335a```](https://github.com/Tencent/TSW/commit/958e335a837910387295d415453ef0aef392eb59)] __-__ __tnm2__: add cpu load and network info report (youkunhuang)


### Code Refactoring

 - [[```0cdbd58c```](https://github.com/Tencent/TSW/commit/0cdbd58c8fec177b1fabfa66a6d88c149a542018)] __-__ __logger__: no use strict (youkunhuang)
 - [[```d559b85a```](https://github.com/Tencent/TSW/commit/d559b85ad7158b56fe17da42feaa36f7a5c7850a)] __-__ __master__: refactor the master restart function (youkunhuang)
 - [[```bce46e0c```](https://github.com/Tencent/TSW/commit/bce46e0c5dfe2acc14e1434da78543db4da6c9f4)] __-__ __travis__: add node-v10.5.0 (youkunhuang)
 - [[```c00e25da```](https://github.com/Tencent/TSW/commit/c00e25dabe9f02c30068bc6ba58cbc344f605e5a)] __-__ __router__: string type limited for router.name (youkunhuang)
 - [[```d061dc89```](https://github.com/Tencent/TSW/commit/d061dc89061fa0e1d69c6f591257bbe45c15b229)] __-__ __jslint__: update rules (youkunhuang)
 - [[```957fb7cf```](https://github.com/Tencent/TSW/commit/957fb7cf94bdf3728a9334762a564039d7f342b7)] __-__ __jslint__: close new-cap (youkunhuang)
 - [[```f27c587e```](https://github.com/Tencent/TSW/commit/f27c587e78d8348f34b971011658859b59226511)] __-__ __jslint__: update jslint rules for tmpl.js (youkunhuang)
 - [[```ff76178d```](https://github.com/Tencent/TSW/commit/ff76178d63900b3dc19352fc2073c9b463b85582)] __-__ __seajs__: res use const instead of let (youkunhuang)
 - [[```1452ec01```](https://github.com/Tencent/TSW/commit/1452ec01c56b89fb103e1bf3eeb642874a54bc7d)] __-__ __config__: allows to specify the path of config at startup (lemanzhang)
 - [[```ec101fbe```](https://github.com/Tencent/TSW/commit/ec101fbee257575d13cff07d7663f8809652ffef)] __-__ __config__: dns timeout use 1000 instead of 3000 (youkunhuang)
 - [[```89841bc3```](https://github.com/Tencent/TSW/commit/89841bc3ee05d0231e4731de5b4369f4f9c547ee)] __-__ __websocket__: delete unused tnm2 key (youkunhuang)
 - [[```45abc0a9```](https://github.com/Tencent/TSW/commit/45abc0a9e92cfbe30580b1a25ca6b0b3cd44dd87)] __-__ __window__: revert support vue ssr (youkunhuang)
 - [[```c4066d6a```](https://github.com/Tencent/TSW/commit/c4066d6a485d132cb07ad78eab78479399fb2e55)] __-__ __window__: support vue ssr (yuukiyao)
 - [[```19139f9c```](https://github.com/Tencent/TSW/commit/19139f9c77f00d6d003e0e3a8954383841484f52)] __-__ __window__: support vue ssr (yuukiyao)
 - [[```8f0d1f9f```](https://github.com/Tencent/TSW/commit/8f0d1f9fb207b8d93a643da19e09c3ac7ae0be92)] __-__ __error__: logger socker error info (youkunhuang)
 - [[```97d82b49```](https://github.com/Tencent/TSW/commit/97d82b491a6027d4c62169626cad053d05db18d0)] __-__ __websocket__: add error ignore list (youkunhuang)
 - [[```fe89cace```](https://github.com/Tencent/TSW/commit/fe89cace9fc99cf09d19330552f33e2234a18d5f)] __-__ __capture__: clean event after end or error (youkunhuang)


### Other commits

 - [[```b924c7b3```](https://github.com/Tencent/TSW/commit/b924c7b32da421d26efb35bd42bfa98cbd1dc9ce)] __-__ Revert &#34;chore(window): support vue ssr&#34; (yuukinan)




## [2018-06-25, Version  v1.1.4](https://github.com/Tencent/TSW/releases/tag/v1.1.4)


### Bug fixes
	
 - [[```f5005161```](https://github.com/Tencent/TSW/commit/f5005161395890ce10d582b245723a93bf075da6)] __-__ __websocket__: fix websocket log reportLogIndex (tarotlwei)
 - [[```c61434d9```](https://github.com/Tencent/TSW/commit/c61434d9759623c2442efe604d1c218fbfe90f32)] __-__ __openapi__: change const error by eslint fix (RobinzZH)
 - [[```69c44f47```](https://github.com/Tencent/TSW/commit/69c44f47a6936e434f48483af5c01b729d8c2c26)] __-__ __openapi__: filter key with undefined-value  in sig calculation (RobinzZH)
 - [[```9245a66a```](https://github.com/Tencent/TSW/commit/9245a66a0cada04b5830f8203dfa7af82aa5df2e)] __-__ __openapi__: set default value for ip (youkunhuang)
 - [[```7d0a1e12```](https://github.com/Tencent/TSW/commit/7d0a1e12c7a137e5e2b343ecc13a19ea55de3253)] __-__ __capture__: fix event leek (youkunhuang)
 - [[```204ee815```](https://github.com/Tencent/TSW/commit/204ee81578da2ff8ace414e29ad2e8ad223d3429)] __-__ __mail__: fix tmpl js error (RobinzZH)
 - [[```e443ffe3```](https://github.com/Tencent/TSW/commit/e443ffe3814c8f40b3b8a363c996c6394615b12b)] __-__ __cpu__: fix identical branches for if-else (RobinzZH)
 - [[```28cf5918```](https://github.com/Tencent/TSW/commit/28cf5918ba8a8185cdee694246a6268022a3d82e)] __-__ __download__: fix har download bug (youkunhuang)
 - [[```f9df31eb```](https://github.com/Tencent/TSW/commit/f9df31eb41beaac9985446fbb9b2701568640ee9)] __-__ __reload__: ignore warning while reloading (youkunhuang)
 - [[```6ca0aca7```](https://github.com/Tencent/TSW/commit/6ca0aca74c0e836e59853c1581aacfbd94e85dc5)] __-__ __sea-node__: do not use cache when `options` has `paths` property (mapleeit)
 - [[```398bf638```](https://github.com/Tencent/TSW/commit/398bf6384a88eb797c1024a4e0f14a6eab9ad5d0)] __-__ __ccfinder__: init data start after clear (youkunhuang)
 - [[```72be7593```](https://github.com/Tencent/TSW/commit/72be759336fb217a846e43d45e47c5ed8f81e6d3)] __-__ __router__: keep body same in router (youkunhuang)


### Features

 - [[```8f753549```](https://github.com/Tencent/TSW/commit/8f753549d75a5de5cd1cb56c2330f770ddc40855)] __-__ __h5test__: add link to logview (RobinzZH)


### Code Refactoring

 - [[```6fa72dcb```](https://github.com/Tencent/TSW/commit/6fa72dcb7d4e75ba258ba92ce7efd6dc7df80db2)] __-__ __package.json__: upgrade project version (RobinzZH)
 - [[```a952c04e```](https://github.com/Tencent/TSW/commit/a952c04e4ad994f4cbb5f58ef930f74efaecb9d5)] __-__ __router__: update log when ip empty (youkunhuang)
 - [[```8c3261a8```](https://github.com/Tencent/TSW/commit/8c3261a8ad1aae357f97680993cad4263644f2ed)] __-__ __router__: support app.beforeStart in http router (youkunhuang)
 - [[```f51c7c2e```](https://github.com/Tencent/TSW/commit/f51c7c2e14bc4042f76c294a822579e919b9949f)] __-__ __router__: support app.beforeStart in http router (youkunhuang)
 - [[```86257db0```](https://github.com/Tencent/TSW/commit/86257db05662879cdc0352517d6a19f0df27a1a3)] __-__ __node__: support node 10 (youkunhuang)
 - [[```5a334839```](https://github.com/Tencent/TSW/commit/5a33483979b47305c94cb832b54d86dcb67eca14)] __-__ __warning__: update runtimeType for warning (youkunhuang)
 - [[```722ec46e```](https://github.com/Tencent/TSW/commit/722ec46e054fef6d1cb21b9ca5bea97d4efb4383)] __-__ __window__: revert support vue ssr (youkunhuang)
 - [[```26a7f597```](https://github.com/Tencent/TSW/commit/26a7f597dbf01fb4ea5df8f2b2e6cd8e667f199e)] __-__ __logview__: update triple-clicking tips (RobinzZH)
 - [[```0daa4596```](https://github.com/Tencent/TSW/commit/0daa45966e0ad21defaeb5e09ccafa3d6d8a4ff9)] __-__ __logview__: triple-clicking to highlight url (RobinzZH)
 - [[```e5c4618b```](https://github.com/Tencent/TSW/commit/e5c4618b48fa513af938d24f7812fdf6764ee702)] __-__ __openapi__: update default param for signature (RobinzZH)
 - [[```cd9d01d6```](https://github.com/Tencent/TSW/commit/cd9d01d6dccc8b31daea3b4fd5d45618d55722f2)] __-__ __window__: support vue ssr (yuukiyao)
 - [[```d831caee```](https://github.com/Tencent/TSW/commit/d831caee88256fa7f20d370df4ad2bacf8fbc63c)] __-__ __window__: support vue ssr (yuukiyao)
 - [[```c0148a01```](https://github.com/Tencent/TSW/commit/c0148a01b51f13f534df3cb58ef5eb39151fd9a0)] __-__ __error__: logger socker error info (youkunhuang)
 - [[```381223d7```](https://github.com/Tencent/TSW/commit/381223d7d133915b836033a6e2054a06e66caa5b)] __-__ __websocket__: add error ignore list (youkunhuang)
 - [[```4f747c13```](https://github.com/Tencent/TSW/commit/4f747c13c79775537fda9a3c170bab63517be4c9)] __-__ __capture__: clean event after end or error (youkunhuang)
 - [[```bd11d0c8```](https://github.com/Tencent/TSW/commit/bd11d0c859a8ee5e48f97907da30e8ea39dabbcf)] __-__ __http__: add dns and connect time (youkunhuang)
 - [[```675d9047```](https://github.com/Tencent/TSW/commit/675d904779cebb9aa1be763a658fc4245952fa8a)] __-__ __http.test__: code refactor (RobinzZH)
 - [[```f1f0003e```](https://github.com/Tencent/TSW/commit/f1f0003ee11d1d0f7757acfcd8e0c3e4ea93a8b1)] __-__ __nyc__: remove deprecated folder (RobinzZH)
 - [[```a98d2d28```](https://github.com/Tencent/TSW/commit/a98d2d284fba155ecc10ee5fd836398e8deb4519)] __-__ __mail__: update mail tmpl (youkunhuang)
 - [[```1e629a92```](https://github.com/Tencent/TSW/commit/1e629a92e98a3a0f03709a0b8faa1fa873d83a63)] __-__ __test__: remove lib and move test case to tsw (RobinzZH)
 - [[```321e5944```](https://github.com/Tencent/TSW/commit/321e594426d1df4ad34dfc032936d3244f9ee766)] __-__ __websocket__: websocket report refactor (tarotlwei)
 - [[```6ad9cb96```](https://github.com/Tencent/TSW/commit/6ad9cb966e406f4c7a8a07d8f5edbed392be9eae)] __-__ __capturer__: support requestHeader and requestBody (youkunhuang)
 - [[```90637b1b```](https://github.com/Tencent/TSW/commit/90637b1bdbc5ffce3c42194f2f280bedcbca8a9f)] __-__ __examples__: add gitignore file (youkunhuang)
 - [[```bfb00c29```](https://github.com/Tencent/TSW/commit/bfb00c298c0c388f286f8436c05a64c903c0bb7e)] __-__ __logger__: getCallInfo module improving performance (youkunhuang)
 - [[```8fa5f8e8```](https://github.com/Tencent/TSW/commit/8fa5f8e81afb411d274a3162533754d0e51af0ba)] __-__ __alpha__: update skyMode add getUin (youkunhuang)
 - [[```07c18035```](https://github.com/Tencent/TSW/commit/07c18035e3ed6cf5fdf23b6deeadad647816debe)] __-__ __capture__: add captureIncomingMessageBody (youkunhuang)
 - [[```1e4a91e6```](https://github.com/Tencent/TSW/commit/1e4a91e6c2c12299ceb3a99c144190655f96f2db)] __-__ __cpu__: refactor cpu notify and del heapdump (youkunhuang)
 - [[```107e9a0d```](https://github.com/Tencent/TSW/commit/107e9a0d94d564cca175b02ad507c18ec9b98ae6)] __-__ __n-api__: ignore N-API warning mail (youkunhuang)
 - [[```e7ef9cc1```](https://github.com/Tencent/TSW/commit/e7ef9cc127bce117481276d32bab13e860d5978f)] __-__ __docker__: change CMD to `bin/proxy/startup.sh` (fduxiao)
 - [[```41ddb7aa```](https://github.com/Tencent/TSW/commit/41ddb7aa93029cf97aa2d0535dcd002a4a9fa175)] __-__ __docker__: add dockerfile (fduxiao)


### Other commits

 - [[```d8c1b5bb```](https://github.com/Tencent/TSW/commit/d8c1b5bb5320c6e90fb66b11103b9d993c1c6c70)] __-__ __docs(examples)__ : add egg.js examples (youkunhuang)
 - [[```6f70f8de```](https://github.com/Tencent/TSW/commit/6f70f8de4663ce73a2ee471962ab327718bc5324)] __-__ __test(openapi)__ : fix the unit test (RobinzZH)
 - [[```9c4b4d83```](https://github.com/Tencent/TSW/commit/9c4b4d8394fd6eac5c016dcb3d0b20a171ff8e4c)] __-__ Revert &#34;chore(window): support vue ssr&#34; (yuukinan)
 - [[```98efd54f```](https://github.com/Tencent/TSW/commit/98efd54f48044efc287201b0434de341646b3f2a)] __-__ __test(http)__ : add test cases (RobinzZH)
 - [[```cf9647a7```](https://github.com/Tencent/TSW/commit/cf9647a73602c12b64f2f1768019cbaedca37fb0)] __-__ __test(alpha)__ : remove iswin32like case (RobinzZH)
 - [[```92c8d97c```](https://github.com/Tencent/TSW/commit/92c8d97cdf17ae2162c04169fc317ca95ddc32cf)] __-__ __test(gziphttp)__ : add test cases (RobinzZH)
 - [[```9ab0e353```](https://github.com/Tencent/TSW/commit/9ab0e353fd5dfe4e216425ab1f87f0be3f1b6e7d)] __-__ __test(xss)__ : add test cases (RobinzZH)
 - [[```aa55ba03```](https://github.com/Tencent/TSW/commit/aa55ba03507455410dc779325e5800a64de04315)] __-__ __test(alpha)__ : add test cases (RobinzZH)




## [2018-06-11, Version  v1.1.3](https://github.com/Tencent/TSW/releases/tag/v1.1.3)


### Bug fixes
	
 - [[```df24cbe7```](https://github.com/Tencent/TSW/commit/df24cbe7f326103f5d9fede56355209dd95eb513)] __-__ __ccfinder__: update mail text (youkunhuang)
 - [[```b168e7f1```](https://github.com/Tencent/TSW/commit/b168e7f1ef5a05b201bb58b8fafaf253b3854c86)] __-__ __ccfinder__: fix num is not a number (youkunhuang)


### Code Refactoring

 - [[```f2cf3bfa```](https://github.com/Tencent/TSW/commit/f2cf3bfa89e406657554aefe2c07cb17ac789960)] __-__ __package.json__: upgrade project version (RobinzZH)
 - [[```0259a870```](https://github.com/Tencent/TSW/commit/0259a8705d56b7e3f4b2ac73938aadac3ebf1a7b)] __-__ __chmod__: chmod executable for shell (youkunhuang)
 - [[```ea84641a```](https://github.com/Tencent/TSW/commit/ea84641a40ab7fd4595150e03989f7f4d19ad1c0)] __-__ __shell__: use execPath in startup.sh (youkunhuang)
 - [[```b206bfee```](https://github.com/Tencent/TSW/commit/b206bfee2ae7ceda77eb00330859b5d3bf3d5657)] __-__ __tsw__: merge lib forder to tsw (youkunhuang)
 - [[```a8ab827a```](https://github.com/Tencent/TSW/commit/a8ab827ac6c8f66b75aeb25b0874a582f407aeca)] __-__ __eslint__: eslint ignore bin/deps (youkunhuang)
 - [[```1c0b35d9```](https://github.com/Tencent/TSW/commit/1c0b35d94b7dd54dea63c77c47d5982ccc275f74)] __-__ __eslint__: ignore node_modules (youkunhuang)
 - [[```a9a0f836```](https://github.com/Tencent/TSW/commit/a9a0f836ec45f420042b4bf5223dca08c403dd28)] __-__ __h5test__: test env report only once (youkunhuang)
 - [[```ff612848```](https://github.com/Tencent/TSW/commit/ff6128480d4064993fca6942148513ca4e40d1a8)] __-__ __ccfinder__: support config.CCIPLimitAutoBlock (youkunhuang)
 - [[```5fa2cb2e```](https://github.com/Tencent/TSW/commit/5fa2cb2e27ff45097827acbf78a2d6688cb32fed)] __-__ __h5test__: compile tmpl  RobinzZH committed (RobinzZH)
 - [[```c2be98da```](https://github.com/Tencent/TSW/commit/c2be98da282e23e1e5ce8a8c08132a0b05209140)] __-__ __h5test__: enlarge the click-area for group navigation (RobinzZH)
 - [[```c38b0bb2```](https://github.com/Tencent/TSW/commit/c38b0bb2b86b267cdfc41b88356af11ca07bc9bb)] __-__ __h5test__: compile tmpl (RobinzZH)
 - [[```4921df0c```](https://github.com/Tencent/TSW/commit/4921df0c1f9613984bcb85e58032153e04668e03)] __-__ __h5test__: enhance group navigation (RobinzZH)
 - [[```b07bb4dd```](https://github.com/Tencent/TSW/commit/b07bb4dd22ce5e5d58325f0069677baf32486910)] __-__ __h5test__: change H5test list UI (#102) (Robin)
 - [[```d41a3d1c```](https://github.com/Tencent/TSW/commit/d41a3d1cb9f93af09b14b6cb7b5717431531d659)] __-__ __h5test__: change H5test list UI (RobinzZH)
 - [[```3a810200```](https://github.com/Tencent/TSW/commit/3a8102003d173ab3978727bf6f65a5a06f6cdc24)] __-__ __h5test__: groups sort before filter (youkunhuang)
 - [[```dd31d7f5```](https://github.com/Tencent/TSW/commit/dd31d7f53a375515da93f6177a20c325d3970f2c)] __-__ __h5test__: add group navigation (#99) (Robin)
 - [[```62d56b10```](https://github.com/Tencent/TSW/commit/62d56b103e0d62a8165d2261bfb25bc3fae40750)] __-__ __h5test__: support allGroup api for openapi (youkunhuang)


### Other commits

 - [[```ae916266```](https://github.com/Tencent/TSW/commit/ae9162661c9be21f95efc970945290f580d845ec)] __-__ __style(context)__ : congratulations 13 years old to q-zone (youkunhuang)
 - [[```09cc1163```](https://github.com/Tencent/TSW/commit/09cc1163157b8a10b61b18d16d2f6671e8813334)] __-__ __style(h5test)__ : style green color update (youkunhuang)




## [2018-06-04, Version  v1.1.2](https://github.com/Tencent/TSW/releases/tag/v1.1.2)


### Bug fixes
	
 - [[```963adebd```](https://github.com/Tencent/TSW/commit/963adebdffc0211fd1fd8264af27215e0a58d73a)] __-__ __master__: fix runtimeType: unhandledRejection (youkunhuang)
 - [[```21eda71d```](https://github.com/Tencent/TSW/commit/21eda71d74c1779334921a0965ec94a0c753c6bf)] __-__ __cpu__: use string type in cp.exec #84 (youkunhuang)
 - [[```ab129c59```](https://github.com/Tencent/TSW/commit/ab129c5920b2bd9af99d466a7ee6e2471396829b)] __-__ __window__: move windowHasDisabled to global (youkunhuang)
 - [[```ccd90f0f```](https://github.com/Tencent/TSW/commit/ccd90f0f9c8032f6f3a9b3a87149f2ea86ab8459)] __-__ __logger__: error logger double echo in inspect (youkunhuang)
 - [[```3c4abdb2```](https://github.com/Tencent/TSW/commit/3c4abdb20e5d1f888b5dea3b387531ec30fa1abd)] __-__ __logger__: error logger double echo in inspect (youkunhuang)


### Code Refactoring

 - [[```f1825f8a```](https://github.com/Tencent/TSW/commit/f1825f8a05414ebef48730b8172f247bce09d9ef)] __-__ __master__: master.js Readability optimization (youkunhuang)
 - [[```d104adaf```](https://github.com/Tencent/TSW/commit/d104adafc5a297e99cbe229939923cf8cdac25dc)] __-__ __master__: add admin.start() in master (youkunhuang)
 - [[```9df7e5cd```](https://github.com/Tencent/TSW/commit/9df7e5cd2007480a28c7debd72da0ea0148ba2ee)] __-__ __master__: inspect startup move to master (youkunhuang)
 - [[```544216fa```](https://github.com/Tencent/TSW/commit/544216fa0a7fda4d06d6c667909a0d07fb3ce084)] __-__ __all__: use isWin32Like (youkunhuang)
 - [[```76e3db15```](https://github.com/Tencent/TSW/commit/76e3db15ba46ed355d7638cad0f6aa3fdc160de1)] __-__ __router__: refactor code (youkunhuang)
 - [[```d11727bc```](https://github.com/Tencent/TSW/commit/d11727bc4d94e442e74ed625574ec02a6d66c517)] __-__ __plug__: refactor code (youkunhuang)
 - [[```3961ec2d```](https://github.com/Tencent/TSW/commit/3961ec2d8af1ed3a203750329f32c0b441a4db6d)] __-__ __package.json__: move optionalDependencies to scripts (RobinzZH)
 - [[```c34f56cd```](https://github.com/Tencent/TSW/commit/c34f56cd2dde4be41b8634a0a9192c246452555a)] __-__ __startup__: update startup shell (youkunhuang)
 - [[```bf636a13```](https://github.com/Tencent/TSW/commit/bf636a13777ea49052cb0f5fbe00afef7823fbe5)] __-__ __startup__: update startup shell (youkunhuang)
 - [[```7105eb49```](https://github.com/Tencent/TSW/commit/7105eb49861b96722c96da526471ac7e8638e06a)] __-__ __startup__: support node_args.ini (youkunhuang)
 - [[```27e1355a```](https://github.com/Tencent/TSW/commit/27e1355a8c4c7e7132fb075def8874c76a1693be)] __-__ __logger__: unhandledRejection run with domain (youkunhuang)
 - [[```f8aa7117```](https://github.com/Tencent/TSW/commit/f8aa7117419629229c31088375efa18fe0fb2ee0)] __-__ __http__: http.proxy.js refactor (youkunhuang)
 - [[```ddaf2c9d```](https://github.com/Tencent/TSW/commit/ddaf2c9db3b26c7b8a123d6ecd55d567a93da815)] __-__ __http__: http.route.js refactor (youkunhuang)
 - [[```eb00c5ff```](https://github.com/Tencent/TSW/commit/eb00c5ffe0490154dc517ea0726ac991ca0b7417)] __-__ __webso__: use config.cpuLimit (youkunhuang)
 - [[```f17842f1```](https://github.com/Tencent/TSW/commit/f17842f13b0222c26e361314106288b7d7c27e31)] __-__ __logger__: unhandledRejection run with domain (youkunhuang)


### Other commits

 - [[```2dce0209```](https://github.com/Tencent/TSW/commit/2dce0209a310ac158667d47c66dc75b1e8f2fabe)] __-__ __docs(changelog.md)__ : remove changelog.md (RobinzZH)
 - [[```d8fc32ac```](https://github.com/Tencent/TSW/commit/d8fc32ac93a55d3cb9600f17e0cc888603c97c5f)] __-__ __style(all)__ : use camelCase only (youkunhuang)
 - [[```0ae40e0a```](https://github.com/Tencent/TSW/commit/0ae40e0a69afd505b76ac935908090e8669ab685)] __-__ __style(all)__ : use camelCase only (youkunhuang)
 - [[```8ae39544```](https://github.com/Tencent/TSW/commit/8ae39544244b044dc0dea54a94ed1fdf5f8b4dcc)] __-__ __style(all)__ : use camelCase only (youkunhuang)




## [2018-05-29, Version  v1.1.1](https://github.com/Tencent/TSW/releases/tag/v1.1.1)


### Bug fixes
	
 - [[```db8f9f1b```](https://github.com/Tencent/TSW/commit/db8f9f1b7896d840a884f17c7612427344180df9)] __-__ __wwwroot__: fix-eslint (youkunhuang)
 - [[```4bcacb2d```](https://github.com/Tencent/TSW/commit/4bcacb2da35e407551d65cb07857c703abb8d4af)] __-__ __reload__: relaod (youkunhuang)
 - [[```7a646a56```](https://github.com/Tencent/TSW/commit/7a646a56319e8e6c2cdcec8ceef838d849dbd132)] __-__ __wwwroot__: fix-eslint (youkunhuang)
 - [[```5867d38d```](https://github.com/Tencent/TSW/commit/5867d38d6bfa1460719dc4608c233a4698ae5c0e)] __-__ __reload__: relaod (youkunhuang)
 - [[```4cb74596```](https://github.com/Tencent/TSW/commit/4cb7459626381c36fd5a4fbc829cb138fa19724e)] __-__ __callinfo__: can&#39;t use strict for using callee (timcui)
 - [[```ee602c9e```](https://github.com/Tencent/TSW/commit/ee602c9ea671b6d4a6f1e47ec6499ca9dcbbf0a9)] __-__ __shell__: update-top100 (youkunhuang)
 - [[```e62ef379```](https://github.com/Tencent/TSW/commit/e62ef379f247fdf761c097a87633505f98249bd5)] __-__ __h5test__: h5test-update (youkunhuang)
 - [[```42d6c3ed```](https://github.com/Tencent/TSW/commit/42d6c3edc807dadc14c56345b98226a7dcb3cb45)] __-__ __shell__: update-top100 (youkunhuang)
 - [[```104810fb```](https://github.com/Tencent/TSW/commit/104810fbd799ebcc66b2d8e7c9c494b95b72b6c3)] __-__ __h5test__: h5test-update (youkunhuang)


### Code Refactoring

 - [[```48678ee9```](https://github.com/Tencent/TSW/commit/48678ee92da7da6d228e3b29cbafc66d0a9789bc)] __-__ Update package.json (Robin)
 - [[```d60d6b2c```](https://github.com/Tencent/TSW/commit/d60d6b2ce979459a94d97e7cdeb57714a16852fd)] __-__ __logger__: logger.js (youkunhuang)
 - [[```217ad7c6```](https://github.com/Tencent/TSW/commit/217ad7c629023a606b54f3013ed1ee302f6cb8ae)] __-__ __process__: process-argv (youkunhuang)
 - [[```9c3f7173```](https://github.com/Tencent/TSW/commit/9c3f71737c1db08007400c31a5687c4e40f0bab5)] __-__ eslint ignore wwwroot (timcui)
 - [[```64403625```](https://github.com/Tencent/TSW/commit/64403625ea6bc00c98ee662519e3745640d46c8b)] __-__ eslint ignore wwwroot (timcui)
 - [[```deeee41b```](https://github.com/Tencent/TSW/commit/deeee41bbc78f91b26843454894d545acaa39aaf)] __-__ ignore wwwroot dir eslint (timcui)
 - [[```7c776dae```](https://github.com/Tencent/TSW/commit/7c776daebbd3265f3235cdbe0c6db160da8c4541)] __-__ not ignore l5api eslint (timcui)
 - [[```2bc44d52```](https://github.com/Tencent/TSW/commit/2bc44d5228e65ddc752b0627db20ff915e80c967)] __-__ add pull template &amp; code conduct (timcui)
 - [[```ae0ba26b```](https://github.com/Tencent/TSW/commit/ae0ba26b1abdaf9dda409a0884dbd76cd1ee5fb8)] __-__ add pull template &amp; code conduct (timcui)
 - [[```3609f5c5```](https://github.com/Tencent/TSW/commit/3609f5c5f8c3817d5263fa89880d2463ec77d53a)] __-__ __config__: default-cpuLimit (youkunhuang)
 - [[```222ee9d8```](https://github.com/Tencent/TSW/commit/222ee9d81084ab514c62483da8fde8c99035cf76)] __-__ use alloy eslint config (timcui)
 - [[```4e9849d9```](https://github.com/Tencent/TSW/commit/4e9849d94d78597f835df3aae566133d4a59685b)] __-__ use alloy eslint config (timcui)
 - [[```b48e2483```](https://github.com/Tencent/TSW/commit/b48e24836e7efdd9b7efb909aa271a9a82fc150f)] __-__ __tsw__: add-dump-h5test (youkunhuang)
 - [[```79239b5d```](https://github.com/Tencent/TSW/commit/79239b5dc9525bbec44285f9279d9e982e3b36b8)] __-__ __runtime__: ajax-parse-error (youkunhuang)
 - [[```2f64c103```](https://github.com/Tencent/TSW/commit/2f64c103f43488c1a1f051b5641eff742e06f91b)] __-__ __master__: admin (youkunhuang)
 - [[```3832c725```](https://github.com/Tencent/TSW/commit/3832c7250b0417b6ceebbac6b5ae45946f96046a)] __-__ __tsw__: add-dump-h5test (youkunhuang)
 - [[```3b8c3c66```](https://github.com/Tencent/TSW/commit/3b8c3c66c4265888476c0dc4ea21d7116a2c93b0)] __-__ use alloy eslint config (timcui)
 - [[```fe5eec3a```](https://github.com/Tencent/TSW/commit/fe5eec3aa1a3973382e74074b4671e0e3847702f)] __-__ use alloy eslint config (timcui)
 - [[```5e953a84```](https://github.com/Tencent/TSW/commit/5e953a840bbf289cd495b174bfc412d5d56e696a)] __-__ __runtime__: ajax-parse-error (youkunhuang)
 - [[```37031fc7```](https://github.com/Tencent/TSW/commit/37031fc76ba4a0dc30388beda9f3446582c5e840)] __-__ __master__: admin (youkunhuang)
 - [[```314fcb3e```](https://github.com/Tencent/TSW/commit/314fcb3ed1ad2edda06fa38d9962c54baa828e7d)] __-__ fix eslint dismatch rules (timcui)
 - [[```6eaff2b6```](https://github.com/Tencent/TSW/commit/6eaff2b6911c245b5d138c27ce38060efa020a8e)] __-__ fix eslint dismatch rules (timcui)
 - [[```59bb79ad```](https://github.com/Tencent/TSW/commit/59bb79ad70f85b83ee79328090eb5adbbc7dcfc1)] __-__ fix eslint dismatch rules (timcui)
 - [[```00fde12c```](https://github.com/Tencent/TSW/commit/00fde12c03210ae1fae00286fa6dc4f9a489f53d)] __-__ __http__: probe request (youkunhuang)
 - [[```5436126b```](https://github.com/Tencent/TSW/commit/5436126bc5b8584d31848200f42563542afb7a1a)] __-__ add `description` to package.json to avoid WARN when npm install (maplemiao)
 - [[```f14a1160```](https://github.com/Tencent/TSW/commit/f14a11604c8fbc8e142e629d2b90338fb3cc79ab)] __-__ add .npmrc to avoid make package-lock.json (maplemiao)
 - [[```7b65b21e```](https://github.com/Tencent/TSW/commit/7b65b21e93513d1a334904ee0aaefcd18f2c54e2)] __-__ __all__: use eslint rule prefer-const (neilcui)
 - [[```5d9284b6```](https://github.com/Tencent/TSW/commit/5d9284b6743ac4dd9e73525f0836014337a1119e)] __-__ __all__: use eslint rule no-var, replace all var to let or const (neilcui)
 - [[```1398faa7```](https://github.com/Tencent/TSW/commit/1398faa7ab1b914e9b79241f4a7c8d74635d1179)] __-__ use overrides instead of eslintrc file (neilcui)
 - [[```d5828213```](https://github.com/Tencent/TSW/commit/d582821397d8ee05837d7500984ee1a7ed4a6563)] __-__ __all__: include more eslint rules (neilcui)
 - [[```251184a3```](https://github.com/Tencent/TSW/commit/251184a391a779a423ae0a017f66a121fcbfd509)] __-__ add commit lint to travis ci (neilcui)
 - [[```4a3f62eb```](https://github.com/Tencent/TSW/commit/4a3f62ebb58c3093690d94d15ab07e344a1e5c42)] __-__ add commitline to validate commit message (neilcui)


### Other commits

 - [[```a142e6fa```](https://github.com/Tencent/TSW/commit/a142e6fa272e33fbc4d3c9b6d466a61fc52834f6)] __-__ __docs(readme)__ : logger (youkunhuang)
 - [[```6ed5da36```](https://github.com/Tencent/TSW/commit/6ed5da36a56a6389fac6fbf6699ba21671dda14c)] __-__ __test__ : add unit tests (RobinzZH)
 - [[```4aeb7959```](https://github.com/Tencent/TSW/commit/4aeb7959bd884e546179313281cfd20c26e80239)] __-__ fix bug (youkunhuang)
 - [[```078bfd6a```](https://github.com/Tencent/TSW/commit/078bfd6a9d834dd98c29ea7238164bcaabdf7c15)] __-__ test commitlint (neilcui)
 - [[```ad8ebc2b```](https://github.com/Tencent/TSW/commit/ad8ebc2ba5bd7a383d0dd60a8f61947f6c45c9d1)] __-__ 调整windows下启动逻辑，去掉探测请求判断 (youkunhuang)
 - [[```55978abf```](https://github.com/Tencent/TSW/commit/55978abf151ad1bad85f7835b9019287865e648a)] __-__ 保持返回值为defer (youkunhuang)
 - [[```7be958d9```](https://github.com/Tencent/TSW/commit/7be958d9dea0e302eefbf1ab665ad58bd03682fa)] __-__ 开发者模式不上报 (youkunhuang)
 - [[```b7c001f6```](https://github.com/Tencent/TSW/commit/b7c001f62cdcff8e14bdd8966b807f105bbb5efa)] __-__ 实时监控，支持windows (youkunhuang)




