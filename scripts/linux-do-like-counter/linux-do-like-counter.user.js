// ==UserScript==
// @name         Linux Do 24小时点赞统计 (安全版)
// @namespace    https://github.com/joseplin0/my-userscripts
// @version      1.1
// @description  纯前端高性能监听 Linux Do 上的点赞操作，并在右下角显示过去24小时内的点赞数量
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

(function() {
    'use strict';

    // 配置参数
    const STORAGE_KEY = 'linux_do_like_history';
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // UI 元素
    let countDisplayEl = null;
    let lastClickTime = 0;

    /**
     * 获取历史记录（时间戳数组）
     */
    function getHistory() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * 保存历史记录
     */
    function saveHistory(history) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    /**
     * 记录一次新的点赞
     */
    function recordLike() {
        // 简单防抖，防止双击造成重复计算
        const now = Date.now();
        if (now - lastClickTime < 1000) return;
        lastClickTime = now;

        let history = getHistory();
        history.push(now);
        // 不再清理旧数据，将所有历史记录永久保存到 localStorage
        saveHistory(history);
        updateUI();

        // 触发一个简单的动效
        if (countDisplayEl) {
            countDisplayEl.style.transform = 'scale(1.1)';
            setTimeout(() => {
                countDisplayEl.style.transform = 'scale(1)';
            }, 200);
        }
    }

    /**
     * 初始化/创建 UI 元素
     */
    function createUI() {
        if (document.getElementById('linux-do-like-counter')) return;

        countDisplayEl = document.createElement('div');
        countDisplayEl.id = 'linux-do-like-counter';
        countDisplayEl.style.cssText = `
            position: fixed;
            bottom: 25px;
            right: 25px;
            background-color: #333333;
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-family: system-ui, -apple-system, sans-serif;
            z-index: 99999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            user-select: none;
            transition: transform 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        `;

        // 点击组件手动刷新数据并添加点击反馈动画
        countDisplayEl.addEventListener('click', () => {
            refreshData();
            countDisplayEl.style.transform = 'scale(0.95)';
            setTimeout(() => {
                countDisplayEl.style.transform = 'scale(1)';
            }, 100);
        });

        document.body.appendChild(countDisplayEl);
    }

    /**
     * 更新 UI 显示的数字
     */
    function updateUI() {
        if (!document.getElementById('linux-do-like-counter')) {
            createUI();
        }

        // 动态过滤出 24 小时内的数据用于统计，不再覆盖或修改本地存储
        const history = getHistory();
        const now = Date.now();
        const count = history.filter(timestamp => now - timestamp < ONE_DAY_MS).length;

        countDisplayEl.innerHTML = `<span style="color: #e25555;">❤️</span> 24h点赞: <b>${count}</b>`;
    }

    /**
     * 定时刷新数据
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
    function watchButtonForSuccess(btn) {
        // 创建一个专用于这个按钮的观察者
        const observer = new MutationObserver((mutations, obs) => {
            for (let mutation of mutations) {
                if (mutation.attributeName === 'title') {
                    const newTitle = btn.getAttribute('title') || '';

                    // 如果 title 成功变成了移除/撤销相关的文案，说明点赞请求成功并渲染完毕
                    if (newTitle.includes('移除此赞') || newTitle.includes('撤销') || newTitle.toLowerCase().includes('undo')) {
                        recordLike();
                        obs.disconnect(); // 记录成功后立即销毁监听器
                        clearTimeout(timeoutId); // 清除超时定时器
                    }
                }
            }
        });

        // 仅监听这一个按钮的 title 属性
        observer.observe(btn, {
            attributes: true,
            attributeFilter: ['title']
        });

        // 设置 5 秒超时保护。如果 5 秒内接口没返回或报错导致 title 没变，自动销毁监听器，防止内存泄漏
        const timeoutId = setTimeout(() => {
            observer.disconnect();
        }, 5000);
    }

    // 监听全局点击事件 (利用事件委托，不消耗额外性能)
    window.addEventListener('click', (event) => {
        // 只筛选出指定的反应按钮
        const btn = event.target.closest('div.discourse-reactions-reaction-button');
        if (!btn) return;

        const currentTitle = btn.getAttribute('title') || '';

        // 只有当按钮当前状态是“点赞此帖子”时，才启动短时监听去捕捉成功状态
        if (currentTitle.includes('点赞此帖子') || currentTitle.toLowerCase().includes('like this post')) {
            watchButtonForSuccess(btn);
        }
    }, true);


    // ==========================================
    // 页面启动逻辑
    // ==========================================
    window.addEventListener('DOMContentLoaded', () => {
        // 初始化显示
        refreshData();

        // 移除了自动刷新的 setInterval，改为仅在点赞或点击组件时更新
    });

})();
