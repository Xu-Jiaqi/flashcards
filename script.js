// 闪卡学习系统 - 主JavaScript文件
document.addEventListener('DOMContentLoaded', function() {
    // 全局变量
    let flashcards = [];
    let currentIndex = 0;
    let learnedCards = new Set();
    let isShuffled = false;
    let originalOrder = [];
    let autoFlipInterval = null;
    let autoFlipSeconds = 0;

    // DOM元素
    const flashcard = document.getElementById('flashcard');
    const questionElement = document.getElementById('question');
    const answerElement = document.getElementById('answer');
    const cardNumElement = document.getElementById('card-num');
    const cardNumBackElement = document.getElementById('card-num-back');
    const cardTypeElement = document.getElementById('card-type');
    const totalCardsElement = document.getElementById('total-cards');
    const learnedCardsElement = document.getElementById('learned-cards');
    const progressElement = document.getElementById('progress');
    const currentCardElement = document.getElementById('current-card');
    const totalCardElement = document.getElementById('total-card');
    // const progressFillElement = document.getElementById('progress-fill'); // 新设计中已移除
    const cardListElement = document.getElementById('card-list');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const flipBtn = document.getElementById('flip-btn');
    const markLearnedBtn = document.getElementById('mark-learned-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const resetBtn = document.getElementById('reset-btn');
    const autoFlipRange = document.getElementById('auto-flip-range');
    const autoFlipValue = document.getElementById('auto-flip-value');
    const fontSizeRange = document.getElementById('font-size-range');
    const fontSizeValue = document.getElementById('font-size-value');
    const animationSpeedRange = document.getElementById('animation-speed-range');
    const animationSpeedValue = document.getElementById('animation-speed-value');
    const helpModal = document.getElementById('help-modal');
    const helpBtn = document.getElementById('help-btn');
    const closeModal = document.querySelector('.close-modal');
    const loadedCardsElement = document.getElementById('loaded-cards');
    // 新设计新增DOM元素
    const menuBtn = document.getElementById('menu-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const sidePanel = document.getElementById('side-panel');
    const closePanelBtn = document.getElementById('close-panel');
    const panelOverlay = document.getElementById('panel-overlay');
    const circleProgress = document.getElementById('circle-progress');
    const progressPercent = document.getElementById('progress-percent');

    // 注意：新设计中移除了水平进度条，只保留圆形进度条
    // const progressFillElement = document.getElementById('progress-fill'); // 已移除

    // 初始化函数
    async function init() {
        showLoading(true);
        try {
            await loadFlashcards();
            updateCardDisplay();
            updateCardList();
            updateStats();
            setupEventListeners();
            loadProgressFromStorage();
        } catch (error) {
            console.error('初始化失败:', error);
            alert('应用初始化失败，请检查控制台获取详细信息。');
        } finally {
            showLoading(false);
        }
    }

    // 显示/隐藏加载指示器
    function showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (!loadingElement && show) {
            const loader = document.createElement('div');
            loader.id = 'loading';
            loader.innerHTML = `
                <div class="loading-overlay">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>加载闪卡数据中...</p>
                    </div>
                </div>
            `;
            document.body.appendChild(loader);

            // 添加CSS样式
            const style = document.createElement('style');
            style.textContent = `
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    font-family: inherit;
                }
                .loading-spinner {
                    text-align: center;
                }
                .loading-spinner i {
                    font-size: 3rem;
                    color: var(--primary-color);
                    margin-bottom: 1rem;
                }
                .loading-spinner p {
                    font-size: 1.2rem;
                    color: var(--dark-color);
                    font-weight: 500;
                }
            `;
            document.head.appendChild(style);
        } else if (loadingElement) {
            loadingElement.remove();
        }
    }

    // 从CSV加载闪卡数据
    async function loadFlashcards() {
        // 检查是否通过file://协议访问
        if (window.location.protocol === 'file:') {
            console.log('检测到file://协议访问，某些浏览器可能限制本地文件加载');
            // 可以在这里显示一个友好的提示，但不要干扰正常流程
        }

        let csvText = null;

        // 方法1: 尝试使用Fetch API
        try {
            const response = await fetch('flashcards.csv');
            if (response.ok) {
                csvText = await response.text();
                console.log('使用Fetch API加载CSV成功');
            }
        } catch (fetchError) {
            console.warn('Fetch API加载失败，尝试备用方法:', fetchError);
        }

        // 方法2: 如果Fetch失败，尝试使用XMLHttpRequest（兼容file://协议）
        if (!csvText) {
            try {
                csvText = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', 'flashcards.csv', true);
                    xhr.onload = function() {
                        if (xhr.status === 0 || xhr.status === 200) {
                            resolve(xhr.responseText);
                        } else {
                            reject(new Error(`XMLHttpRequest错误: ${xhr.status}`));
                        }
                    };
                    xhr.onerror = function() {
                        reject(new Error('XMLHttpRequest网络错误'));
                    };
                    xhr.send();
                });
                console.log('使用XMLHttpRequest加载CSV成功');
            } catch (xhrError) {
                console.warn('XMLHttpRequest加载失败:', xhrError);
            }
        }

        // 方法3: 如果以上方法都失败，使用示例数据
        if (!csvText) {
            console.error('所有CSV加载方法都失败，使用示例数据');
            alert('无法加载CSV文件，已使用示例数据。建议通过HTTP服务器运行本应用。');

            // 使用示例数据
            flashcards = [
                { id: 1, question: '示例问题：什么是JavaScript？', answer: 'JavaScript是一种高级的、解释型的编程语言。', type: '名词解释', learned: false },
                { id: 2, question: '示例问题：CSS的主要作用是什么？', answer: 'CSS用于描述网页的表现和布局。', type: '名词解释', learned: false },
                { id: 3, question: '示例问题：HTML和CSS的关系是什么？', answer: 'HTML定义网页结构，CSS控制样式表现。', type: '关系题', learned: false }
            ];

            originalOrder = [...flashcards];
            totalCardsElement.textContent = flashcards.length;
            totalCardElement.textContent = flashcards.length;
            loadedCardsElement.textContent = flashcards.length;
            return;
        }

        // 成功加载CSV数据，进行解析
        try {
            const lines = csvText.split('\n').filter(line => line.trim() !== '');

            flashcards = lines.map((line, index) => {
                // 简单的CSV解析，处理逗号分隔（注意：答案中可能包含逗号）
                const firstCommaIndex = line.indexOf(',');
                if (firstCommaIndex === -1) return null;

                const question = line.substring(0, firstCommaIndex).trim();
                const answer = line.substring(firstCommaIndex + 1).trim();

                // 检测卡片类型
                let type = '普通';
                const q = question.toLowerCase();

                if (q.includes('名词解释') || q.includes('是什么') || q.includes('什么是') || q.includes('定义')) {
                    type = '名词解释';
                } else if (q.includes('论述') || q.includes('为什么') || q.includes('如何') || q.includes('怎样') || q.includes('意义') || q.includes('作用')) {
                    type = '论述题';
                } else if (q.includes('关系') || q.includes('区别') || q.includes('联系') || q.includes('比较')) {
                    type = '关系题';
                } else if (q.includes('原则') || q.includes('特征') || q.includes('特点') || q.includes('性质')) {
                    type = '特点题';
                } else if (q.includes('第一点') || q.includes('第二点') || q.includes('第三点') || q.includes('第点')) {
                    type = '多点题';
                }

                return {
                    id: index + 1,
                    question: question,
                    answer: answer,
                    type: type,
                    learned: false
                };
            }).filter(card => card !== null);

            originalOrder = [...flashcards];
            totalCardsElement.textContent = flashcards.length;
            totalCardElement.textContent = flashcards.length;
            loadedCardsElement.textContent = flashcards.length;

            console.log(`成功加载 ${flashcards.length} 张闪卡`);
        } catch (parseError) {
            console.error('解析CSV数据失败:', parseError);
            alert('解析CSV数据失败，请检查文件格式。');

            // 使用示例数据作为备用
            flashcards = [
                { id: 1, question: '示例问题：什么是JavaScript？', answer: 'JavaScript是一种高级的、解释型的编程语言。', type: '名词解释', learned: false },
                { id: 2, question: '示例问题：CSS的主要作用是什么？', answer: 'CSS用于描述网页的表现和布局。', type: '名词解释', learned: false },
                { id: 3, question: '示例问题：HTML和CSS的关系是什么？', answer: 'HTML定义网页结构，CSS控制样式表现。', type: '关系题', learned: false }
            ];

            totalCardsElement.textContent = flashcards.length;
            totalCardElement.textContent = flashcards.length;
            loadedCardsElement.textContent = flashcards.length;
        }
    }

    // 更新卡片显示
    function updateCardDisplay() {
        if (flashcards.length === 0) return;

        const card = flashcards[currentIndex];

        // 确保卡片是正面朝上
        flashcard.classList.remove('flipped');

        // 更新卡片内容
        questionElement.textContent = card.question;
        answerElement.textContent = card.answer;
        cardNumElement.textContent = card.id;
        cardNumBackElement.textContent = card.id;
        cardTypeElement.textContent = card.type;
        currentCardElement.textContent = currentIndex + 1;

        // 更新学习标记按钮状态
        if (learnedCards.has(card.id)) {
            markLearnedBtn.classList.add('learned');
            markLearnedBtn.innerHTML = '<i class="fas fa-check-double"></i>';
            markLearnedBtn.title = '取消学习标记';
        } else {
            markLearnedBtn.classList.remove('learned');
            markLearnedBtn.innerHTML = '<i class="fas fa-check-circle"></i>';
            markLearnedBtn.title = '标记为已学习';
        }

        // 更新卡片列表中的活动项
        updateActiveCardInList();

        // 更新按钮状态
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === flashcards.length - 1;

        // 更新进度条（新设计中已移除水平进度条）
        // updateProgressBar();
    }

    // 更新卡片列表
    function updateCardList() {
        cardListElement.innerHTML = '';

        flashcards.forEach((card, index) => {
            const cardItem = document.createElement('div');
            cardItem.className = 'card-list-item';
            if (index === currentIndex) cardItem.classList.add('active');
            if (learnedCards.has(card.id)) cardItem.classList.add('learned');

            cardItem.innerHTML = `
                <div>
                    <strong>#${card.id}</strong> - ${card.type}
                    <div style="font-size: 0.9em; color: #666; margin-top: 3px;">
                        ${card.question.length > 30 ? card.question.substring(0, 30) + '...' : card.question}
                    </div>
                </div>
                <div class="card-list-learned">
                    ${learnedCards.has(card.id) ? '<i class="fas fa-check"></i>' : ''}
                </div>
            `;

            cardItem.addEventListener('click', () => {
                currentIndex = index;
                updateCardDisplay();
            });

            cardListElement.appendChild(cardItem);
        });
    }

    // 更新活动卡片在列表中的高亮
    function updateActiveCardInList() {
        const items = cardListElement.querySelectorAll('.card-list-item');
        items.forEach((item, index) => {
            item.classList.remove('active');
            if (index === currentIndex) {
                item.classList.add('active');
                // 滚动到可见区域
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    // 更新统计信息
    function updateStats() {
        const total = flashcards.length;
        const learned = learnedCards.size;
        const progressValue = total > 0 ? Math.round((learned / total) * 100) : 0;

        learnedCardsElement.textContent = learned;
        progressElement.textContent = `${progressValue}%`;

        // 更新圆形进度条
        if (circleProgress) {
            circleProgress.style.background = `conic-gradient(var(--primary) ${progressValue}%, transparent ${progressValue}%)`;
        }
        if (progressPercent) {
            progressPercent.textContent = `${progressValue}%`;
        }

        // 保存进度到本地存储
        saveProgressToStorage();
    }

    // 更新进度条（新设计中已移除水平进度条）
    // function updateProgressBar() {
    //     const progressPercent = ((currentIndex + 1) / flashcards.length) * 100;
    //     progressFillElement.style.width = `${progressPercent}%`;
    // }

    // 面板控制函数
    function openPanel() {
        if (sidePanel) sidePanel.classList.add('open');
        if (panelOverlay) panelOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closePanelFunc() {
        if (sidePanel) sidePanel.classList.remove('open');
        if (panelOverlay) panelOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // 翻转卡片
    function flipCard() {
        flashcard.classList.toggle('flipped');
    }

    // 导航到上一张卡片
    function prevCard() {
        if (currentIndex > 0) {
            currentIndex--;
            updateCardDisplay();
        }
    }

    // 导航到下一张卡片
    function nextCard() {
        if (currentIndex < flashcards.length - 1) {
            currentIndex++;
            updateCardDisplay();
        }
    }

    // 标记/取消标记为已学习
    function toggleLearned() {
        const cardId = flashcards[currentIndex].id;

        if (learnedCards.has(cardId)) {
            learnedCards.delete(cardId);
        } else {
            learnedCards.add(cardId);
        }

        updateCardDisplay();
        updateCardList();
        updateStats();
    }

    // 随机打乱卡片顺序
    function shuffleCards() {
        if (isShuffled) {
            // 恢复原始顺序
            flashcards = [...originalOrder];
            isShuffled = false;
            shuffleBtn.innerHTML = '<i class="fas fa-random"></i>';
            shuffleBtn.title = '随机打乱';
            currentIndex = 0;
        } else {
            // 打乱顺序（Fisher-Yates洗牌算法）
            const shuffled = [...flashcards];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            flashcards = shuffled;
            isShuffled = true;
            shuffleBtn.innerHTML = '<i class="fas fa-sort-amount-down"></i>';
            shuffleBtn.title = '恢复顺序';
            currentIndex = 0;
        }

        updateCardDisplay();
        updateCardList();
    }

    // 重置所有进度
    function resetProgress() {
        if (confirm('确定要重置所有学习进度吗？这将清除所有已学习标记。')) {
            learnedCards.clear();
            currentIndex = 0;
            isShuffled = false;
            flashcards = [...originalOrder];
            shuffleBtn.innerHTML = '<i class="fas fa-random"></i>';
            shuffleBtn.title = '随机打乱';
            updateCardDisplay();
            updateCardList();
            updateStats();
            localStorage.removeItem('flashcardsProgress');
        }
    }

    // 设置自动翻转
    function setAutoFlip(seconds) {
        autoFlipSeconds = seconds;
        autoFlipValue.textContent = seconds === 0 ? '关闭' : `${seconds}秒`;

        // 清除现有间隔
        if (autoFlipInterval) {
            clearInterval(autoFlipInterval);
            autoFlipInterval = null;
        }

        // 设置新的间隔
        if (seconds > 0) {
            autoFlipInterval = setInterval(() => {
                if (!flashcard.classList.contains('flipped')) {
                    flipCard();
                }
            }, seconds * 1000);
        }
    }

    // 设置字体大小
    function setFontSize(size) {
        let sizeText;
        if (size <= 16) sizeText = '小';
        else if (size <= 20) sizeText = '中';
        else sizeText = '大';

        fontSizeValue.textContent = sizeText;
        document.documentElement.style.setProperty('--card-font-size', `${size}px`);

        // 调整卡片内容字体大小
        const cardContent = document.querySelector('.card-content');
        if (cardContent) {
            cardContent.style.fontSize = `${size}px`;
        }
    }

    // 设置动画速度
    function setAnimationSpeed(speed) {
        let speedText;
        if (speed <= 3) speedText = '慢速';
        else if (speed <= 7) speedText = '中速';
        else speedText = '快速';

        animationSpeedValue.textContent = speedText;

        // 转换速度值到动画时长（1-10 映射到 1s-0.1s）
        const duration = 1.1 - (speed / 10);
        document.documentElement.style.setProperty('--transition', `all ${duration}s ease`);

        // 特别调整卡片翻转动画
        const card = document.querySelector('.card');
        if (card) {
            card.style.transition = `transform ${duration}s cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
        }
    }

    // 保存进度到本地存储
    function saveProgressToStorage() {
        const progress = {
            learnedCards: Array.from(learnedCards),
            currentIndex: currentIndex,
            isShuffled: isShuffled,
            flashcardsOrder: isShuffled ? flashcards.map(card => card.id) : null
        };
        localStorage.setItem('flashcardsProgress', JSON.stringify(progress));
    }

    // 从本地存储加载进度
    function loadProgressFromStorage() {
        const saved = localStorage.getItem('flashcardsProgress');
        if (saved) {
            try {
                const progress = JSON.parse(saved);
                learnedCards = new Set(progress.learnedCards);
                currentIndex = progress.currentIndex || 0;
                isShuffled = progress.isShuffled || false;

                if (isShuffled && progress.flashcardsOrder) {
                    // 恢复打乱顺序
                    const idToCard = {};
                    originalOrder.forEach(card => idToCard[card.id] = card);

                    flashcards = progress.flashcardsOrder
                        .map(id => idToCard[id])
                        .filter(card => card !== undefined);

                    shuffleBtn.innerHTML = '<i class="fas fa-sort-amount-down"></i>';
                    shuffleBtn.title = '恢复顺序';
                }

                updateCardDisplay();
                updateCardList();
                updateStats();

                console.log('从本地存储恢复进度');
            } catch (error) {
                console.error('恢复进度失败:', error);
            }
        }
    }

    // 导出进度
    function exportProgress() {
        const progress = {
            learnedCards: Array.from(learnedCards),
            totalCards: flashcards.length,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(progress, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `flashcards_progress_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // 导入进度
    function importProgress() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = function(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const progress = JSON.parse(e.target.result);

                    if (progress.learnedCards && Array.isArray(progress.learnedCards)) {
                        learnedCards = new Set(progress.learnedCards);
                        updateCardDisplay();
                        updateCardList();
                        updateStats();
                        alert('进度导入成功！');
                    } else {
                        alert('导入的文件格式不正确。');
                    }
                } catch (error) {
                    alert('导入失败：文件格式错误。');
                    console.error('导入进度失败:', error);
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 卡片点击翻转
        flashcard.addEventListener('click', flipCard);

        // 按钮事件
        flipBtn.addEventListener('click', flipCard);
        prevBtn.addEventListener('click', prevCard);
        nextBtn.addEventListener('click', nextCard);
        markLearnedBtn.addEventListener('click', toggleLearned);
        shuffleBtn.addEventListener('click', shuffleCards);
        resetBtn.addEventListener('click', resetProgress);

        // 面板控制按钮
        if (menuBtn) {
            menuBtn.addEventListener('click', openPanel);
        }
        if (settingsBtn) {
            settingsBtn.addEventListener('click', openPanel);
        }
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', closePanelFunc);
        }
        if (panelOverlay) {
            panelOverlay.addEventListener('click', closePanelFunc);
        }

        // 设置控件事件
        autoFlipRange.addEventListener('input', function() {
            setAutoFlip(parseInt(this.value));
        });

        fontSizeRange.addEventListener('input', function() {
            setFontSize(parseInt(this.value));
        });

        animationSpeedRange.addEventListener('input', function() {
            setAnimationSpeed(parseInt(this.value));
        });

        // 帮助模态框
        helpBtn.addEventListener('click', function() {
            helpModal.classList.add('active');
        });

        closeModal.addEventListener('click', function() {
            helpModal.classList.remove('active');
        });

        helpModal.addEventListener('click', function(event) {
            if (event.target === helpModal) {
                helpModal.classList.remove('active');
            }
        });

        // 导出/导入按钮
        document.getElementById('export-btn').addEventListener('click', function(e) {
            e.preventDefault();
            exportProgress();
        });

        document.getElementById('import-btn').addEventListener('click', function(e) {
            e.preventDefault();
            importProgress();
        });

        // 键盘快捷键
        document.addEventListener('keydown', function(event) {
            // 防止在输入框中触发
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            switch(event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    prevCard();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    nextCard();
                    break;
                case ' ':
                    event.preventDefault();
                    flipCard();
                    break;
                case 'm':
                case 'M':
                    event.preventDefault();
                    toggleLearned();
                    break;
                case 'r':
                case 'R':
                    event.preventDefault();
                    shuffleCards();
                    break;
                case 'Escape':
                    helpModal.classList.remove('active');
                    break;
                case 'h':
                case 'H':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        helpModal.classList.toggle('active');
                    }
                    break;
            }
        });

        // 初始设置值
        setAutoFlip(parseInt(autoFlipRange.value));
        setFontSize(parseInt(fontSizeRange.value));
        setAnimationSpeed(parseInt(animationSpeedRange.value));
    }

    // 页面卸载前保存进度
    window.addEventListener('beforeunload', saveProgressToStorage);

    // 初始化应用
    init();
});