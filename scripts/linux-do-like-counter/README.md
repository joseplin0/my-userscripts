# Linux Do 24小时点赞统计 (Linux Do 24h Like Counter)

一个轻量、安全、高性能的 Tampermonkey（油猴）脚本，用于在 [Linux.do](https://linux.do) 论坛统计并显示你过去 24 小时内的点赞数量。

## ✨ 核心特性

* **🛡️ 绝对安全，告别 403 报错**
  放弃了传统的 `fetch` / `XMLHttpRequest` 网络请求劫持方案，完全避免破坏 Discourse 论坛严苛的 CSRF 校验和上下文保护机制，100% 杜绝接口返回 403 Forbidden 错误。
* **⚡ 极致性能，零常驻开销**
  采用**全局事件委托 + 局部短时监听**的策略。平时没有任何 DOM 监控在后台运行；仅在点击“点赞”按钮的瞬间，唤醒一个寿命仅 5 秒的 `MutationObserver` 捕捉成功状态，用完即毁。不惧怕论坛的无限滚动动态加载。
* **🔋 零轮询，按需刷新**
  摒弃了 `setInterval` 定时器，数据统计完全由用户动作（点赞操作）驱动。悬浮窗本身也是一个按钮，点击即可手动计算并刷新 24 小时内的最新点赞数。
* **🔒 数据纯本地存储**
  所有的点赞时间戳均保存在浏览器的 `localStorage` 中，不依赖任何外部服务器，不申请多余的油猴权限（`@grant none`）。

## 📦 安装指南

1. **安装脚本管理器**：确保你的浏览器已安装 [Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/) 扩展。
2. **安装本脚本**：
   * 点击这里直接安装：[安装脚本](https://raw.githubusercontent.com/joseplin0/my-userscripts/main/linux-do-like-counter.user.js)
   * 或者，复制 `linux-do-like-counter.user.js` 中的代码，在脚本管理器中新建脚本并粘贴保存。

## 💡 使用说明

1. 正常访问并登录 Linux.do 论坛。
2. 页面右下角会出现一个带有 ❤️ 图标的深色悬浮小药丸，显示你 24 小时内的点赞数。
3. 当你点赞帖子并成功（按钮提示变为“移除此赞”）时，数字会自动 +1。
4. 如果你想查看剔除过期数据后的最新统计，只需**点击一下右下角的悬浮组件**即可刷新。

## 🛠️ 技术原理

Discourse 论坛是一个基于 Ember.js 的重度单页应用（SPA）。本脚本的监听逻辑如下：
1. 通过 `window` 接收全局点击事件（事件委托），识别出 class 为 `discourse-reactions-reaction-button` 且 title 包含“点赞”的按钮。
2. 为被点击的按钮挂载短时的 `MutationObserver`。
3. 当 Ember.js 接收到后端成功响应并驱动 DOM 将按钮 `title` 修改为“移除此赞”时，脚本精准捕获该变化，记录当前时间戳。
4. 超过 5 秒未变化自动销毁监听器，防止网络异常导致的内存泄漏。

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。欢迎提交 Issue 或 Pull Request！
