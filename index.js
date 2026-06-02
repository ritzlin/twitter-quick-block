// ==UserScript==
// @name         Twitter Quick Block
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a one-click block button next to each tweet's "…" menu
// @match        https://x.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const PROCESSED_ATTR = 'data-quick-block';

    // Waits for a selector to appear in the DOM, resolves null on timeout
    function waitForElement(selector, timeout = 2000) {
        return new Promise(resolve => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            const obs = new MutationObserver(() => {
                const found = document.querySelector(selector);
                if (found) { obs.disconnect(); resolve(found); }
            });
            obs.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => { obs.disconnect(); resolve(null); }, timeout);
        });
    }

    // Opens the "…" menu, clicks Block, then confirms
    async function doBlock(caretBtn) {
        caretBtn.click();

        const blockItem = await waitForElement('[data-testid="block"]');
        if (!blockItem) return;
        blockItem.click();

        // Twitter shows a confirmation sheet before blocking
        const confirmBtn = await waitForElement('[data-testid="confirmationSheetConfirm"]');
        if (confirmBtn) confirmBtn.click();
    }

    function addBlockButton(tweet) {
        if (tweet.hasAttribute(PROCESSED_ATTR)) return;
        tweet.setAttribute(PROCESSED_ATTR, '1');

        const caret = tweet.querySelector('[data-testid="caret"]');
        if (!caret) return;

        const btn = document.createElement('button');
        btn.title = 'Quick Block';
        // Same SVG Twitter uses for the block icon
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 3.75c-4.55 0-8.25 3.69-8.25 8.25 0 1.92.66 3.68 1.75
            5.08L17.09 5.5C15.68 4.4 13.92 3.75 12 3.75zm6.5 3.17L6.92 18.5c1.4
            1.1 3.16 1.75 5.08 1.75 4.56 0 8.25-3.69 8.25-8.25 0-1.92-.65-3.68
            -1.75-5.08zM1.75 12C1.75 6.34 6.34 1.75 12 1.75S22.25 6.34 22.25 12
            17.66 22.25 12 22.25 1.75 17.66 1.75 12z"/>
        </svg>`;

        Object.assign(btn.style, {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            color: '#536471',
            opacity: '0.6',
            transition: 'color .15s, background-color .15s, opacity .15s',
        });
        btn.addEventListener('mouseenter', () => {
            btn.style.color = '#f4212e';
            btn.style.backgroundColor = 'rgba(244,33,46,0.1)';
            btn.style.opacity = '1';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.color = '#536471';
            btn.style.backgroundColor = '';
            btn.style.opacity = '0.6';
        });
        btn.addEventListener('click', e => {
            e.stopPropagation();
            e.preventDefault();
            doBlock(caret);
        });

        caret.insertAdjacentElement('beforebegin', btn);
    }

    // Debounced scan for newly rendered tweets (handles infinite scroll / React re-renders)
    let debounceTimer;
    function processAll() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            document.querySelectorAll('article[data-testid="tweet"]').forEach(addBlockButton);
        }, 100);
    }

    processAll();
    new MutationObserver(processAll).observe(document.body, { childList: true, subtree: true });
})();