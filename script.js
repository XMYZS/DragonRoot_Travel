// --- 1. 全局变量与配置 ---
let isDebugMode = false; // 调试模式开关

// --- 新增：初始化读取存档 ---
// 尝试从 LocalStorage 获取已完成的任务ID数组，如果没有则为空数组
let completedQuestIds = JSON.parse(localStorage.getItem('completedQuestIds')) || [];

// --- 2. 数据定义 ---
const quests = [
    {
        id: 1,
        date: "2026-01-15",
        displayDate: "1月15日 - 1月17日",
        city: "长沙 (第一章)",
        title: "星城探秘",
        desc: "<b>Day 1:</b> 抵达五一广场，茶颜悦色 & 口味虾。<br><b>Day 2:</b> 岳麓山爬山，橘子洲头打卡。<br><b>Day 3:</b> 湖南省博看辛追夫人。",
        mapUrl: "https://www.amap.com/search?query=长沙五一广场",
        // 新增：详细攻略
        guide: "【美食密函】\n1. 茶颜悦色：别只喝幽兰拿铁，试试'声声乌龙'。\n2. 笨萝卜浏阳菜馆：排队很恐怖，建议下午4点就去取号。\n3. 黑色经典臭豆腐：五一广场随处可见，趁热吃。\n\n【避坑指南】\n岳麓山不想爬可以坐索道，但下山建议滑道（排队久的话就算了）。省博一定要提前7天定闹钟约票！"
    },
    {
        id: 2,
        date: "2026-01-18",
        displayDate: "1月18日 - 1月19日",
        city: "岳阳 & 咸宁 (过渡篇)",
        title: "江湖与温泉",
        desc: "<b>Day 4:</b> 上午高铁去岳阳楼看洞庭湖，下午转场咸宁。<br><b>Day 5:</b> 咸宁全天泡温泉，晚间抵达武汉。",
        mapUrl: "https://www.amap.com/search?query=岳阳楼",
        guide: "【行路难】\n岳阳楼背诵《岳阳楼记》在某些节假日可以免票，你可以试试背一下。\n\n【温泉Tips】\n咸宁温泉很多，碧桂园或三江森林都不错。记得带个手机防水袋，泡温泉的时候刷手机很爽，但小心掉水里。"
    },
    {
        id: 3,
        date: "2026-01-20",
        displayDate: "1月20日 - 1月24日",
        city: "武汉 (高潮篇)",
        title: "江城深度游",
        desc: "<b>Day 6:</b> 黄鹤楼 & 长江大桥。<br><b>Day 7:</b> 湖北省博。<br><b>Day 8:</b> 东湖磨山。<br><b>Day 9:</b> 江汉路 & 轮渡。<br><b>Day 10:</b> 粮道街过早。",
        mapUrl: "https://www.amap.com/search?query=武汉黄鹤楼",
        guide: "【过早文化】\n一定要试：热干面（加醋！）、三鲜豆皮、面窝、糊汤粉。\n\n【特种兵路线】\n黄鹤楼其实在外面拍个照就行，没必要一定要上去挤。反而长江大桥一定要走一走，晚上吹江风很舒服。\n\n【轮渡】\n去中华路码头坐轮渡到武汉关，只要1.5元，比几百块的游船香多了，记得抢二楼甲板位置。"
    },
    {
        id: 4,
        date: "2026-01-25",
        displayDate: "1月25日",
        city: "返程",
        title: "满载而归",
        desc: "整理行李与特产，前往天河机场/火车站，返回温暖的家。",
        mapUrl: "https://www.amap.com/search?query=武汉天河机场",
        guide: "【伴手礼】\n周黑鸭到处都有，可以去菜市场买点现卤的鸭脖。\n检查身份证、充电器有没有落在酒店。旅途结束，期待下一次出发！"
    }
];

// --- 3. 核心功能：切换打卡状态并存档 ---
function toggleQuestStatus(questId) {
    // 检查 ID 是否已存在于数组中
    const index = completedQuestIds.indexOf(questId);

    if (index > -1) {
        // 如果存在，说明用户想“取消完成” -> 从数组移除
        completedQuestIds.splice(index, 1);
    } else {
        // 如果不存在，说明用户想“标记完成” -> 加入数组
        completedQuestIds.push(questId);
    }

    // 重点：保存回 localStorage
    localStorage.setItem('completedQuestIds', JSON.stringify(completedQuestIds));

    // 重新渲染页面，更新视图
    renderQuests();
}

// --- 4. 调试功能 ---
function toggleDebug() {
    isDebugMode = !isDebugMode;
    const btn = document.getElementById('debug-btn');
    if (btn) {
        if (isDebugMode) {
            btn.textContent = "🛠️ 调试模式: 开 (全解锁)";
            btn.classList.add('active');
        } else {
            btn.textContent = "🛠️ 调试模式: 关";
            btn.classList.remove('active');
        }
    }
    renderQuests();
}

// --- 5. 倒计时功能 ---
function updateCountdown() {
    const header = document.getElementById('header');
    const targetDate = new Date("2026-01-15T00:00:00");
    const now = new Date();
    const diff = targetDate - now;

    let countdownDiv = document.getElementById('countdown-display');
    if (!countdownDiv) {
        countdownDiv = document.createElement('div');
        countdownDiv.id = 'countdown-display';
        countdownDiv.style.fontSize = "1.2rem";
        countdownDiv.style.color = "#4db8ff";
        countdownDiv.style.marginTop = "10px";
        header.appendChild(countdownDiv);
    }

    if (diff <= 0) {
        countdownDiv.innerHTML = "旅程进行中！";
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    countdownDiv.innerHTML = `距离出发还有：${days} 天 ${hours} 小时`;
}

// --- 6. 渲染列表功能 ---
function renderQuests() {
    const listContainer = document.getElementById('quest-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    const now = new Date();

    quests.forEach(quest => {

        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');

        // --- 状态判断逻辑 ---

        // 1. 检查是否在存档中
        const isCompleted = completedQuestIds.includes(quest.id);

        // 2. 检查时间锁定
        const questDate = new Date(quest.date + "T00:00:00");
        let isLocked = questDate > now;

        // 调试模式或已完成状态下，强制解锁
        if (isDebugMode || isCompleted) {
            isLocked = false;
        }

        // --- 样式应用 ---
        if (isCompleted) {
            cardDiv.classList.add('done');
        }
        if (isLocked) {
            cardDiv.classList.add('locked');
        }

        const displayDesc = isLocked ? "??? 尚未解锁" : quest.desc;
        const mapLink = quest.mapUrl ? quest.mapUrl : '#';

        // --- 按钮生成逻辑 ---
        let buttonsHtml = '';

        if (!isLocked) {
            // 只有解锁状态才显示按钮
            const btnText = isCompleted ? "↩️ 撤销" : "✅ 打卡";
            const btnClass = isCompleted ? "check-btn is-checked" : "check-btn";

            buttonsHtml = `
                <div class="action-buttons">
                    <a href="${mapLink}" target="_blank" class="map-btn" onclick="event.stopPropagation()">📍 导航</a>
                    <button class="${btnClass}" onclick="toggleQuestStatus(${quest.id}); event.stopPropagation()">
                        ${btnText}
                    </button>
                </div>
            `;
        }
        if (!isLocked) {
            cardDiv.onclick = function () {
                openModal(quest.id);
            };
            // 增加一个提示性的 title 属性
            cardDiv.title = "点击查看详细攻略";
        }
        // ... 前面的代码不变 ...

        cardDiv.innerHTML = `
            <div class="quest-date">${quest.displayDate || quest.date}</div>
            
            <div class="quest-city">📍 ${quest.city}</div>
            <div class="quest-title">${quest.title}</div>
            <div class="quest-desc" style="margin-top:8px; font-size:0.9rem; color:#ccc;">${displayDesc}</div>
            ${buttonsHtml}
        `;

        listContainer.appendChild(cardDiv);
    });
}

// --- 7. 初始化 ---
renderQuests();
updateCountdown();
setInterval(updateCountdown, 1000 * 60 * 60);

// --- 8. 模态框功能 ---
function openModal(questId) {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    // 填充内容
    document.getElementById('modal-title').innerText = quest.title;
    document.getElementById('modal-body').innerText = quest.guide || "暂无详细攻略";

    // 显示模态框
    document.getElementById('modal').classList.add('active');
}

function closeModal(event) {
    // 隐藏模态框
    document.getElementById('modal').classList.remove('active');
}

// 增加 ESC 键关闭功能，提升体验
document.addEventListener('keydown', function (event) {
    if (event.key === "Escape") {
        closeModal();
    }
});