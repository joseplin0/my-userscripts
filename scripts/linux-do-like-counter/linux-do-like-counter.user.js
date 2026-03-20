// ==UserScript==
// @name         Linux Do 点赞计数器
// @namespace    https://github.com/joseplin0/my-userscripts
// @version      1.3.2
// @description  纯前端高性能监听 Linux Do 上的点赞操作，并在右下角显示今日点赞数量，悬浮展示24小时统计
// @author       joseplin0
// @author       Code assisted by Google Gemini
// @license      MIT
// @homepageURL  https://github.com/joseplin0/my-userscripts/tree/main/scripts/linux-do-like-counter
// @supportURL   https://github.com/joseplin0/my-userscripts/issues
// @match        https://linux.do/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linux.do
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  // 配置参数
  const STORAGE_KEY = "linux_do_like_history";
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  /**
   * 获取历史记录（对象字典）
   */
  function getHistory() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!data) return {};

      // 兼容迁移：如果旧数据是数组格式，将其转换为新的对象格式
      if (Array.isArray(data)) {
        const migratedData = {};
        data.forEach((time, index) => {
          migratedData["legacy_" + index + "_" + time] = {
            like: true,
            time: time,
          };
        });
        saveHistory(migratedData); // 顺手存一下转换后的格式
        return migratedData;
      }
      return data;
    } catch (e) {
      return {};
    }
  }

  /**
   * 保存历史记录
   */
  function saveHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  /**
   * 判断时间戳是否是“今天”
   */
  function isToday(timestamp) {
    return new Date(timestamp).toDateString() === new Date().toDateString();
  }

  /**
   * 记录一次新的点赞成功
   */
  function recordLikeSuccess(postId) {
    let history = getHistory();

    // 更新指定 ID 的状态为 true，并刷新时间
    if (history[postId]) {
      history[postId].like = true;
      history[postId].time = Date.now();
    } else {
      history[postId] = { like: true, time: Date.now() };
    }

    saveHistory(history);
    updateUI();

    // 触发一个简单的动效 (主按钮放大)
    const mainBtn = document.getElementById("linux-do-like-main");
    if (mainBtn) {
      mainBtn.style.transform = "scale(1.1)";
      setTimeout(() => {
        mainBtn.style.transform = "scale(1)";
      }, 200);
    }
  }

  /**
   * 初始化/创建 UI 元素
   */
  function createUI() {
    if (document.getElementById("linux-do-like-wrapper")) return;

    // 1. 创建最外层的容器
    const wrapper = document.createElement("div");
    wrapper.id = "linux-do-like-wrapper";
    wrapper.style.cssText = `
            position: fixed;
            bottom: 25px;
            right: 25px;
            z-index: 99999;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        `;

    // 2. 创建悬浮显示的 Popover 面板
    const popover = document.createElement("div");
    popover.id = "linux-do-like-popover";
    popover.style.cssText = `
            background-color: #222222;
            color: #ffffff;
            padding: 10px 16px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            margin-bottom: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(5px);
            transition: all 0.2s ease;
            pointer-events: none;
        `;

    // 3. 创建主按钮 (默认显示的胶囊)
    const mainBtn = document.createElement("div");
    mainBtn.id = "linux-do-like-main";
    mainBtn.style.cssText = `
            background-color: #333333;
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            user-select: none;
            transition: transform 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        `;

    // 绑定鼠标悬浮事件 (Hover 显示 Popover)
    wrapper.addEventListener("mouseenter", () => {
      popover.style.opacity = "1";
      popover.style.visibility = "visible";
      popover.style.transform = "translateY(0)";
    });

    wrapper.addEventListener("mouseleave", () => {
      popover.style.opacity = "0";
      popover.style.visibility = "hidden";
      popover.style.transform = "translateY(5px)";
    });

    // 绑定点击事件 (手动刷新并反馈动画)
    mainBtn.addEventListener("click", () => {
      refreshData();
      mainBtn.style.transform = "scale(0.95)";
      setTimeout(() => {
        mainBtn.style.transform = "scale(1)";
      }, 100);
    });

    // 组装 DOM
    wrapper.appendChild(popover);
    wrapper.appendChild(mainBtn);
    document.body.appendChild(wrapper);
  }

  /**
   * 更新 UI 显示的数据
   */
  function updateUI() {
    if (!document.getElementById("linux-do-like-wrapper")) {
      createUI();
    }

    const history = getHistory();
    const now = Date.now();

    // 只提取状态为成功 (like: true) 的记录进行统计
    const validLikes = Object.values(history).filter(
      (item) => item.like === true,
    );

    const count24h = validLikes.filter(
      (item) => now - item.time < ONE_DAY_MS,
    ).length;
    const countToday = validLikes.filter((item) => isToday(item.time)).length;

    // 获取 UI 元素
    const popover = document.getElementById("linux-do-like-popover");
    const mainBtn = document.getElementById("linux-do-like-main");

    // 更新主按钮 (今日点赞)
    mainBtn.innerHTML = `<span style="color: #e25555;">❤️</span> 今日点赞: <b>${countToday}</b>`;

    // 准备 Popover 数据数组，方便后续扩展
    const popoverStats = [
      { label: "24h点赞", value: count24h },
      // { label: '本周点赞', value: 0 } // 后续只需在这里添加对象即可
    ];

    // 动态渲染 Popover 列表
    popover.innerHTML = popoverStats
      .map(
        (stat) => `
            <div style="display: flex; justify-content: space-between; gap: 15px;">
                <span style="color: #aaaaaa;">${stat.label}</span>
                <b>${stat.value}</b>
            </div>
        `,
      )
      .join("");
  }

  /**
   * 手动刷新数据
   */
  function refreshData() {
    updateUI();
  }

  // ==========================================
  // 精确的点击驱动 + 局部状态监听 (最高性能方案)
  // ==========================================

  /**
   * 对特定被点击的按钮进行短时监听，等待其变为"移除此赞"
   */
  function watchButtonForSuccess(btn, postId) {
    // 防止对同一个按钮极速狂点产生多个监听器
    if (btn.dataset.watching === "true") return;
    btn.dataset.watching = "true";

    // 创建一个专用于这个按钮的观察者
    const observer = new MutationObserver((mutations, obs) => {
      for (let mutation of mutations) {
        if (mutation.attributeName === "title") {
          const newTitle = btn.getAttribute("title") || "";

          // 如果 title 成功变成了移除/撤销相关的文案，说明点赞请求成功并渲染完毕
          if (
            newTitle.includes("移除此赞") ||
            newTitle.includes("撤销") ||
            newTitle.toLowerCase().includes("undo")
          ) {
            recordLikeSuccess(postId);
            obs.disconnect(); // 记录成功后立即销毁监听器
            delete btn.dataset.watching; // 释放锁
            clearTimeout(timeoutId); // 清除超时定时器
          }
        }
      }
    });

    // 仅监听这一个按钮的 title 属性
    observer.observe(btn, {
      attributes: true,
      attributeFilter: ["title"],
    });

    // 设置 5 秒超时保护。如果 5 秒内接口没返回或报错导致 title 没变，自动销毁监听器，防止内存泄漏
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      delete btn.dataset.watching; // 释放锁
    }, 5000);
  }

  // 监听全局点击事件 (利用事件委托，不消耗额外性能)
  window.addEventListener(
    "click",
    (event) => {
      // 1. 先尝试从父级容器提取动态的 Post ID (防误点：通过具体的 id 结构匹配)
      const actionContainer = event.target.closest(
        'div[id^="discourse-reactions-actions-"]',
      );

      let postId = null;
      // 精确匹配并提取数字 ID
      const match = actionContainer.id.match(
        /discourse-reactions-actions-(\d+)-right/,
      );
      if (match) {
        postId = match[1];
      }

      // 2. 筛选出指定的反应按钮
      const btn = event.target.closest(
        "div.discourse-reactions-reaction-button",
      );
      if (!btn) return;

      const currentTitle = btn.getAttribute("title") || "";

      // 只有当按钮当前状态是“点赞此帖子”时，才启动短时监听去捕捉成功状态
      if (
        currentTitle.includes("点赞此帖子") ||
        currentTitle.toLowerCase().includes("like this post")
      ) {
        // 如果未能找到确切的 postId，生成一个带时间戳的随机 ID 兜底
        const finalPostId =
          postId ||
          "unknown_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substring(2, 6);

        // 记录初始点击动作 (like: false)
        let history = getHistory();
        history[finalPostId] = { like: false, time: Date.now() };
        saveHistory(history);

        watchButtonForSuccess(btn, finalPostId);
      }
    },
    true,
  );

  // ==========================================
  // 页面启动逻辑
  // ==========================================
  window.addEventListener("DOMContentLoaded", () => {
    // 初始化显示
    refreshData();
  });
})();
