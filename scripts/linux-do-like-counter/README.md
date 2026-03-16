# Linux Do 24小时点赞统计 (Linux Do 24h Like Counter)

这是一个简单的 Tampermonkey/Violentmonkey 脚本，用来统计你在 [Linux.do](https://linux.do) 论坛里过去 24 小时内的点赞次数。

## ✅ 主要特点

- 只在你点赞时触发统计，平时不占用页面资源。
- 不进行网络请求劫持，不会引起 403 错误。
- 数据保存在本地 `localStorage`，不依赖外部服务器。
- 点击右下角悬浮按钮即可手动刷新统计结果。

## 🚀 安装步骤

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)。
2. 安装脚本

- 官方 GreasyFork 版（推荐）：[安装脚本](https://update.greasyfork.org/scripts/569787/Linux-Do-24小时点赞统计.user.js)
- GitHub 源码版： [安装脚本](https://raw.githubusercontent.com/joseplin0/my-userscripts/main/linux-do-like-counter.user.js)

## 📌 使用方式

1. 在浏览器中登录 Linux.do。
2. 页面右下角会出现一个带 ❤️ 的悬浮按钮，显示过去 24 小时的点赞数。
3. 点赞成功后，统计会自动更新；也可以直接点击悬浮按钮刷新。

## 📄 许可证

本项目采用 MIT 许可证（见 `LICENSE`）。欢迎反馈或提 PR。
