# 为TSW做出贡献
欢迎您 [提出问题](https://github.com/Tencent/TSW/issues) 或 [pull requests](https://github.com/Tencent/TSW/pulls)， 建议您在为TSW做出贡献前先阅读以下TSW贡献指南。 

## Issues
我们通过Github Issues来收集问题和功能相关的需求。

### 首先查看已知的问题
在您准备提出问题以前，请先查看现有的Github Issues是否已有其他人提出过相似的功能或问题，以确保您提出的问题是有效的。

### 提交问题
问题的表述应当尽可能的详细，可以包含相关的代码块。

## Pull Requests
我们期待您通过PR（Pull Requests）让TSW变的更加完善。

### 分支管理
仓库一共包含两个分支:

1. `master` 分支
	1. **请勿在master分支上提交任何PR。**
2. `dev` 分支
	1. `dev`分支作为稳定的开发分支，经过测试后会在下一个版本合并到`master`分支。
	2. **PR应该在`dev`分支上提交。**


```
master
 ↑
dev   
 ↑ 
feature/bugfix PR
```  

### PR流程
TSW团队会查看所有的PR，我们会运行一些代码检查和测试，一经测试通过，我们会接受这次PR，但不会立即将代码合并到master分支上，会有一点延迟。

当您准备PR时，请确保已经完成以下几个步骤:

1. 将仓库fork下来并基于`master`分支创建您的开发分支。
2. 如果您更改了APIs请更新代码及文档。
3. 在您添加的每一个新文件头部加上版权声明。
4. 检查您的代码语法及格式。
5. 反复测试。
6. 现在，您可以开始在`dev`分支上PR了。

## 许可证
通过为TSW做出贡献，代表您同意将其版权归为TSW所有，TSW的开源协议为[MIT LICENSE](https://github.com/Tencent/TSW/blob/master/LICENSE)