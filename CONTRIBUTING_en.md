# Contributing to TSW
Welcome to [report Issues](https://github.com/Tencent/TSW/issues) or [pull requests](https://github.com/Tencent/TSW/pulls). It's recommended to read the following Contributing Guide first before contributing. 

## Issues
We use Github Issues to track public bugs and feature requests.

### Search Known Issues First
Please search the existing issues to see if any similar issue or feature request has already been filed. You should make sure your issue isn't redundant.

### Reporting New Issues
If you open an issue, the more information the better. Such as detailed description, code blocks of your problem.

## Pull Requests
We strongly welcome your pull request to make TSW better. 

### Branch Management
There are two main branches here:

1. `master` branch.
	1. **Don't submit any PR on `master` branch.**
2. `dev` branch. 
	1. It is our stable developing branch. After full testing, `dev` will be merged to `master` branch for the next release.
	2. **You are recommended to submit bugfix or feature PR on `dev` branch.**

Normal bugfix or feature request should be submitted to `dev` branch. After full testing, we will merge them to `master` branch for the next release. 

```
master
 ↑
dev   
 ↑ 
feature/bugfix PR
```  

### Make Pull Requests
The code team will monitor all pull request, we run some code check and test on it. After all tests passed, we will accecpt this PR. But it won't merge to `master` branch at once, which have some delay.

Before submitting a pull request, please make sure the followings are done:

1. Fork the repo and create your branch from `master`.
2. Update code or documentation if you have changed APIs.
3. Add the copyright notice to the top of any new files you've added.
4. Check your code lints and checkstyles.
5. Test and test again your code.
6. Now, you can submit your pull request on `dev`.

## License
By contributing to TSW, you agree that your contributions will be licensed
under its [MIT LICENSE](https://github.com/Tencent/TSW/blob/master/LICENSE)