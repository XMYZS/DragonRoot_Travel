// ==========================================
// 1. 全局配置与状态
// ==========================================
const AppState = {
    isDebugMode: false,
    isBgmPlaying: false,
    completedIds: JSON.parse(localStorage.getItem('completedQuestIds')) || [],
    currentTheme: localStorage.getItem('theme') || 'default'
};

const DOM = {
    questList: document.getElementById('quest-list'),
    debugBtn: document.getElementById('debug-btn'),
    bgmBtn: document.getElementById('bgm-btn'),
    countdown: document.getElementById('countdown-display'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    themeSelect: document.getElementById('theme-selector'),
    mapContainer: document.getElementById('map-container'),
    // 新增评论DOM
    commentList: document.getElementById('comment-list'),
    commentInput: document.getElementById('comment-input'),
    commentName: document.getElementById('comment-name')
};

// ==========================================
// 2. 音频系统
// ==========================================
const AudioResources = {
    ding: new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'),
    engine: new Audio('https://assets.mixkit.co/active_storage/sfx/2604/2604-preview.mp3'),
    bgm: new Audio('https://assets.mixkit.co/active_storage/sfx/134/134-preview.mp3')
};
AudioResources.bgm.loop = true;
AudioResources.bgm.volume = 0.3;

function playAudio(key) {
    const sound = AudioResources[key];
    if (sound) {
        if (key !== 'bgm') sound.currentTime = 0;
        sound.play().catch(() => { });
    }
}

// ==========================================
// 3. 数据定义
// ==========================================
const quests = [
    {
        id: 1, date: "2026-01-15", displayDate: "1.15 - 1.17", city: "长沙",
        lat: 28.2282, lon: 112.9388, mapX: 300, mapY: 450,
        title: "星城探秘", desc: "Day 1-3: 五一广场 / 岳麓山 / 省博",
        mapUrl: "https://www.amap.com/search?query=长沙五一广场",
        guide: "【美食】茶颜悦色、笨萝卜、黑色经典。\n【避坑】岳麓山滑道排队久就别坐了。"
    },
    {
        id: 2, date: "2026-01-18", displayDate: "1.18 - 1.19", city: "岳阳 & 咸宁",
        lat: 29.3770, lon: 113.1197, mapX: 350, mapY: 350,
        title: "江湖与温泉", desc: "Day 4-5: 岳阳楼 / 咸宁泡温泉",
        mapUrl: "https://www.amap.com/search?query=岳阳楼",
        guide: "【岳阳】背诵《岳阳楼记》免票。\n【咸宁】泡温泉记得带手机防水袋。"
    },
    {
        id: 3, date: "2026-01-20", displayDate: "1.20 - 1.24", city: "武汉",
        lat: 30.5928, lon: 114.3055, mapX: 400, mapY: 250,
        title: "江城深度游", desc: "Day 6-10: 黄鹤楼 / 省博 / 轮渡",
        mapUrl: "https://www.amap.com/search?query=武汉黄鹤楼",
        guide: "【过早】热干面要加醋。\n【轮渡】1.5元坐船过江，性价比超高。"
    },
    {
        id: 4, date: "2026-01-25", displayDate: "1.25", city: "返程",
        lat: 30.7838, lon: 114.2081, mapX: 450, mapY: 150,
        title: "满载而归", desc: "整理行李，前往天河机场。",
        mapUrl: "https://www.amap.com/search?query=武汉天河机场",
        guide: "检查身份证、充电器，带点周黑鸭回家。"
    }
];

// ==========================================
// 4. 功能模块
// ==========================================

// --- A. 主题切换模块 ---
function initTheme() {
    document.documentElement.setAttribute('data-theme', AppState.currentTheme);
    DOM.themeSelect.value = AppState.currentTheme;
}
function switchTheme(themeName) {
    AppState.currentTheme = themeName;
    localStorage.setItem('theme', themeName);
    document.documentElement.setAttribute('data-theme', themeName);
    MapController.render();
}

// --- B. 评论系统 (替换了 Travel Journal) ---
const CommentController = {
    // 获取评论
    getAll: () => JSON.parse(localStorage.getItem('siteComments')) || [],

    // 初始化渲染
    init: () => {
        CommentController.render();
        // 绑定回车发送
        DOM.commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') CommentController.add();
        });
    },

    // 渲染评论列表
    render: () => {
        const comments = CommentController.getAll();
        if (comments.length === 0) {
            DOM.commentList.innerHTML = '<div class="empty-tip">还没有评论，快来抢沙发！</div>';
            return;
        }

        DOM.commentList.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-user">${c.user}</span>
                    <span class="comment-time">${c.time}</span>
                </div>
                <div class="comment-content">${c.content}</div>
            </div>
        `).join('');

        // 滚动到底部
        DOM.commentList.scrollTop = DOM.commentList.scrollHeight;
    },

    // 添加评论
    add: () => {
        const user = DOM.commentName.value.trim() || "匿名旅人";
        const content = DOM.commentInput.value.trim();

        if (!content) return alert("写点什么再发送吧！");

        const newComment = {
            user: user,
            content: content,
            time: new Date().toLocaleString()
        };

        const comments = CommentController.getAll();
        comments.push(newComment);
        localStorage.setItem('siteComments', JSON.stringify(comments));

        // 清空输入框并重绘
        DOM.commentInput.value = '';
        CommentController.render();
        playAudio('ding'); // 发送成功提示音
    }
};

// --- C. 足迹地图模块 ---
const MapController = {
    chart: null,
    init: () => {
        if (!MapController.chart) {
            MapController.chart = echarts.init(DOM.mapContainer);
        }
        MapController.render();
        window.addEventListener('resize', () => MapController.chart.resize());
    },
    render: () => {
        if (!MapController.chart) return;
        const style = getComputedStyle(document.body);
        const colorPrimary = style.getPropertyValue('--accent-primary').trim();
        const colorSuccess = style.getPropertyValue('--accent-success').trim();
        const colorText = style.getPropertyValue('--text-muted').trim();

        const data = quests.map(q => {
            const isDone = AppState.completedIds.includes(q.id);
            return {
                name: q.city, x: q.mapX, y: q.mapY, symbolSize: isDone ? 20 : 10,
                itemStyle: { color: isDone ? colorSuccess : colorPrimary, shadowBlur: isDone ? 10 : 0, shadowColor: colorSuccess },
                label: { show: true, position: 'right', color: isDone ? colorSuccess : colorText, formatter: `{b}\n${q.displayDate}` }
            };
        });

        const links = [];
        for (let i = 0; i < quests.length - 1; i++) {
            const isPathActive = AppState.completedIds.includes(quests[i].id);
            links.push({
                source: quests[i].city, target: quests[i + 1].city,
                lineStyle: { color: isPathActive ? colorSuccess : colorText, width: isPathActive ? 3 : 1, type: isPathActive ? 'solid' : 'dashed', curveness: 0.2 }
            });
        }

        const option = {
            backgroundColor: 'transparent',
            title: { text: '🗺️ 征服版图', left: 'center', top: 10, textStyle: { color: colorText, fontSize: 14 } },
            grid: { top: 40, bottom: 20, left: 20, right: 20 },
            xAxis: { show: false, min: 200, max: 550 },
            yAxis: { show: false, min: 100, max: 500 },
            series: [{ type: 'graph', layout: 'none', data: data, links: links, symbol: 'circle', animationDuration: 1000 }]
        };
        MapController.chart.setOption(option);
    }
};

// ==========================================
// 5. 核心交互逻辑
// ==========================================
function toggleQuestStatus(questId) {
    const index = AppState.completedIds.indexOf(questId);
    if (index > -1) {
        AppState.completedIds.splice(index, 1);
    } else {
        AppState.completedIds.push(questId);
        playAudio('ding');
    }
    localStorage.setItem('completedQuestIds', JSON.stringify(AppState.completedIds));
    renderQuests();
    MapController.render();
}

function toggleBGM() {
    AppState.isBgmPlaying = !AppState.isBgmPlaying;
    const btn = DOM.bgmBtn;
    if (AppState.isBgmPlaying) {
        playAudio('bgm');
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> BGM: 开';
        btn.classList.add('active');
    } else {
        AudioResources.bgm.pause();
        btn.innerHTML = '<i class="fa-solid fa-music"></i> BGM: 关';
        btn.classList.remove('active');
    }
}

function toggleDebug() {
    AppState.isDebugMode = !AppState.isDebugMode;
    const btn = DOM.debugBtn;
    if (AppState.isDebugMode) {
        btn.innerHTML = '<i class="fa-solid fa-unlock"></i> 全解锁';
        btn.classList.add('active');
    } else {
        btn.innerHTML = '<i class="fa-solid fa-wrench"></i> 调试';
        btn.classList.remove('active');
    }
    renderQuests();
}

// ==========================================
// 6. 渲染与天气
// ==========================================
function getWeatherEmoji(code) {
    if (code === 0) return "☀️";
    if (code >= 1 && code <= 3) return "⛅";
    if (code >= 51 && code <= 67) return "🌧️";
    return "🌡️";
}

async function fetchWeather(questId, lat, lon) {
    const el = document.getElementById(`weather-${questId}`);
    if (!el) return;
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const w = data.current_weather;
        el.innerHTML = `${getWeatherEmoji(w.weathercode)} ${w.temperature}°C`;
        el.classList.add('loaded');
    } catch (e) { el.innerHTML = "📡 无信号"; }
}

function renderQuests() {
    DOM.questList.innerHTML = '';
    const now = new Date();

    quests.forEach(q => {
        const card = document.createElement('div');
        card.className = 'card';

        const isDone = AppState.completedIds.includes(q.id);
        const isFuture = new Date(q.date + "T00:00:00") > now;
        const isLocked = isFuture && !AppState.isDebugMode && !isDone;

        if (isDone) card.classList.add('done');
        if (isLocked) card.classList.add('locked');

        // --- 核心 HTML 生成 ---
        const weatherHtml = (q.lat && !isLocked) ? `<span id="weather-${q.id}" class="weather-badge">⌛</span>` : '';

        // 移除了 Journal (手记) 生成代码

        // 按钮 HTML
        let btnHtml = '';
        if (!isLocked) {
            btnHtml = `
                <div class="action-buttons">
                    <a href="${q.mapUrl}" target="_blank" class="btn-base map-btn" onclick="playAudio('engine'); event.stopPropagation()">
                        <i class="fa-solid fa-location-arrow"></i> 导航
                    </a>
                    <button class="btn-base check-btn ${isDone ? 'is-checked' : ''}" onclick="toggleQuestStatus(${q.id}); event.stopPropagation()">
                        ${isDone ? '<i class="fa-solid fa-rotate-left"></i> 撤销' : '<i class="fa-solid fa-check"></i> 打卡'}
                    </button>
                </div>
            `;
            card.onclick = () => openModal(q.id);
        }

        card.innerHTML = `
            <div class="card-header">
                <span class="quest-date">${q.displayDate}</span>
                ${weatherHtml}
            </div>
            <div class="quest-city">📍 ${q.city}</div>
            <div class="quest-title">${q.title}</div>
            <div class="quest-desc">${isLocked ? "??? 尚未解锁" : q.desc}</div>
            ${btnHtml}
        `;

        DOM.questList.appendChild(card);
        if (q.lat && !isLocked) fetchWeather(q.id, q.lat, q.lon);
    });
}

// 模态框逻辑
function openModal(id) {
    const q = quests.find(x => x.id === id);
    if (q) {
        DOM.modalTitle.innerText = q.title;
        DOM.modalBody.innerText = q.guide;
        DOM.modal.classList.add('active');
    }
}
function closeModal() { DOM.modal.classList.remove('active'); }
DOM.modal.onclick = (e) => { if (e.target === DOM.modal) closeModal(); };
document.querySelector('.close-btn').onclick = closeModal;

// 倒计时
function updateCountdown() {
    const diff = new Date("2026-01-15T00:00:00") - new Date();
    if (diff <= 0) { DOM.countdown.innerText = "🎉 旅程进行中！"; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    DOM.countdown.innerText = `⏳ 距离出发: ${d}天 ${h}小时`;
}

// ==========================================
// 7. 初始化
// ==========================================
DOM.bgmBtn.onclick = toggleBGM;
DOM.debugBtn.onclick = toggleDebug;
DOM.themeSelect.addEventListener('change', (e) => switchTheme(e.target.value));
document.addEventListener('keydown', e => { if (e.key === "Escape") closeModal(); });

// 启动
initTheme();
renderQuests();
MapController.init();
CommentController.init(); // 启动评论系统
updateCountdown();
setInterval(updateCountdown, 3600000);