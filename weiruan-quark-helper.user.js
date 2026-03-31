// ==UserScript==
// @name         威软夸克助手
// @namespace    Weiruan-Quark-Helper
// @version      1.0.9
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
        // 文件夹内容列表 API
        FOLDER_LIST_API: "https://drive.quark.cn/1/clouddrive/file/sort?pr=ucpro&fr=pc&uc_param_str=&pdir_fid=",
        UA: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch",
        DEPTH: 25,
        VERSION: "1.0.9",
        DEBUG: false, // 调试模式
        HISTORY_MAX: 100,
        FOLDER_MAX_DEPTH: 5, // 文件夹递归最大深度
        FOLDER_MAX_FILES: 500, // 文件夹最大文件数
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
            dark: '深色',
            starMap: '星际历史图',
            starMapTitle: '星际历史图',
            starMapDesc: '探索你的下载宇宙',
            totalDownloads: '总下载',
            fileTypes: '文件类型',
            timeline: '时间线',
            galaxy: '星系',
            clickToExplore: '点击星球查看详情',
            downloadTime: '下载时间',
            starSize: '星球大小由文件大小决定',
            folder: '文件夹',
            scanningFolder: '正在扫描文件夹...',
            folderContains: '文件夹包含',
            filesInFolder: '个文件',
            foldersSelected: '个文件夹',
            expandingFolders: '正在展开文件夹',
            folderTooDeep: '文件夹层级过深，已跳过部分内容',
            folderTooMany: '文件数量过多，已达到上限',
            includeFolders: '包含文件夹'
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
            dark: 'Dark',
            starMap: 'Star History Map',
            starMapTitle: 'Star History Map',
            starMapDesc: 'Explore your download universe',
            totalDownloads: 'Total Downloads',
            fileTypes: 'File Types',
            timeline: 'Timeline',
            galaxy: 'Galaxy',
            clickToExplore: 'Click a planet to see details',
            downloadTime: 'Download Time',
            starSize: 'Planet size represents file size',
            folder: 'Folder',
            scanningFolder: 'Scanning folder...',
            folderContains: 'Folder contains',
            filesInFolder: 'files',
            foldersSelected: 'folders',
            expandingFolders: 'Expanding folders',
            folderTooDeep: 'Folder too deep, some content skipped',
            folderTooMany: 'Too many files, limit reached',
            includeFolders: 'Include Folders'
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

        // GET 请求
        get: (url) => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    headers: {
                        "User-Agent": CONFIG.UA,
                        "Cookie": document.cookie
                    },
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

        // 获取文件夹内容列表
        getFolderContents: async (fid, page = 1, pageSize = 100) => {
            const url = `${CONFIG.FOLDER_LIST_API}${fid}&_page=${page}&_size=${pageSize}&_sort=file_type:asc,updated_at:desc`;
            try {
                const res = await Utils.get(url);
                if (res && res.code === 0 && res.data && res.data.list) {
                    return {
                        list: res.data.list,
                        total: res.metadata?._total || res.data.list.length,
                        hasMore: res.data.list.length >= pageSize
                    };
                }
                return { list: [], total: 0, hasMore: false };
            } catch (e) {
                Utils.log('获取文件夹内容失败:', e);
                return { list: [], total: 0, hasMore: false };
            }
        },

        // 递归获取文件夹内所有文件
        getAllFilesInFolder: async (fid, folderName = '', depth = 0, onProgress = null) => {
            const allFiles = [];
            const L = State.getLang();

            if (depth >= CONFIG.FOLDER_MAX_DEPTH) {
                Utils.log('达到最大递归深度:', depth);
                return { files: allFiles, warning: 'depth' };
            }

            let page = 1;
            let hasMore = true;
            let warning = null;

            while (hasMore && allFiles.length < CONFIG.FOLDER_MAX_FILES) {
                const result = await Utils.getFolderContents(fid, page, 100);

                for (const item of result.list) {
                    if (allFiles.length >= CONFIG.FOLDER_MAX_FILES) {
                        warning = 'count';
                        break;
                    }

                    const isDir = item.dir === true || item.is_dir === true ||
                                  item.file_type === 0 || item.obj_category === 'folder';

                    if (isDir) {
                        // 递归获取子文件夹
                        const subPath = folderName ? `${folderName}/${item.file_name}` : item.file_name;
                        if (onProgress) {
                            onProgress(`${L.scanningFolder} ${subPath}`);
                        }
                        const subResult = await Utils.getAllFilesInFolder(
                            item.fid,
                            subPath,
                            depth + 1,
                            onProgress
                        );
                        allFiles.push(...subResult.files);
                        if (subResult.warning) warning = subResult.warning;
                    } else {
                        // 添加文件，保留文件夹路径
                        allFiles.push({
                            fid: item.fid,
                            name: item.file_name,
                            file_name: item.file_name,
                            size: item.size || 0,
                            isDir: false,
                            folderPath: folderName,
                            fullPath: folderName ? `${folderName}/${item.file_name}` : item.file_name
                        });
                    }
                }

                hasMore = result.hasMore && allFiles.length < CONFIG.FOLDER_MAX_FILES;
                page++;
            }

            return { files: allFiles, warning };
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
                // 如果有文件夹路径，使用完整路径
                const outputPath = f.fullPath || f.file_name;
                // 如果有子目录，先创建目录
                const dirCmd = f.folderPath ? `mkdir -p "${f.folderPath}" && ` : '';
                return `${dirCmd}aria2c -c -x 16 -s 16 "${f.download_url}" -o "${outputPath}" -U "${ua}" --header="Cookie: ${document.cookie}"`;
            }).join('\n\n');
        },

        generateCurlCommands: (files) => {
            return files.map(f => {
                const ua = CONFIG.UA;
                // 如果有文件夹路径，使用完整路径
                const outputPath = f.fullPath || f.file_name;
                // 如果有子目录，先创建目录
                const dirCmd = f.folderPath ? `mkdir -p "${f.folderPath}" && ` : '';
                return `${dirCmd}curl -L -C - "${f.download_url}" -o "${outputPath}" -A "${ua}" -b "${document.cookie}"`;
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

                // 分离文件和文件夹
                const folders = files.filter(f => f.isDir);
                let regularFiles = files.filter(f => !f.isDir);
                console.log(`[威软夸克助手] 文件: ${regularFiles.length}, 文件夹: ${folders.length}`);

                // 如果有文件夹，展开获取所有文件
                if (folders.length > 0) {
                    if (btn) {
                        btn.innerHTML = `<span class="weiruan-spinner"></span> ${L.expandingFolders}...`;
                        btn.disabled = true;
                    }

                    let folderWarning = null;
                    for (const folder of folders) {
                        Utils.toast(`${L.scanningFolder} ${folder.name}`, 'info');
                        const result = await Utils.getAllFilesInFolder(
                            folder.fid,
                            folder.name,
                            0,
                            (msg) => {
                                if (btn) btn.innerHTML = `<span class="weiruan-spinner"></span> ${msg}`;
                            }
                        );
                        regularFiles.push(...result.files);
                        if (result.warning) folderWarning = result.warning;

                        // 检查是否超过文件数限制
                        if (regularFiles.length >= CONFIG.FOLDER_MAX_FILES) {
                            folderWarning = 'count';
                            break;
                        }
                    }

                    // 显示警告
                    if (folderWarning === 'depth') {
                        Utils.toast(L.folderTooDeep, 'info');
                    } else if (folderWarning === 'count') {
                        Utils.toast(L.folderTooMany, 'info');
                    }

                    console.log(`[威软夸克助手] 展开文件夹后共 ${regularFiles.length} 个文件`);
                }

                files = regularFiles;

                // 应用文件类型过滤
                if (filterType !== 'all') {
                    files = files.filter(f => Utils.getFileType(f.name || f.file_name) === filterType);
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
                    // 创建 fid 到原始文件信息的映射，保留文件夹路径
                    const fileInfoMap = new Map();
                    files.forEach(f => {
                        fileInfoMap.set(f.fid, {
                            folderPath: f.folderPath,
                            fullPath: f.fullPath
                        });
                    });

                    // 将文件夹路径信息合并到 API 返回结果中
                    const enrichedData = res.data.map(item => {
                        const info = fileInfoMap.get(item.fid);
                        return {
                            ...item,
                            folderPath: info?.folderPath || '',
                            fullPath: info?.fullPath || item.file_name
                        };
                    });

                    State.addHistory(enrichedData);
                    UI.showResultWindow(enrichedData);
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

                /* Star Map Styles */
                @keyframes weiruan-twinkle {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }

                @keyframes weiruan-orbit {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes weiruan-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                @keyframes weiruan-pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px currentColor; }
                    50% { box-shadow: 0 0 40px currentColor, 0 0 60px currentColor; }
                }

                .weiruan-starmap-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 50%, #000000 100%);
                    z-index: 2147483648;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .weiruan-starmap-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    pointer-events: none;
                }

                .weiruan-star {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                    animation: weiruan-twinkle var(--duration, 2s) ease-in-out infinite;
                    animation-delay: var(--delay, 0s);
                }

                .weiruan-starmap-container {
                    position: relative;
                    width: 90%;
                    max-width: 1000px;
                    height: 80vh;
                    max-height: 700px;
                    background: rgba(20, 20, 40, 0.8);
                    border-radius: 20px;
                    border: 1px solid rgba(102, 126, 234, 0.3);
                    box-shadow: 0 0 60px rgba(102, 126, 234, 0.2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                }

                .weiruan-starmap-header {
                    padding: 20px 24px;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
                    border-bottom: 1px solid rgba(102, 126, 234, 0.3);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .weiruan-starmap-title {
                    color: #fff;
                    font-size: 20px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 0;
                }

                .weiruan-starmap-title-icon {
                    font-size: 28px;
                    animation: weiruan-float 3s ease-in-out infinite;
                }

                .weiruan-starmap-close {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: #fff;
                    font-size: 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                }

                .weiruan-starmap-close:hover {
                    background: rgba(255, 100, 100, 0.3);
                    transform: rotate(90deg);
                }

                .weiruan-starmap-stats {
                    padding: 16px 24px;
                    display: flex;
                    gap: 20px;
                    border-bottom: 1px solid rgba(102, 126, 234, 0.2);
                    flex-wrap: wrap;
                }

                .weiruan-starmap-stat {
                    background: rgba(102, 126, 234, 0.15);
                    padding: 12px 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(102, 126, 234, 0.2);
                }

                .weiruan-starmap-stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #667eea;
                    display: block;
                }

                .weiruan-starmap-stat-label {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    margin-top: 4px;
                }

                .weiruan-starmap-body {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                    min-height: 0;
                }

                .weiruan-starmap-galaxy {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                    min-height: 300px;
                }

                .weiruan-starmap-center {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 60px;
                    height: 60px;
                    background: radial-gradient(circle, #ffd700 0%, #ff8c00 50%, #ff4500 100%);
                    border-radius: 50%;
                    box-shadow: 0 0 40px #ffd700, 0 0 80px #ff8c00;
                    animation: weiruan-pulse-glow 3s ease-in-out infinite;
                    z-index: 10;
                }

                .weiruan-starmap-center::before {
                    content: '☀️';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 30px;
                }

                .weiruan-starmap-orbit {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    border: 1px dashed rgba(102, 126, 234, 0.3);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                }

                .weiruan-starmap-planet {
                    position: absolute;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: transform 0.3s, box-shadow 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: var(--planet-font-size, 16px);
                    animation: weiruan-orbit var(--orbit-duration, 20s) linear infinite;
                    transform-origin: center center;
                }

                .weiruan-starmap-planet:hover {
                    transform: scale(1.3);
                    z-index: 100;
                }

                .weiruan-starmap-planet-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--planet-bg);
                    box-shadow: 0 0 15px var(--planet-glow), inset -5px -5px 15px rgba(0,0,0,0.3);
                }

                .weiruan-starmap-planet.video { --planet-bg: linear-gradient(135deg, #667eea, #764ba2); --planet-glow: rgba(102, 126, 234, 0.6); }
                .weiruan-starmap-planet.audio { --planet-bg: linear-gradient(135deg, #11998e, #38ef7d); --planet-glow: rgba(56, 239, 125, 0.6); }
                .weiruan-starmap-planet.image { --planet-bg: linear-gradient(135deg, #fc466b, #3f5efb); --planet-glow: rgba(252, 70, 107, 0.6); }
                .weiruan-starmap-planet.document { --planet-bg: linear-gradient(135deg, #f093fb, #f5576c); --planet-glow: rgba(240, 147, 251, 0.6); }
                .weiruan-starmap-planet.archive { --planet-bg: linear-gradient(135deg, #4facfe, #00f2fe); --planet-glow: rgba(79, 172, 254, 0.6); }
                .weiruan-starmap-planet.other { --planet-bg: linear-gradient(135deg, #a8a8a8, #6a6a6a); --planet-glow: rgba(168, 168, 168, 0.6); }

                .weiruan-starmap-tooltip {
                    position: fixed;
                    background: rgba(20, 20, 40, 0.95);
                    border: 1px solid rgba(102, 126, 234, 0.5);
                    border-radius: 12px;
                    padding: 14px 18px;
                    color: #fff;
                    font-size: 13px;
                    max-width: 280px;
                    z-index: 2147483650;
                    pointer-events: none;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(10px);
                }

                .weiruan-starmap-tooltip-name {
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 8px;
                    word-break: break-all;
                    color: #667eea;
                }

                .weiruan-starmap-tooltip-meta {
                    display: flex;
                    gap: 15px;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 12px;
                }

                .weiruan-starmap-sidebar {
                    width: 260px;
                    background: rgba(10, 10, 25, 0.6);
                    border-left: 1px solid rgba(102, 126, 234, 0.2);
                    padding: 16px;
                    overflow-y: auto;
                }

                .weiruan-starmap-legend-title {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 13px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .weiruan-starmap-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 0;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 12px;
                }

                .weiruan-starmap-legend-dot {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .weiruan-starmap-legend-dot.video { background: linear-gradient(135deg, #667eea, #764ba2); }
                .weiruan-starmap-legend-dot.audio { background: linear-gradient(135deg, #11998e, #38ef7d); }
                .weiruan-starmap-legend-dot.image { background: linear-gradient(135deg, #fc466b, #3f5efb); }
                .weiruan-starmap-legend-dot.document { background: linear-gradient(135deg, #f093fb, #f5576c); }
                .weiruan-starmap-legend-dot.archive { background: linear-gradient(135deg, #4facfe, #00f2fe); }
                .weiruan-starmap-legend-dot.other { background: linear-gradient(135deg, #a8a8a8, #6a6a6a); }

                .weiruan-starmap-recent {
                    margin-top: 20px;
                }

                .weiruan-starmap-recent-item {
                    padding: 10px;
                    background: rgba(102, 126, 234, 0.1);
                    border-radius: 8px;
                    margin-bottom: 8px;
                    border: 1px solid rgba(102, 126, 234, 0.15);
                    transition: all 0.2s;
                }

                .weiruan-starmap-recent-item:hover {
                    background: rgba(102, 126, 234, 0.2);
                    border-color: rgba(102, 126, 234, 0.3);
                }

                .weiruan-starmap-recent-name {
                    color: #fff;
                    font-size: 12px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-bottom: 4px;
                }

                .weiruan-starmap-recent-meta {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 10px;
                }

                .weiruan-starmap-empty {
                    text-align: center;
                    padding: 60px 20px;
                    color: rgba(255, 255, 255, 0.5);
                }

                .weiruan-starmap-empty-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                    animation: weiruan-float 3s ease-in-out infinite;
                }

                .weiruan-starmap-empty-text {
                    font-size: 16px;
                    margin-bottom: 8px;
                }

                .weiruan-starmap-empty-hint {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.3);
                }

                .weiruan-starmap-footer {
                    padding: 12px 24px;
                    border-top: 1px solid rgba(102, 126, 234, 0.2);
                    text-align: center;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.4);
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
                <div class="weiruan-menu-item" data-action="starmap">🌌 ${L.starMap}</div>
                <div class="weiruan-menu-item" data-action="history">📜 ${L.history}</div>
                <div class="weiruan-menu-item" data-action="settings">⚙️ ${L.settings}</div>
                <div class="weiruan-menu-item" data-action="debug">🔧 调试模式</div>
            `;

            menu.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                if (action === 'starmap') {
                    UI.showStarMap();
                } else if (action === 'history') {
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
                // 显示文件夹路径
                const folderPathHTML = f.folderPath
                    ? `<span style="color:var(--weiruan-text-secondary);font-size:11px;margin-left:4px;">📁 ${f.folderPath}/</span>`
                    : '';

                return `
                <div class="weiruan-file-item" data-type="${Utils.getFileType(f.file_name)}">
                    <div class="weiruan-file-info">
                        <div class="weiruan-file-name" title="${f.fullPath || f.file_name}">
                            <span>${icon}</span>
                            <span>${f.file_name}</span>
                            ${folderPathHTML}
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
        },

        showStarMap: () => {
            const L = State.getLang();

            // 移除已有的星际图
            const existing = document.getElementById('weiruan-starmap');
            if (existing) existing.remove();

            const history = State.history;
            const overlay = document.createElement('div');
            overlay.id = 'weiruan-starmap';
            overlay.className = 'weiruan-starmap-overlay';

            // 生成背景星星
            const starsHTML = Array.from({ length: 150 }, () => {
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                const size = Math.random() * 2 + 1;
                const duration = Math.random() * 3 + 2;
                const delay = Math.random() * 3;
                return `<div class="weiruan-star" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;--duration:${duration}s;--delay:${delay}s;"></div>`;
            }).join('');

            // 统计数据
            const typeStats = { video: 0, audio: 0, image: 0, document: 0, archive: 0, other: 0 };
            let totalSize = 0;
            history.forEach(h => {
                const type = Utils.getFileType(h.name);
                typeStats[type]++;
                totalSize += h.size || 0;
            });

            // 生成图例
            const legendItems = [
                { type: 'video', label: L.video, icon: '🎬' },
                { type: 'audio', label: L.audio, icon: '🎵' },
                { type: 'image', label: L.image, icon: '🖼️' },
                { type: 'document', label: L.document, icon: '📄' },
                { type: 'archive', label: L.archive, icon: '📦' },
                { type: 'other', label: L.other, icon: '📁' }
            ].filter(item => typeStats[item.type] > 0);

            const legendHTML = legendItems.map(item => `
                <div class="weiruan-starmap-legend-item">
                    <div class="weiruan-starmap-legend-dot ${item.type}"></div>
                    <span>${item.icon} ${item.label} (${typeStats[item.type]})</span>
                </div>
            `).join('');

            // 最近下载
            const recentHTML = history.slice(0, 5).map(h => `
                <div class="weiruan-starmap-recent-item">
                    <div class="weiruan-starmap-recent-name" title="${h.name}">${Utils.getFileIcon(h.name)} ${h.name}</div>
                    <div class="weiruan-starmap-recent-meta">${Utils.formatSize(h.size)} · ${Utils.formatDate(h.time)}</div>
                </div>
            `).join('');

            // 空状态
            const emptyHTML = `
                <div class="weiruan-starmap-empty">
                    <div class="weiruan-starmap-empty-icon">🌌</div>
                    <div class="weiruan-starmap-empty-text">${L.noHistory}</div>
                    <div class="weiruan-starmap-empty-hint">${L.starMapDesc}</div>
                </div>
            `;

            overlay.innerHTML = `
                <div class="weiruan-starmap-bg">${starsHTML}</div>
                <div class="weiruan-starmap-container">
                    <div class="weiruan-starmap-header">
                        <h3 class="weiruan-starmap-title">
                            <span class="weiruan-starmap-title-icon">🌌</span>
                            <span>${L.starMapTitle}</span>
                        </h3>
                        <button class="weiruan-starmap-close" id="weiruan-starmap-close">&times;</button>
                    </div>
                    <div class="weiruan-starmap-stats">
                        <div class="weiruan-starmap-stat">
                            <span class="weiruan-starmap-stat-value">${history.length}</span>
                            <span class="weiruan-starmap-stat-label">${L.totalDownloads}</span>
                        </div>
                        <div class="weiruan-starmap-stat">
                            <span class="weiruan-starmap-stat-value">${Utils.formatSize(totalSize)}</span>
                            <span class="weiruan-starmap-stat-label">${L.totalSize}</span>
                        </div>
                        <div class="weiruan-starmap-stat">
                            <span class="weiruan-starmap-stat-value">${legendItems.length}</span>
                            <span class="weiruan-starmap-stat-label">${L.fileTypes}</span>
                        </div>
                    </div>
                    <div class="weiruan-starmap-body">
                        <div class="weiruan-starmap-galaxy" id="weiruan-starmap-galaxy">
                            ${history.length === 0 ? emptyHTML : '<div class="weiruan-starmap-center"></div>'}
                        </div>
                        <div class="weiruan-starmap-sidebar">
                            <div class="weiruan-starmap-legend">
                                <div class="weiruan-starmap-legend-title">🏷️ ${L.fileTypes}</div>
                                ${legendHTML || '<div style="color:rgba(255,255,255,0.4);font-size:12px;">-</div>'}
                            </div>
                            <div class="weiruan-starmap-recent">
                                <div class="weiruan-starmap-legend-title">⏱️ ${L.timeline}</div>
                                ${recentHTML || '<div style="color:rgba(255,255,255,0.4);font-size:12px;">-</div>'}
                            </div>
                            <div style="margin-top:20px;padding:12px;background:rgba(102,126,234,0.1);border-radius:8px;border:1px dashed rgba(102,126,234,0.3);">
                                <div style="color:rgba(255,255,255,0.6);font-size:11px;">💡 ${L.starSize}</div>
                            </div>
                        </div>
                    </div>
                    <div class="weiruan-starmap-footer">
                        ${L.title} v${CONFIG.VERSION} · ${L.starMapDesc}
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // 生成行星（如果有历史记录）
            if (history.length > 0) {
                UI.generatePlanets(history);
            }

            // 绑定事件
            document.getElementById('weiruan-starmap-close').addEventListener('click', () => {
                overlay.remove();
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });

            // ESC 关闭
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    overlay.remove();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        },

        generatePlanets: (history) => {
            const galaxy = document.getElementById('weiruan-starmap-galaxy');
            if (!galaxy) return;

            const rect = galaxy.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const maxRadius = Math.min(centerX, centerY) - 40;

            // 限制显示的历史数量
            const displayHistory = history.slice(0, 30);

            // 生成轨道
            const orbitCount = Math.min(5, Math.ceil(displayHistory.length / 6));
            for (let i = 1; i <= orbitCount; i++) {
                const orbitRadius = (maxRadius / orbitCount) * i;
                const orbit = document.createElement('div');
                orbit.className = 'weiruan-starmap-orbit';
                orbit.style.width = `${orbitRadius * 2}px`;
                orbit.style.height = `${orbitRadius * 2}px`;
                galaxy.appendChild(orbit);
            }

            // 计算最大文件大小（用于缩放）
            const maxSize = Math.max(...displayHistory.map(h => h.size || 1));

            // 为每个文件创建行星
            displayHistory.forEach((file, index) => {
                const type = Utils.getFileType(file.name);
                const icon = Utils.getFileIcon(file.name);

                // 计算行星大小（基于文件大小）
                const fileSize = file.size || 1;
                const sizeRatio = Math.sqrt(fileSize / maxSize);
                const planetSize = Math.max(24, Math.min(50, 24 + sizeRatio * 26));

                // 计算轨道位置
                const orbitIndex = Math.floor(index / 6);
                const orbitRadius = (maxRadius / orbitCount) * (orbitIndex + 1);
                const angleOffset = (index % 6) * (360 / 6) + (orbitIndex * 30);

                // 计算动画时长（外层轨道更慢）
                const orbitDuration = 30 + orbitIndex * 15;

                const planet = document.createElement('div');
                planet.className = `weiruan-starmap-planet ${type}`;
                planet.style.cssText = `
                    width: ${planetSize}px;
                    height: ${planetSize}px;
                    --planet-font-size: ${Math.max(12, planetSize * 0.5)}px;
                    --orbit-duration: ${orbitDuration}s;
                    left: ${centerX}px;
                    top: ${centerY}px;
                    margin-left: -${planetSize / 2}px;
                    margin-top: -${planetSize / 2}px;
                    transform: rotate(${angleOffset}deg) translateX(${orbitRadius}px) rotate(-${angleOffset}deg);
                `;

                planet.innerHTML = `<div class="weiruan-starmap-planet-inner">${icon}</div>`;

                // 添加悬停提示
                planet.addEventListener('mouseenter', (e) => {
                    UI.showPlanetTooltip(e, file);
                });

                planet.addEventListener('mousemove', (e) => {
                    UI.movePlanetTooltip(e);
                });

                planet.addEventListener('mouseleave', () => {
                    UI.hidePlanetTooltip();
                });

                galaxy.appendChild(planet);
            });
        },

        showPlanetTooltip: (e, file) => {
            let tooltip = document.getElementById('weiruan-starmap-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'weiruan-starmap-tooltip';
                tooltip.className = 'weiruan-starmap-tooltip';
                document.body.appendChild(tooltip);
            }

            const L = State.getLang();
            tooltip.innerHTML = `
                <div class="weiruan-starmap-tooltip-name">${Utils.getFileIcon(file.name)} ${file.name}</div>
                <div class="weiruan-starmap-tooltip-meta">
                    <span>📦 ${Utils.formatSize(file.size)}</span>
                    <span>📅 ${Utils.formatDate(file.time)}</span>
                </div>
            `;

            tooltip.style.display = 'block';
            UI.movePlanetTooltip(e);
        },

        movePlanetTooltip: (e) => {
            const tooltip = document.getElementById('weiruan-starmap-tooltip');
            if (tooltip) {
                const x = e.clientX + 15;
                const y = e.clientY + 15;

                // 防止超出屏幕
                const rect = tooltip.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width - 20;
                const maxY = window.innerHeight - rect.height - 20;

                tooltip.style.left = `${Math.min(x, maxX)}px`;
                tooltip.style.top = `${Math.min(y, maxY)}px`;
            }
        },

        hidePlanetTooltip: () => {
            const tooltip = document.getElementById('weiruan-starmap-tooltip');
            if (tooltip) {
                tooltip.style.display = 'none';
            }
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
