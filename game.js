// Game State
const gameState = {
    nickname: '',
    score: 0,
    isPlaying: false,
    tapCount: 0,
    currentImageSet: 1,
    fastTapCount: 0,
    lastTapTime: 0,
    slap2Played: false,
    leaderboard: [],
};

// Audio Element
const audioElement = new Audio();

// DOM Elements
const nicknameModal = document.getElementById('nicknameModal');
const nicknameInput = document.getElementById('nicknameInput');
const startGameBtn = document.getElementById('startGameBtn');
const mainGame = document.getElementById('mainGame');
const gameFrame = document.getElementById('gameFrame');
const character = document.getElementById('character');
const scoreDisplay = document.getElementById('score');
const gameStatus = document.getElementById('gameStatus');
const newRoundBtn = document.getElementById('newRoundBtn');
const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const roundOverModal = document.getElementById('roundOverModal');
const roundOverScore = document.getElementById('roundOverScore');
const roundOverRank = document.getElementById('roundOverRank');
const playAgainBtn = document.getElementById('playAgainBtn');
const floatingText = document.getElementById('floatingText');

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
    focusNicknameInput();
});

nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startGame();
    }
});

startGameBtn.addEventListener('click', startGame);
newRoundBtn.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.score > 0) {
        saveScore(gameState.nickname, gameState.score);
    }
    startNewRound();
});
viewLeaderboardBtn.addEventListener('click', showLeaderboard);
closeLeaderboardBtn.addEventListener('click', hideLeaderboard);
playAgainBtn.addEventListener('click', startNewRound);
gameFrame.addEventListener('click', onGameFrameClick);

function focusNicknameInput() {
    nicknameInput.focus();
}

function startGame() {
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
        alert('Please enter a nickname!');
        focusNicknameInput();
        return;
    }

    gameState.nickname = nickname;
    nicknameModal.style.display = 'none';
    mainGame.style.display = 'block';
    startNewRound();
}

function startNewRound() {
    gameState.score = 0;
    gameState.isPlaying = true;
    gameState.tapCount = 0;
    gameState.currentImageSet = 1;
    gameState.fastTapCount = 0;
    gameState.lastTapTime = 0;
    gameState.slap2Played = false;
    scoreDisplay.textContent = '0';
    gameStatus.textContent = '';
    roundOverModal.style.display = 'none';
    hideLeaderboard();
    character.src = getBeforeImage();
}

function getBeforeImage() {
    return gameState.currentImageSet === 2 ? 'assets/before2.png' : 'assets/before.png';
}

function swapImage() {
    character.src = 'assets/after.png';
    setTimeout(() => {
        character.src = getBeforeImage();
    }, 120);
}

function onGameFrameClick(e) {
    if (!gameState.isPlaying) {
        return;
    }

    // Track fast taps
    const now = Date.now();
    if (now - gameState.lastTapTime < 300) {
        gameState.fastTapCount++;
    } else {
        gameState.fastTapCount = 1;
    }
    gameState.lastTapTime = now;

    // Increment tap count
    gameState.tapCount++;
    if (gameState.tapCount >= 10) {
        gameState.tapCount = 0;
        gameState.currentImageSet = 2;
    }

    // Increment score
    gameState.score += 10;
    scoreDisplay.textContent = gameState.score;

    // Get click position for floating text
    const rect = gameFrame.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Swap image
    swapImage();

    // Play sound (alternate based on fast tap count)
    if (gameState.fastTapCount >= 5 && !gameState.slap2Played) {
        playSound('slap2');
        gameState.slap2Played = true;
    } else if (gameState.fastTapCount < 5) {
        playSound();
    }

    // Spawn slipper emoji
    spawnSlipper(x, y);

    // Screen shake
    screenShake();

    // Floating +10 text
    showFloatingText(x, y);
}

function playSound(variant = '') {
    try {
        const soundFile = variant === 'slap2' ? 'assets/slap 2.wav' : 'assets/slap.mp3.wav';
        const sound = new Audio(soundFile);
        sound.play().catch((err) => {
            // Gracefully handle error if audio fails to load
            console.log('Audio play failed (audio file may not exist)', err);
        });
    } catch (err) {
        // Gracefully handle error
        console.log('Audio error', err);
    }
}

function spawnSlipper(x, y) {
    const slipper = document.createElement('div');
    slipper.className = 'slipper';
    slipper.textContent = '🩴';
    slipper.style.left = x + 'px';
    slipper.style.top = y + 'px';
    slipper.style.transform = 'translate(-50%, -50%)';

    const slippersContainer = document.getElementById('slippersContainer');
    slippersContainer.appendChild(slipper);

    // Remove after animation
    setTimeout(() => {
        slipper.remove();
    }, 400);
}

function screenShake() {
    gameFrame.classList.remove('shake');
    // Trigger reflow to restart animation
    void gameFrame.offsetWidth;
    gameFrame.classList.add('shake');

    setTimeout(() => {
        gameFrame.classList.remove('shake');
    }, 120);
}

function showFloatingText(x, y) {
    floatingText.style.left = x + 'px';
    floatingText.style.top = y + 'px';
    floatingText.classList.remove('pop');
    // Trigger reflow
    void floatingText.offsetWidth;
    floatingText.classList.add('pop');
}

function updateTimer() {
    timerDisplay.textContent = gameState.timeLeft;
}

// Leaderboard Functions
function loadLeaderboard() {
    const stored = localStorage.getItem('flippaLeaderboard');
    if (stored) {
        gameState.leaderboard = JSON.parse(stored);
    } else {
        gameState.leaderboard = [];
    }
}

function saveScore(nickname, score) {
    const entry = {
        nickname,
        score,
        date: new Date().toLocaleDateString(),
    };

    gameState.leaderboard.push(entry);
    gameState.leaderboard.sort((a, b) => b.score - a.score);
    gameState.leaderboard = gameState.leaderboard.slice(0, 10);

    localStorage.setItem('flippaLeaderboard', JSON.stringify(gameState.leaderboard));

    // Return rank of the current player's latest score
    return gameState.leaderboard.findIndex((e) => e === entry) + 1;
}

function showLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');

    if (gameState.leaderboard.length === 0) {
        leaderboardList.innerHTML = '<p>No scores yet. Play to get on the board!</p>';
    } else {
        leaderboardList.innerHTML = gameState.leaderboard
            .map((entry, index) => {
                const rank = index + 1;
                let rankClass = '';
                if (rank === 1) rankClass = 'top-1';
                else if (rank === 2) rankClass = 'top-2';
                else if (rank === 3) rankClass = 'top-3';

                return `
                    <div class="leaderboard-entry ${rankClass}">
                        <div class="leaderboard-rank">#${rank}</div>
                        <div class="leaderboard-name">${escapeHtml(entry.nickname)}</div>
                        <div>
                            <div class="leaderboard-score">${entry.score}</div>
                            <div class="leaderboard-date">${entry.date}</div>
                        </div>
                    </div>
                `;
            })
            .join('');
    }

    leaderboardModal.style.display = 'flex';
}

function hideLeaderboard() {
    leaderboardModal.style.display = 'none';
}

function resetLeaderboard() {
    if (confirm('Are you sure you want to reset the leaderboard? This cannot be undone.')) {
        gameState.leaderboard = [];
        localStorage.removeItem('flippaLeaderboard');
        showLeaderboard();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
