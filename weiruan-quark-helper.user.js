// ==UserScript==
// @name         威软夸克助手
// @namespace    Weiruan-Quark-Helper
// @version      1.0.7
// @description  夸克网盘增强下载助手。支持批量下载、直链导出、aria2/IDM/cURL、下载历史、文件过滤、深色模式、快捷键操作。
// @author       威软科技
// @license      MIT
// @icon         https://pan.quark.cn/favicon.ico
// @match        *://pan.quark.cn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-end
// @connect      drive.quark.cn
// @homepage     https://github.com/weiruankeji2025/weiruan-quark
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置 ====================
    const CONFIG = {
        // 个人网盘下载 API
        API: "https://drive.quark.cn/1/clouddrive/file/download?pr=ucpro&fr=pc",
        // 分享页面下载 API (POST)
        SHARE_DOWNLOAD_API: "https://drive.quark.cn/1/clouddrive/share/sharepage/download?pr=ucpro&fr=pc",
        UA: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch",
        DEPTH: 25,
        VERSION: "1.0.7",
        DEBUG: false, // 调试模式
        HISTORY_MAX: 100,
        SHORTCUTS: {
            DOWNLOAD: 'ctrl+d',
            CLOSE: 'Escape'
        }
    };

    // ==================== 国际化 ====================
    const i18n = {
        zh: {
            title: '威软夸克助手',
            downloadHelper: '下载助手',
            processing: '处理中...',
            success: '解析成功',
            error: '错误',
            noFiles: '请先勾选需要下载的文件',
            networkError: '网络请求失败，请检查网络',
            parseError: '解析失败',
            copied: '已复制到剪贴板',
            copyAll: '复制全部链接',
            copyAria2: '导出 aria2',
            copyCurl: '导出 cURL',
            download: '下载',
            fileName: '文件名',
            fileSize: '大小',
            action: '操作',
            history: '历史记录',
            clearHistory: '清空历史',
            settings: '设置',
            darkMode: '深色模式',
            language: '语言',
            filterByType: '按类型筛选',
            filterBySize: '按大小筛选',
            all: '全部',
            video: '视频',
            audio: '音频',
            image: '图片',
            document: '文档',
            archive: '压缩包',
            other: '其他',
            noHistory: '暂无下载历史',
            close: '关闭',
            files: '个文件',
            idmTip: 'IDM UA: quark-cloud-drive/2.5.20',
            quickDownload: '快速下载',
            batchExport: '批量导出',
            totalSize: '总大小',
            selectAll: '全选',
            deselectAll: '取消全选',
            confirm: '确定',
            cancel: '取消',
            auto: '跟随系统',
            light: '浅色',
            dark: '深色'
        },
        en: {
            title: 'Weiruan Quark Helper',
            downloadHelper: 'Download Helper',
            processing: 'Processing...',
            success: 'Parse Success',
            error: 'Error',
            noFiles: 'Please select files to download',
            networkError: 'Network error, please check connection',
            parseError: 'Parse failed',
            copied: 'Copied to clipboard',
            copyAll: 'Copy All Links',
            copyAria2: 'Export aria2',
            copyCurl: 'Export cURL',
            download: 'Download',
            fileName: 'Filename',
            fileSize: 'Size',
            action: 'Action',
            history: 'History',
            clearHistory: 'Clear History',
            settings: 'Settings',
            darkMode: 'Dark Mode',
            language: 'Language',
            filterByType: 'Filter by Type',
            filterBySize: 'Filter by Size',
            all: 'All',
            video: 'Video',
            audio: 'Audio',
            image: 'Image',
            document: 'Document',
            archive: 'Archive',
            other: 'Other',
            noHistory: 'No download history',
            close: 'Close',
            files: 'files',
            idmTip: 'IDM UA: quark-cloud-drive/2.5.20',
            quickDownload: 'Quick Download',
            batchExport: 'Batch Export',
            totalSize: 'Total Size',
            selectAll: 'Select All',
            deselectAll: 'Deselect All',
            confirm: 'Confirm',
            cancel: 'Cancel',
            auto: 'Auto',
            light: 'Light',
            dark: 'Dark'
        }
    };

    // ==================== 状态管理 ====================
    const State = {
        lang: GM_getValue('weiruan_lang', 'zh'),
        theme: GM_getValue('weiruan_theme', 'auto'),
        history: GM_getValue('weiruan_history', []),

        getLang() {
            return i18n[this.lang] || i18n.zh;
        },

        setLang(lang) {
            this.lang = lang;
            GM_setValue('weiruan_lang', lang);
        },

        setTheme(theme) {
            this.theme = theme;
            GM_setValue('weiruan_theme', theme);
            UI.applyTheme();
        },

        isDark() {
            if (this.theme === 'auto') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            return this.theme === 'dark';
        },

        addHistory(files) {
            const newHistory = files.map(f => ({
                name: f.file_name,
                size: f.size,
                time: Date.now()
            }));
            this.history = [...newHistory, ...this.history].slice(0, CONFIG.HISTORY_MAX);
            GM_setValue('weiruan_history', this.history);
        },

        clearHistory() {
            this.history = [];
            GM_setValue('weiruan_history', []);
        }
    };

    // ==================== 工具函数 ====================
    const Utils = {
        log: (...args) => {
            if (CONFIG.DEBUG) {
                console.log('[威软夸克助手]', ...args);
            }
        },

        // 检测是否在分享页面
        isSharePage: () => {
            return location.pathname.includes('/s/') || location.search.includes('pwd_id');
        },

        // 获取分享页面参数
        getShareParams: () => {
            // 从 URL 获取 pwd_id
            let pwdId = null;
            const pathMatch = location.pathname.match(/\/s\/([a-zA-Z0-9]+)/);
            if (pathMatch) {
                pwdId = pathMatch[1];
            } else {
                const urlParams = new URLSearchParams(location.search);
                pwdId = urlParams.get('pwd_id');
            }

            // 从 cookie 或页面获取 stoken
            let stoken = '';
            const stokenMatch = document.cookie.match(/__puus=([^;]+)/);
            if (stokenMatch) {
                stoken = decodeURIComponent(stokenMatch[1]);
            }

            // 尝试从页面 window 对象获取
            if (!stoken && unsafeWindow?.__INITIAL_STATE__?.shareToken) {
                stoken = unsafeWindow.__INITIAL_STATE__.shareToken;
            }

            // 从页面 script 标签中查找
            if (!stoken) {
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    const match = script.textContent?.match(/stoken["']?\s*[:=]\s*["']([^"']+)["']/);
                    if (match) {
                        stoken = match[1];
                        break;
                    }
                }
            }

            console.log('[威软夸克助手] 分享参数:', { pwdId, stoken: stoken ? '已获取' : '未获取' });
            return { pwdId, stoken };
        },

        // 从 React Fiber 中提取文件信息
        getFidFromFiber: (dom) => {
            if (!dom) return null;

            // 尝试从当前元素及其父元素查找
            let currentDom = dom;
            for (let domAttempt = 0; domAttempt < 10 && currentDom; domAttempt++) {
                const key = Object.keys(currentDom).find(k =>
                    k.startsWith('__reactFiber$') ||
                    k.startsWith('__reactInternalInstance$') ||
                    k.startsWith('__reactProps$')
                );

                if (key) {
                    let fiber = currentDom[key];
                    let attempts = 0;

                    while (fiber && attempts < CONFIG.DEPTH) {
                        const props = fiber.memoizedProps || fiber.pendingProps || fiber;

                        // 尝试多种可能的属性名
                        const candidates = [
                            props?.record,
                            props?.file,
                            props?.item,
                            props?.data,
                            props?.node,
                            props?.fileInfo,
                            props?.fileData,
                            props?.children?.props?.record,
                            props?.children?.props?.file,
                            fiber?.memoizedState?.memoizedState,
                            fiber?.stateNode?.props?.record,
                            fiber?.stateNode?.props?.file
                        ].filter(Boolean);

                        for (const candidate of candidates) {
                            if (candidate && (candidate.fid || candidate.id || candidate.file_id)) {
                                // 判断是否为文件夹 - 更保守的判断
                                const isDirectory =
                                    candidate.dir === true ||
                                    candidate.is_dir === true ||
                                    candidate.type === 'folder' ||
                                    candidate.obj_category === 'folder' ||
                                    (candidate.category !== undefined && candidate.category === 0);

                                const fileData = {
                                    fid: candidate.fid || candidate.id || candidate.file_id,
                                    name: candidate.file_name || candidate.name || candidate.title || candidate.fileName || "未命名文件",
                                    isDir: isDirectory,
                                    size: candidate.size || candidate.file_size || 0,
                                    download_url: candidate.download_url
                                };
                                Utils.log('找到文件:', fileData.name, 'isDir:', fileData.isDir, '原始数据:', candidate);
                                return fileData;
                            }
                        }

                        fiber = fiber.return;
                        attempts++;
                    }
                }
                currentDom = currentDom.parentElement;
            }
            return null;
        },

        // 从行元素中提取文件信息
        getFileFromRow: (row) => {
            if (!row) return null;

            // 方法1: 从 React Fiber 获取
            const fiberData = Utils.getFidFromFiber(row);
            if (fiberData) return fiberData;

            // 方法2: 从 data 属性获取
            const dataFid = row.getAttribute('data-fid') || row.getAttribute('data-id') || row.getAttribute('data-file-id');
            if (dataFid) {
                const fileName = row.querySelector('.file-name, .name, [class*="fileName"], [class*="file_name"]')?.textContent?.trim();
                return {
                    fid: dataFid,
                    name: fileName || '未命名文件',
                    isDir: row.classList.contains('folder') || row.getAttribute('data-type') === 'folder',
                    size: 0
                };
            }

            // 方法3: 遍历子元素查找
            const allElements = row.querySelectorAll('*');
            for (const el of allElements) {
                const data = Utils.getFidFromFiber(el);
                if (data) return data;
            }

            return null;
        },

        post: (url, data) => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: url,
                    headers: {
                        "Content-Type": "application/json",
                        "User-Agent": CONFIG.UA,
                        "Cookie": document.cookie
                    },
                    data: JSON.stringify(data),
                    responseType: 'json',
                    withCredentials: true,
                    onload: res => {
                        if (res.status === 200) {
                            resolve(res.response);
                        } else {
                            reject(res);
                        }
                    },
                    onerror: err => reject(err)
                });
            });
        },

        formatSize: (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024, i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
        },

        formatDate: (timestamp) => {
            const d = new Date(timestamp);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        },

        getFileType: (filename) => {
            const ext = filename.split('.').pop().toLowerCase();
            const types = {
                video: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'rmvb', 'rm', 'm4v', '3gp'],
                audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'ape'],
                image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff'],
                document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv'],
                archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz']
            };

            for (const [type, exts] of Object.entries(types)) {
                if (exts.includes(ext)) return type;
            }
            return 'other';
        },

        getFileIcon: (filename) => {
            const type = Utils.getFileType(filename);
            const icons = {
                video: '🎬',
                audio: '🎵',
                image: '🖼️',
                document: '📄',
                archive: '📦',
                other: '📁'
            };
            return icons[type] || '📁';
        },

        generateBatchLinks: (files) => {
            return files.map(f => f.download_url).join('\n');
        },

        generateAria2Commands: (files) => {
            return files.map(f => {
                const ua = CONFIG.UA;
                return `aria2c -c -x 16 -s 16 "${f.download_url}" -o "${f.file_name}" -U "${ua}" --header="Cookie: ${document.cookie}"`;
            }).join('\n\n');
        },

        generateCurlCommands: (files) => {
            return files.map(f => {
                const ua = CONFIG.UA;
                return `curl -L -C - "${f.download_url}" -o "${f.file_name}" -A "${ua}" -b "${document.cookie}"`;
            }).join('\n\n');
        },

        toast: (msg, type = 'success') => {
            const existingToast = document.querySelector('.weiruan-toast');
            if (existingToast) existingToast.remove();

            const div = document.createElement('div');
            div.className = 'weiruan-toast';
            div.innerText = msg;

            const colors = {
                success: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                error: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
                info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            };

            div.style.cssText = `
                position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
                background: ${colors[type] || colors.success};
                color: white; padding: 12px 24px; border-radius: 8px; z-index: 2147483649;
                font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.25);
                animation: weiruan-toast-in 0.3s ease-out;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            document.body.appendChild(div);
            setTimeout(() => {
                div.style.animation = 'weiruan-toast-out 0.3s ease-out forwards';
                setTimeout(() => div.remove(), 300);
            }, 2500);
        },

        debounce: (fn, delay) => {
            let timer = null;
            return function(...args) {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        }
    };

    // ==================== 应用逻辑 ====================
    const App = {
        // 从全局状态获取选中的文件（解决虚拟滚动问题）
        getSelectedFilesFromState: () => {
            const files = [];

            try {
                // 方法1: 从 Redux store 获取
                const win = unsafeWindow || window;

                // 尝试获取 Redux store
                if (win.__REDUX_STORE__ || win.store || win.__store__) {
                    const store = win.__REDUX_STORE__ || win.store || win.__store__;
                    const state = store.getState?.();
                    Utils.log('Redux state:', state);

                    if (state?.file?.selectedFiles) {
                        return state.file.selectedFiles;
                    }
                    if (state?.selection?.selected) {
                        return state.selection.selected;
                    }
                }

                // 方法2: 从 React 根节点获取状态
                const rootEl = document.getElementById('root') || document.getElementById('app');
                if (rootEl) {
                    const fiberKey = Object.keys(rootEl).find(k =>
                        k.startsWith('__reactContainer$') ||
                        k.startsWith('__reactFiber$')
                    );

                    if (fiberKey) {
                        let fiber = rootEl[fiberKey];
                        let attempts = 0;

                        while (fiber && attempts < 50) {
                            const state = fiber.memoizedState;

                            // 查找包含选中文件信息的状态
                            if (state?.memoizedState?.selectedKeys ||
                                state?.memoizedState?.selectedRowKeys ||
                                state?.memoizedState?.checkedKeys) {
                                Utils.log('找到选中状态:', state.memoizedState);
                            }

                            // 查找文件列表状态
                            if (state?.memoizedState?.fileList ||
                                state?.memoizedState?.dataSource ||
                                state?.memoizedState?.list) {
                                const fileList = state.memoizedState.fileList ||
                                                state.memoizedState.dataSource ||
                                                state.memoizedState.list;
                                Utils.log('找到文件列表:', fileList?.length);
                            }

                            fiber = fiber.child || fiber.sibling || fiber.return;
                            attempts++;
                        }
                    }
                }

                // 方法3: 从全局变量获取
                const possibleVars = ['__INITIAL_STATE__', '__DATA__', '__APP_DATA__', 'pageData', 'appData'];
                for (const varName of possibleVars) {
                    if (win[varName]) {
                        Utils.log(`全局变量 ${varName}:`, win[varName]);
                        const data = win[varName];
                        if (data.selectedFiles) return data.selectedFiles;
                        if (data.file?.selectedFiles) return data.file.selectedFiles;
                        if (data.list?.selectedFiles) return data.list.selectedFiles;
                    }
                }

                // 方法4: 尝试从表格组件获取（Ant Design Table）
                const tableWrapper = document.querySelector('.ant-table-wrapper, [class*="table-wrapper"]');
                if (tableWrapper) {
                    const tableKey = Object.keys(tableWrapper).find(k =>
                        k.startsWith('__reactFiber$') || k.startsWith('__reactProps$')
                    );

                    if (tableKey) {
                        let fiber = tableWrapper[tableKey];
                        let attempts = 0;

                        while (fiber && attempts < 30) {
                            const props = fiber.memoizedProps || fiber.pendingProps;

                            // Ant Design Table 的 dataSource 和 selectedRowKeys
                            if (props?.dataSource && Array.isArray(props.dataSource)) {
                                const selectedKeys = props.rowSelection?.selectedRowKeys ||
                                                    props.selectedRowKeys || [];
                                Utils.log('Table dataSource:', props.dataSource.length, '选中:', selectedKeys.length);

                                if (selectedKeys.length > 0) {
                                    const selectedFiles = props.dataSource.filter(item =>
                                        selectedKeys.includes(item.fid || item.id || item.key)
                                    );

                                    if (selectedFiles.length > 0) {
                                        return selectedFiles.map(f => ({
                                            fid: f.fid || f.id || f.file_id,
                                            name: f.file_name || f.name || f.fileName || '未命名',
                                            isDir: f.dir === true || f.is_dir === true || f.type === 'folder',
                                            size: f.size || f.file_size || 0,
                                            download_url: f.download_url
                                        }));
                                    }
                                }
                            }

                            fiber = fiber.return;
                            attempts++;
                        }
                    }
                }

            } catch (e) {
                Utils.log('从状态获取文件失败:', e);
            }

            return files;
        },

        // 深度遍历 React Fiber 树获取所有选中文件
        getSelectedFilesFromFiberTree: () => {
            const files = [];
            const visited = new Set();

            try {
                const win = unsafeWindow || window;

                // 查找包含文件列表的组件
                const containers = document.querySelectorAll(
                    '.file-list, [class*="fileList"], [class*="FileList"], ' +
                    '.ant-table-body, [class*="table"], [class*="list-view"], ' +
                    '[class*="ListView"], [class*="content-list"]'
                );

                for (const container of containers) {
                    const key = Object.keys(container).find(k =>
                        k.startsWith('__reactFiber$') ||
                        k.startsWith('__reactInternalInstance$')
                    );

                    if (!key) continue;

                    // BFS 遍历 Fiber 树
                    const queue = [container[key]];
                    let iterations = 0;
                    const maxIterations = 500;

                    while (queue.length > 0 && iterations < maxIterations) {
                        iterations++;
                        const fiber = queue.shift();
                        if (!fiber || visited.has(fiber)) continue;
                        visited.add(fiber);

                        // 检查 memoizedProps
                        const props = fiber.memoizedProps || fiber.pendingProps || {};

                        // 查找 dataSource（完整数据列表）
                        if (props.dataSource && Array.isArray(props.dataSource) && props.dataSource.length > 0) {
                            const selectedKeys = props.rowSelection?.selectedRowKeys ||
                                                props.selectedRowKeys ||
                                                props.checkedKeys || [];

                            Utils.log('找到 dataSource:', props.dataSource.length, '选中keys:', selectedKeys.length);

                            if (selectedKeys.length > 0) {
                                for (const item of props.dataSource) {
                                    const itemKey = item.fid || item.id || item.key || item.file_id;
                                    if (selectedKeys.includes(itemKey)) {
                                        files.push({
                                            fid: item.fid || item.id || item.file_id,
                                            name: item.file_name || item.name || item.fileName || '未命名',
                                            isDir: item.dir === true || item.is_dir === true ||
                                                   item.type === 'folder' || item.obj_category === 'folder',
                                            size: item.size || item.file_size || 0,
                                            download_url: item.download_url
                                        });
                                    }
                                }
                            }
                        }

                        // 查找文件列表数据
                        if (props.list && Array.isArray(props.list)) {
                            Utils.log('找到 list:', props.list.length);
                        }

                        // 查找 items
                        if (props.items && Array.isArray(props.items)) {
                            Utils.log('找到 items:', props.items.length);
                        }

                        // 检查 memoizedState
                        let state = fiber.memoizedState;
                        while (state) {
                            if (state.memoizedState) {
                                const ms = state.memoizedState;
                                // 查找选中状态
                                if (ms.selectedRowKeys || ms.selectedKeys || ms.checkedKeys) {
                                    Utils.log('State 中找到选中keys:', ms.selectedRowKeys || ms.selectedKeys || ms.checkedKeys);
                                }
                                // 查找文件数据
                                if (ms.fileList || ms.dataSource || ms.list) {
                                    Utils.log('State 中找到文件列表');
                                }
                            }
                            state = state.next;
                        }

                        // 添加子节点到队列
                        if (fiber.child) queue.push(fiber.child);
                        if (fiber.sibling) queue.push(fiber.sibling);
                        if (fiber.return && !visited.has(fiber.return)) queue.push(fiber.return);
                    }
                }

                // 去重
                const uniqueFiles = [];
                const seenFids = new Set();
                for (const f of files) {
                    if (!seenFids.has(f.fid)) {
                        seenFids.add(f.fid);
                        uniqueFiles.push(f);
                    }
                }

                return uniqueFiles;

            } catch (e) {
                Utils.log('Fiber树遍历失败:', e);
            }

            return files;
        },

        getSelectedFiles: () => {
            const selectedFiles = new Map();

            // 方法1: 从全局状态获取（解决虚拟滚动问题）
            const stateFiles = App.getSelectedFilesFromState();
            if (stateFiles.length > 0) {
                Utils.log('从状态获取到文件:', stateFiles.length);
                stateFiles.forEach(f => {
                    if (f.fid && !selectedFiles.has(f.fid)) {
                        selectedFiles.set(f.fid, f);
                    }
                });
            }

            // 方法2: 从 Fiber 树深度遍历获取
            if (selectedFiles.size === 0) {
                const fiberFiles = App.getSelectedFilesFromFiberTree();
                if (fiberFiles.length > 0) {
                    Utils.log('从Fiber树获取到文件:', fiberFiles.length);
                    fiberFiles.forEach(f => {
                        if (f.fid && !selectedFiles.has(f.fid)) {
                            selectedFiles.set(f.fid, f);
                        }
                    });
                }
            }

            // 方法3: 从DOM获取（可见的文件）
            // 选择器列表 - 覆盖各种可能的选中状态
            const checkboxSelectors = [
                // Ant Design 复选框
                '.ant-checkbox-wrapper-checked',
                '.ant-checkbox-checked',
                '[class*="checkbox"][class*="checked"]',
                // 选中状态的行
                '.file-item-selected',
                '[class*="selected"]',
                '[class*="active"]',
                // aria 属性
                '[aria-checked="true"]',
                '[aria-selected="true"]',
                // 夸克特定选择器
                '.file-list-item.selected',
                '.list-item.selected',
                '[class*="fileItem"][class*="selected"]',
                '[class*="file-item"][class*="selected"]',
                // 复选框输入
                'input[type="checkbox"]:checked'
            ];

            // 行容器选择器
            const rowSelectors = [
                '.ant-table-row',
                '.file-list-item',
                '.file-item',
                '.list-item',
                '[class*="fileItem"]',
                '[class*="file-item"]',
                '[class*="ListItem"]',
                '[class*="tableRow"]',
                'tr[data-row-key]',
                '[data-fid]',
                '[data-id]'
            ];

            Utils.log('开始查找选中的文件...');

            // 方法1: 通过选中的复选框查找
            for (const selector of checkboxSelectors) {
                try {
                    const elements = document.querySelectorAll(selector);
                    Utils.log(`选择器 "${selector}" 找到 ${elements.length} 个元素`);

                    elements.forEach(el => {
                        // 跳过表头
                        if (el.closest('.ant-table-thead') ||
                            el.closest('.list-head') ||
                            el.closest('[class*="header"]') ||
                            el.closest('[class*="Header"]')) {
                            return;
                        }

                        // 找到所属的行
                        let row = el;
                        for (const rowSelector of rowSelectors) {
                            const found = el.closest(rowSelector);
                            if (found) {
                                row = found;
                                break;
                            }
                        }

                        // 尝试获取文件数据
                        const fileData = Utils.getFileFromRow(row) || Utils.getFidFromFiber(el);
                        if (fileData && fileData.fid && !selectedFiles.has(fileData.fid)) {
                            Utils.log('找到选中文件:', fileData.name);
                            selectedFiles.set(fileData.fid, fileData);
                        }
                    });
                } catch (e) {
                    Utils.log('选择器错误:', selector, e);
                }
            }

            // 方法2: 直接查找带有选中样式的行
            if (selectedFiles.size === 0) {
                Utils.log('方法1未找到文件，尝试方法2...');
                for (const rowSelector of rowSelectors) {
                    try {
                        const rows = document.querySelectorAll(rowSelector);
                        rows.forEach(row => {
                            // 检查行是否有选中样式
                            const isSelected = row.classList.contains('selected') ||
                                row.classList.contains('checked') ||
                                row.classList.contains('active') ||
                                row.querySelector('.ant-checkbox-checked') ||
                                row.querySelector('[aria-checked="true"]') ||
                                row.querySelector('input:checked');

                            if (isSelected) {
                                const fileData = Utils.getFileFromRow(row);
                                if (fileData && fileData.fid && !selectedFiles.has(fileData.fid)) {
                                    selectedFiles.set(fileData.fid, fileData);
                                }
                            }
                        });
                    } catch (e) {
                        Utils.log('行选择器错误:', rowSelector, e);
                    }
                }
            }

            // 方法3: 扫描所有可能的文件元素，检查视觉选中状态
            if (selectedFiles.size === 0) {
                Utils.log('方法2未找到文件，尝试方法3...');
                const allRows = document.querySelectorAll('[class*="file"], [class*="File"], [class*="item"], [class*="Item"], [class*="row"], [class*="Row"]');
                allRows.forEach(row => {
                    // 检查复选框
                    const checkbox = row.querySelector('input[type="checkbox"], .ant-checkbox, [class*="checkbox"], [class*="Checkbox"]');
                    if (checkbox) {
                        const isChecked = checkbox.checked ||
                            checkbox.classList.contains('ant-checkbox-checked') ||
                            checkbox.closest('.ant-checkbox-wrapper-checked') ||
                            checkbox.getAttribute('aria-checked') === 'true';

                        if (isChecked) {
                            const fileData = Utils.getFileFromRow(row);
                            if (fileData && fileData.fid && !selectedFiles.has(fileData.fid)) {
                                selectedFiles.set(fileData.fid, fileData);
                            }
                        }
                    }
                });
            }

            Utils.log(`共找到 ${selectedFiles.size} 个选中的文件`);
            return Array.from(selectedFiles.values());
        },

        run: async (filterType = 'all') => {
            const btn = document.getElementById('weiruan-btn');
            const L = State.getLang();

            try {
                let files = App.getSelectedFiles();
                console.log('[威软夸克助手] 找到的原始文件:', files);
                console.log('[威软夸克助手] 文件详情:', files.map(f => ({name: f.name, isDir: f.isDir, fid: f.fid})));

                const beforeFilterCount = files.length;
                files = files.filter(f => !f.isDir);
                console.log(`[威软夸克助手] 过滤文件夹后: ${beforeFilterCount} -> ${files.length}`);

                // 应用文件类型过滤
                if (filterType !== 'all') {
                    files = files.filter(f => Utils.getFileType(f.name) === filterType);
                }

                if (files.length === 0) {
                    // 提供更详细的错误信息
                    const checkboxCount = document.querySelectorAll('.ant-checkbox-checked, .ant-checkbox-wrapper-checked, [aria-checked="true"]').length;
                    if (checkboxCount > 0) {
                        Utils.toast('检测到选中项，但无法获取文件信息。请尝试刷新页面后重试', 'error');
                    } else {
                        Utils.toast(L.noFiles, 'error');
                    }
                    return;
                }

                if (btn) {
                    btn.innerHTML = `<span class="weiruan-spinner"></span> ${L.processing}`;
                    btn.disabled = true;
                }

                let res;
                const isShare = Utils.isSharePage();
                console.log('[威软夸克助手] 页面类型:', isShare ? '分享页面' : '个人网盘');
                console.log('[威软夸克助手] 准备请求API, fids:', files.map(f => f.fid));

                if (isShare) {
                    // 分享页面处理
                    const { pwdId, stoken } = Utils.getShareParams();
                    console.log('[威软夸克助手] 分享信息:', { pwdId, hasStoken: !!stoken });

                    // 方法1: 先尝试标准下载API（如果用户已登录可能直接可用）
                    console.log('[威软夸克助手] 尝试标准API...');
                    res = await Utils.post(CONFIG.API, { fids: files.map(f => f.fid) });
                    console.log('[威软夸克助手] 标准API返回:', res);

                    // 方法2: 如果标准API失败，检查文件是否已有下载链接
                    if (!res || res.code !== 0 || !res.data || res.data.length === 0) {
                        console.log('[威软夸克助手] 标准API未返回数据，检查文件自带的下载链接...');
                        const filesWithUrl = files.filter(f => f.download_url);
                        console.log('[威软夸克助手] 已有下载链接的文件数:', filesWithUrl.length);

                        if (filesWithUrl.length > 0) {
                            res = {
                                code: 0,
                                data: filesWithUrl.map(f => ({
                                    fid: f.fid,
                                    file_name: f.name,
                                    size: f.size || 0,
                                    download_url: f.download_url
                                }))
                            };
                        }
                    }

                    // 最终检查
                    if (!res || res.code !== 0 || !res.data || res.data.length === 0) {
                        Utils.toast('分享文件需要先「保存到网盘」后才能获取下载链接', 'info');
                        return;
                    }
                } else {
                    // 个人网盘处理
                    res = await Utils.post(CONFIG.API, { fids: files.map(f => f.fid) });
                    console.log('[威软夸克助手] API返回:', res);
                }

                if (res && res.code === 0 && res.data && res.data.length > 0) {
                    State.addHistory(res.data);
                    UI.showResultWindow(res.data);
                } else {
                    Utils.toast(`${L.parseError}: ${res?.message || '未获取到下载链接'}`, 'error');
                }
            } catch(e) {
                console.error('[威软夸克助手]', e);
                Utils.toast(L.networkError, 'error');
            } finally {
                if (btn) {
                    btn.innerHTML = `<span class="weiruan-icon">⚡</span> ${L.downloadHelper}`;
                    btn.disabled = false;
                }
            }
        },

        init: () => {
            UI.injectStyles();
            UI.createFloatButton();
            UI.applyTheme();
            App.bindShortcuts();
        },

        bindShortcuts: () => {
            document.addEventListener('keydown', (e) => {
                // Ctrl+D 快速下载
                if (e.ctrlKey && e.key === 'd') {
                    e.preventDefault();
                    App.run();
                }
                // Escape 关闭弹窗
                if (e.key === 'Escape') {
                    const modal = document.getElementById('weiruan-modal');
                    if (modal) modal.remove();
                }
            });
        }
    };

    // ==================== 界面 ====================
    const UI = {
        injectStyles: () => {
            GM_addStyle(`
                @keyframes weiruan-toast-in {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes weiruan-toast-out {
                    from { opacity: 1; transform: translate(-50%, 0); }
                    to { opacity: 0; transform: translate(-50%, -20px); }
                }
                @keyframes weiruan-spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes weiruan-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes weiruan-slide-in {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }

                .weiruan-spinner {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: weiruan-spin 0.8s linear infinite;
                    margin-right: 6px;
                    vertical-align: middle;
                }

                .weiruan-btn {
                    position: fixed;
                    top: 50%;
                    left: 0;
                    transform: translateY(-50%);
                    z-index: 2147483647;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    padding: 14px 18px;
                    border: none;
                    border-radius: 0 25px 25px 0;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    transition: all 0.3s ease;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .weiruan-btn:hover {
                    padding-left: 22px;
                    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
                }

                .weiruan-btn:active {
                    transform: translateY(-50%) scale(0.98);
                }

                .weiruan-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .weiruan-icon {
                    font-size: 16px;
                }

                .weiruan-menu {
                    position: fixed;
                    top: calc(50% + 50px);
                    left: 0;
                    transform: translateY(-50%);
                    z-index: 2147483646;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.3s ease;
                }

                .weiruan-btn:hover + .weiruan-menu,
                .weiruan-menu:hover {
                    opacity: 1;
                    pointer-events: auto;
                    left: 5px;
                }

                .weiruan-menu-item {
                    background: rgba(255,255,255,0.95);
                    color: #333;
                    padding: 8px 14px;
                    border-radius: 20px;
                    font-size: 12px;
                    cursor: pointer;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .weiruan-menu-item:hover {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    transform: translateX(5px);
                }

                /* Modal Styles */
                .weiruan-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: 2147483648;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(5px);
                }

                .weiruan-modal {
                    background: var(--weiruan-bg, #ffffff);
                    width: 720px;
                    max-width: 92%;
                    max-height: 85vh;
                    border-radius: 16px;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: weiruan-slide-in 0.3s ease-out;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .weiruan-tab-content {
                    display: none;
                    flex-direction: column;
                    min-height: 0;
                    flex: 1;
                    overflow: hidden;
                }

                .weiruan-tab-content.active {
                    display: flex;
                }

                .weiruan-modal-header {
                    padding: 18px 24px;
                    border-bottom: 1px solid var(--weiruan-border, #eee);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .weiruan-modal-title {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .weiruan-modal-close {
                    cursor: pointer;
                    font-size: 28px;
                    line-height: 1;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                }

                .weiruan-modal-close:hover {
                    opacity: 1;
                    background: rgba(255,255,255,0.2);
                }

                .weiruan-toolbar {
                    padding: 12px 24px;
                    background: var(--weiruan-toolbar-bg, #f8f9ff);
                    border-bottom: 1px solid var(--weiruan-border, #eee);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .weiruan-toolbar-info {
                    font-size: 13px;
                    color: var(--weiruan-text-secondary, #666);
                }

                .weiruan-toolbar-actions {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .weiruan-btn-group {
                    display: flex;
                    gap: 6px;
                }

                .weiruan-action-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .weiruan-action-btn.primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .weiruan-action-btn.primary:hover {
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                    transform: translateY(-1px);
                }

                .weiruan-action-btn.secondary {
                    background: var(--weiruan-btn-secondary, #f0f0f0);
                    color: var(--weiruan-text, #333);
                }

                .weiruan-action-btn.secondary:hover {
                    background: var(--weiruan-btn-secondary-hover, #e0e0e0);
                }

                .weiruan-action-btn.success {
                    background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
                    color: white;
                }

                .weiruan-action-btn.warning {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                }

                .weiruan-modal-body {
                    padding: 16px 24px;
                    overflow-y: auto;
                    flex: 1;
                    min-height: 0;
                    max-height: 400px;
                    background: var(--weiruan-bg, #ffffff);
                }

                .weiruan-file-item {
                    background: var(--weiruan-item-bg, #f9f9f9);
                    padding: 14px 16px;
                    margin-bottom: 10px;
                    border-radius: 10px;
                    border-left: 4px solid #667eea;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s;
                }

                .weiruan-file-item:hover {
                    transform: translateX(3px);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                }

                .weiruan-file-info {
                    overflow: hidden;
                    flex: 1;
                    margin-right: 12px;
                }

                .weiruan-file-name {
                    font-weight: 600;
                    color: var(--weiruan-text, #333);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                }

                .weiruan-file-meta {
                    font-size: 12px;
                    color: var(--weiruan-text-secondary, #888);
                    margin-top: 4px;
                }

                .weiruan-file-actions {
                    display: flex;
                    gap: 6px;
                    flex-shrink: 0;
                }

                .weiruan-file-btn {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                }

                .weiruan-file-btn.idm {
                    background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
                    color: white;
                }

                .weiruan-file-btn.curl {
                    background: #333;
                    color: white;
                }

                .weiruan-file-btn.aria2 {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                }

                .weiruan-file-btn:hover {
                    transform: scale(1.05);
                }

                /* Tab Styles */
                .weiruan-tabs {
                    display: flex;
                    gap: 0;
                    border-bottom: 1px solid var(--weiruan-border, #eee);
                    padding: 0 24px;
                    background: var(--weiruan-bg, #ffffff);
                }

                .weiruan-tab {
                    padding: 12px 20px;
                    cursor: pointer;
                    border: none;
                    background: none;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--weiruan-text-secondary, #666);
                    position: relative;
                    transition: all 0.2s;
                }

                .weiruan-tab:hover {
                    color: #667eea;
                }

                .weiruan-tab.active {
                    color: #667eea;
                }

                .weiruan-tab.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 2px 2px 0 0;
                }

                /* History Styles */
                .weiruan-history-item {
                    padding: 12px 16px;
                    background: var(--weiruan-item-bg, #f9f9f9);
                    border-radius: 8px;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .weiruan-history-name {
                    font-size: 13px;
                    color: var(--weiruan-text, #333);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    flex: 1;
                }

                .weiruan-history-meta {
                    font-size: 11px;
                    color: var(--weiruan-text-secondary, #999);
                    white-space: nowrap;
                    margin-left: 10px;
                }

                .weiruan-empty {
                    text-align: center;
                    padding: 40px;
                    color: var(--weiruan-text-secondary, #999);
                }

                .weiruan-empty-icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                }

                /* Settings Styles */
                .weiruan-settings-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 0;
                    border-bottom: 1px solid var(--weiruan-border, #eee);
                }

                .weiruan-settings-item:last-child {
                    border-bottom: none;
                }

                .weiruan-settings-label {
                    font-size: 14px;
                    color: var(--weiruan-text, #333);
                }

                .weiruan-select {
                    padding: 6px 12px;
                    border: 1px solid var(--weiruan-border, #ddd);
                    border-radius: 6px;
                    background: var(--weiruan-bg, #fff);
                    color: var(--weiruan-text, #333);
                    font-size: 13px;
                    cursor: pointer;
                }

                /* Filter Styles */
                .weiruan-filter {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .weiruan-filter-btn {
                    padding: 4px 10px;
                    border: 1px solid var(--weiruan-border, #ddd);
                    border-radius: 15px;
                    background: var(--weiruan-bg, #fff);
                    color: var(--weiruan-text-secondary, #666);
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .weiruan-filter-btn:hover,
                .weiruan-filter-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-color: transparent;
                }

                /* Dark Mode */
                .weiruan-dark {
                    --weiruan-bg: #1a1a2e;
                    --weiruan-text: #e0e0e0;
                    --weiruan-text-secondary: #888;
                    --weiruan-border: #333;
                    --weiruan-item-bg: #252540;
                    --weiruan-toolbar-bg: #1e1e35;
                    --weiruan-btn-secondary: #333;
                    --weiruan-btn-secondary-hover: #444;
                }

                /* Footer */
                .weiruan-footer {
                    padding: 12px 24px;
                    border-top: 1px solid var(--weiruan-border, #eee);
                    background: var(--weiruan-bg, #ffffff);
                    text-align: center;
                    font-size: 12px;
                    color: var(--weiruan-text-secondary, #999);
                }

                .weiruan-footer a {
                    color: #667eea;
                    text-decoration: none;
                }

                .weiruan-footer a:hover {
                    text-decoration: underline;
                }
            `);
        },

        applyTheme: () => {
            const modal = document.getElementById('weiruan-modal');
            if (modal) {
                if (State.isDark()) {
                    modal.classList.add('weiruan-dark');
                } else {
                    modal.classList.remove('weiruan-dark');
                }
            }
        },

        createFloatButton: () => {
            if (document.getElementById('weiruan-btn')) return;

            const L = State.getLang();
            const btn = document.createElement('button');
            btn.id = 'weiruan-btn';
            btn.className = 'weiruan-btn';
            btn.innerHTML = `<span class="weiruan-icon">⚡</span> ${L.downloadHelper}`;
            btn.onclick = () => App.run();

            document.body.appendChild(btn);

            // 添加快捷菜单
            const menu = document.createElement('div');
            menu.className = 'weiruan-menu';
            menu.innerHTML = `
                <div class="weiruan-menu-item" data-action="history">📜 ${L.history}</div>
                <div class="weiruan-menu-item" data-action="settings">⚙️ ${L.settings}</div>
                <div class="weiruan-menu-item" data-action="debug">🔧 调试模式</div>
            `;

            menu.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                if (action === 'history') {
                    UI.showHistoryWindow();
                } else if (action === 'settings') {
                    UI.showSettingsWindow();
                } else if (action === 'debug') {
                    CONFIG.DEBUG = !CONFIG.DEBUG;
                    Utils.toast(`调试模式已${CONFIG.DEBUG ? '开启' : '关闭'}，查看控制台获取详细信息`, 'info');
                    if (CONFIG.DEBUG) {
                        // 输出详细的页面分析
                        console.log('==========================================');
                        console.log('[威软夸克助手] 调试信息 v' + CONFIG.VERSION);
                        console.log('==========================================');
                        console.log('页面类型:', Utils.isSharePage() ? '分享页面' : '个人网盘');
                        console.log('URL:', location.href);

                        // 复选框分析
                        const checkboxes = document.querySelectorAll('.ant-checkbox, [class*="checkbox"]');
                        const checkedBoxes = document.querySelectorAll('.ant-checkbox-checked, .ant-checkbox-wrapper-checked, [aria-checked="true"]');
                        console.log('复选框总数:', checkboxes.length);
                        console.log('选中的复选框:', checkedBoxes.length);

                        // 文件行分析
                        const rows = document.querySelectorAll('.ant-table-row, [class*="file-item"], [class*="fileItem"], [class*="list-item"]');
                        console.log('文件行元素:', rows.length);

                        // 尝试分析全局状态
                        const win = unsafeWindow || window;
                        console.log('全局变量检测:');
                        ['__REDUX_STORE__', 'store', '__store__', '__INITIAL_STATE__', '__DATA__'].forEach(v => {
                            if (win[v]) console.log(`  - ${v}: 存在`);
                        });

                        // 尝试获取文件
                        console.log('尝试获取选中文件...');
                        const files = App.getSelectedFiles();
                        console.log('获取到的文件:', files.length);
                        files.forEach((f, i) => {
                            console.log(`  ${i+1}. ${f.name} (fid: ${f.fid}, isDir: ${f.isDir})`);
                        });

                        console.log('==========================================');
                    }
                }
            });

            document.body.appendChild(menu);
        },

        showResultWindow: (data) => {
            const L = State.getLang();
            UI.removeModal();

            const totalSize = data.reduce((sum, f) => sum + f.size, 0);
            const modal = document.createElement('div');
            modal.id = 'weiruan-modal';
            modal.className = `weiruan-modal-overlay ${State.isDark() ? 'weiruan-dark' : ''}`;

            const allLinks = Utils.generateBatchLinks(data);
            const aria2Commands = Utils.generateAria2Commands(data);
            const curlCommands = Utils.generateCurlCommands(data);

            const fileListHTML = data.map((f, index) => {
                const icon = Utils.getFileIcon(f.file_name);
                const safeUrl = f.download_url.replace(/"/g, '&quot;');

                return `
                <div class="weiruan-file-item" data-type="${Utils.getFileType(f.file_name)}">
                    <div class="weiruan-file-info">
                        <div class="weiruan-file-name" title="${f.file_name}">
                            <span>${icon}</span>
                            <span>${f.file_name}</span>
                        </div>
                        <div class="weiruan-file-meta">${Utils.formatSize(f.size)}</div>
                    </div>
                    <div class="weiruan-file-actions">
                        <a href="${safeUrl}" target="_blank" class="weiruan-file-btn idm">⬇️ IDM</a>
                        <button class="weiruan-file-btn curl" data-index="${index}">📋 cURL</button>
                        <button class="weiruan-file-btn aria2" data-index="${index}">🚀 aria2</button>
                    </div>
                </div>`;
            }).join('');

            const historyHTML = State.history.length > 0
                ? State.history.slice(0, 20).map(h => `
                    <div class="weiruan-history-item">
                        <span class="weiruan-history-name" title="${h.name}">${Utils.getFileIcon(h.name)} ${h.name}</span>
                        <span class="weiruan-history-meta">${Utils.formatSize(h.size)} · ${Utils.formatDate(h.time)}</span>
                    </div>
                `).join('')
                : `<div class="weiruan-empty"><div class="weiruan-empty-icon">📭</div>${L.noHistory}</div>`;

            modal.innerHTML = `
            <div class="weiruan-modal">
                <div class="weiruan-modal-header">
                    <h3 class="weiruan-modal-title">
                        <span>🎉</span>
                        <span>${L.success} (${data.length} ${L.files})</span>
                    </h3>
                    <span class="weiruan-modal-close" onclick="document.getElementById('weiruan-modal').remove()">&times;</span>
                </div>

                <div class="weiruan-tabs">
                    <button class="weiruan-tab active" data-tab="files">📁 ${L.files}</button>
                    <button class="weiruan-tab" data-tab="history">📜 ${L.history}</button>
                    <button class="weiruan-tab" data-tab="settings">⚙️ ${L.settings}</button>
                </div>

                <div class="weiruan-tab-content active" data-content="files">
                    <div class="weiruan-toolbar">
                        <div class="weiruan-toolbar-info">
                            <span>${L.totalSize}: <strong>${Utils.formatSize(totalSize)}</strong></span>
                            <span style="margin-left:15px;font-size:12px;color:#888;">${L.idmTip}</span>
                        </div>
                        <div class="weiruan-toolbar-actions">
                            <div class="weiruan-filter">
                                <button class="weiruan-filter-btn active" data-filter="all">${L.all}</button>
                                <button class="weiruan-filter-btn" data-filter="video">${L.video}</button>
                                <button class="weiruan-filter-btn" data-filter="audio">${L.audio}</button>
                                <button class="weiruan-filter-btn" data-filter="image">${L.image}</button>
                                <button class="weiruan-filter-btn" data-filter="document">${L.document}</button>
                                <button class="weiruan-filter-btn" data-filter="archive">${L.archive}</button>
                            </div>
                        </div>
                    </div>
                    <div class="weiruan-toolbar" style="border-top:none;padding-top:0;">
                        <div class="weiruan-btn-group">
                            <button class="weiruan-action-btn primary" id="weiruan-copy-all">📦 ${L.copyAll}</button>
                            <button class="weiruan-action-btn success" id="weiruan-copy-aria2">🚀 ${L.copyAria2}</button>
                            <button class="weiruan-action-btn secondary" id="weiruan-copy-curl">📋 ${L.copyCurl}</button>
                        </div>
                    </div>
                    <div class="weiruan-modal-body" id="weiruan-file-list">
                        ${fileListHTML}
                    </div>
                </div>

                <div class="weiruan-tab-content" data-content="history">
                    <div class="weiruan-toolbar">
                        <span>${L.history}</span>
                        <button class="weiruan-action-btn warning" id="weiruan-clear-history">🗑️ ${L.clearHistory}</button>
                    </div>
                    <div class="weiruan-modal-body" id="weiruan-history-list">
                        ${historyHTML}
                    </div>
                </div>

                <div class="weiruan-tab-content" data-content="settings">
                    <div class="weiruan-modal-body">
                        <div class="weiruan-settings-item">
                            <span class="weiruan-settings-label">🌙 ${L.darkMode}</span>
                            <select class="weiruan-select" id="weiruan-theme-select">
                                <option value="auto" ${State.theme === 'auto' ? 'selected' : ''}>${L.auto}</option>
                                <option value="light" ${State.theme === 'light' ? 'selected' : ''}>${L.light}</option>
                                <option value="dark" ${State.theme === 'dark' ? 'selected' : ''}>${L.dark}</option>
                            </select>
                        </div>
                        <div class="weiruan-settings-item">
                            <span class="weiruan-settings-label">🌐 ${L.language}</span>
                            <select class="weiruan-select" id="weiruan-lang-select">
                                <option value="zh" ${State.lang === 'zh' ? 'selected' : ''}>中文</option>
                                <option value="en" ${State.lang === 'en' ? 'selected' : ''}>English</option>
                            </select>
                        </div>
                        <div class="weiruan-settings-item">
                            <span class="weiruan-settings-label">⌨️ 快捷键</span>
                            <span style="color:var(--weiruan-text-secondary);font-size:13px;">Ctrl+D 下载 / Esc 关闭</span>
                        </div>
                    </div>
                </div>

                <div class="weiruan-footer">
                    ${L.title} v${CONFIG.VERSION} ·
                    <a href="https://github.com/weiruankeji2025/weiruan-quark" target="_blank">GitHub</a>
                </div>
            </div>`;

            document.body.appendChild(modal);

            // 绑定事件
            UI.bindModalEvents(modal, data, allLinks, aria2Commands, curlCommands);
        },

        bindModalEvents: (modal, data, allLinks, aria2Commands, curlCommands) => {
            const L = State.getLang();

            // Tab切换
            modal.querySelectorAll('.weiruan-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    modal.querySelectorAll('.weiruan-tab').forEach(t => t.classList.remove('active'));
                    modal.querySelectorAll('.weiruan-tab-content').forEach(c => c.classList.remove('active'));

                    e.target.classList.add('active');
                    const tabName = e.target.getAttribute('data-tab');
                    modal.querySelector(`[data-content="${tabName}"]`).classList.add('active');
                });
            });

            // 复制链接
            document.getElementById('weiruan-copy-all')?.addEventListener('click', () => {
                GM_setClipboard(allLinks);
                Utils.toast(`✅ ${L.copied}`);
            });

            document.getElementById('weiruan-copy-aria2')?.addEventListener('click', () => {
                GM_setClipboard(aria2Commands);
                Utils.toast(`✅ aria2 ${L.copied}`);
            });

            document.getElementById('weiruan-copy-curl')?.addEventListener('click', () => {
                GM_setClipboard(curlCommands);
                Utils.toast(`✅ cURL ${L.copied}`);
            });

            // 单文件复制
            modal.querySelectorAll('.weiruan-file-btn.curl').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    const f = data[index];
                    const curl = `curl -L -C - "${f.download_url}" -o "${f.file_name}" -A "${CONFIG.UA}" -b "${document.cookie}"`;
                    GM_setClipboard(curl);
                    Utils.toast(`✅ cURL ${L.copied}`);
                });
            });

            modal.querySelectorAll('.weiruan-file-btn.aria2').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    const f = data[index];
                    const aria2 = `aria2c -c -x 16 -s 16 "${f.download_url}" -o "${f.file_name}" -U "${CONFIG.UA}" --header="Cookie: ${document.cookie}"`;
                    GM_setClipboard(aria2);
                    Utils.toast(`✅ aria2 ${L.copied}`);
                });
            });

            // 文件过滤
            modal.querySelectorAll('.weiruan-filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    modal.querySelectorAll('.weiruan-filter-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');

                    const filter = e.target.getAttribute('data-filter');
                    modal.querySelectorAll('.weiruan-file-item').forEach(item => {
                        const type = item.getAttribute('data-type');
                        item.style.display = (filter === 'all' || type === filter) ? 'flex' : 'none';
                    });
                });
            });

            // 清空历史
            document.getElementById('weiruan-clear-history')?.addEventListener('click', () => {
                State.clearHistory();
                document.getElementById('weiruan-history-list').innerHTML =
                    `<div class="weiruan-empty"><div class="weiruan-empty-icon">📭</div>${L.noHistory}</div>`;
                Utils.toast(`✅ ${L.clearHistory}`);
            });

            // 设置
            document.getElementById('weiruan-theme-select')?.addEventListener('change', (e) => {
                State.setTheme(e.target.value);
            });

            document.getElementById('weiruan-lang-select')?.addEventListener('change', (e) => {
                State.setLang(e.target.value);
                Utils.toast('语言已更改，刷新页面后生效');
            });

            // 点击遮罩关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        },

        showHistoryWindow: () => {
            UI.showResultWindow([]);  // 显示空结果，自动切换到历史tab
            setTimeout(() => {
                document.querySelector('[data-tab="history"]')?.click();
            }, 100);
        },

        showSettingsWindow: () => {
            UI.showResultWindow([]);
            setTimeout(() => {
                document.querySelector('[data-tab="settings"]')?.click();
            }, 100);
        },

        removeModal: () => {
            const old = document.getElementById('weiruan-modal');
            if (old) old.remove();
        }
    };

    // ==================== 初始化 ====================
    setTimeout(() => {
        App.init();
        console.log(`[威软夸克助手] v${CONFIG.VERSION} 已加载`);

        // 监听URL变化（SPA应用）
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(App.init, 1000);
            }
        }).observe(document, { subtree: true, childList: true });

        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (State.theme === 'auto') {
                UI.applyTheme();
            }
        });
    }, 1000);
})();
