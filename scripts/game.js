import { params } from './params.js';
import { fetchUserStats, saveUserStats, fetchLeaderboard } from './user.js';

let coinCount = 0;
let coinsPerTap = 1;
let upgradeCost = 2;
let automateCost = 1000;
let isAutomated = false;
let boostMultiplier = 1;
let boostInterval = 1000;
let defaultAutomationInterval = 1000; // Default interval for automation
let automationIntervalId;
let boostActive = false;
let maxTaps = 2500;
let currentTaps = maxTaps;
let tapRestoreRate = 5; // 5 taps per second
let boostEndTimeTimestamp;

const coinCountElement = document.getElementById('coin-count');
const coinElement = document.getElementById('coin');
const coinsPerTapElement = document.getElementById('coins-per-tap');
const upgradeButton = document.getElementById('upgrade-button');
const automateButton = document.getElementById('automate-button');
const boostButton = document.getElementById('boost-button');
const confirmAutomation = document.getElementById('confirm-automation');
const cancelAutomation = document.getElementById('cancel-automation');
const userStatusElement = document.getElementById('user-status');
const homeButton = document.getElementById('home-button');
const leaderboardButton = document.getElementById('leaderboard-button');
const backToHomeButton = document.getElementById('back-to-home-button');
const boostModal = document.getElementById('boost-modal');
const confirmBoost = document.getElementById('confirm-boost');
const cancelBoost = document.getElementById('cancel-boost');
const boostOptions = document.querySelectorAll('.boost-option');
const boostTimerModal = document.getElementById('boost-timer-modal');
const boostEndTime = document.getElementById('boost-end-time');
const nextFreeBoost = document.getElementById('next-free-boost');
const closeBoostTimer = document.getElementById('close-boost-timer');
const tapCountElement = document.getElementById('tap-count');
const homeView = document.getElementById('home-view');
const leaderboardView = document.getElementById('leaderboard-view');

let selectedBoostOption = null;
let boostTimeout;
let boostEndTimeInterval;

document.addEventListener("DOMContentLoaded", async () => {
    if (params.username) {
        let username = params.username;
        if (username.length > 7) {
            username = username.substring(0, 7) + "...";
        }
        document.getElementById("username").innerText = username;
    }
    if (params.profileImageUrl) {
        loadImage(params.profileImageUrl,
            (url) => document.getElementById("user-image").src = url,
            () => console.log('Profile image failed to load')
        );
    }
    const stats = await fetchUserStats();
    if (stats) {
        coinCount = stats.coinCount;
        coinsPerTap = stats.coinsPerTap;
        userStatusElement.textContent = stats.status;
        coinCountElement.textContent = coinCount;
        coinsPerTapElement.textContent = `${coinsPerTap} per tap`;
        if (stats.boosterUsage && stats.boosterUsage.isActive) {
            startBoost(stats.boosterUsage.endTime - Date.now(), stats.boosterUsage.type, true);
        }
    }
});

function loadImage(url, callback, fallback) {
    let img = new Image();
    img.onload = () => callback(url);
    img.onerror = () => fallback();
    img.src = url;
}

coinElement.addEventListener('click', (e) => {
    if (currentTaps >= coinsPerTap * boostMultiplier) {
        currentTaps -= coinsPerTap * boostMultiplier;
        updateTapCount();
        const rect = coinElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addCoins(coinsPerTap * boostMultiplier, x, y);
        createParticles(10);
        // Save stats to the server
        saveUserStats(coinCount, coinsPerTap, userStatusElement.textContent, boostActive, boostEndTimeTimestamp);
    }
});

upgradeButton.addEventListener('click', () => {
    if (coinCount >= upgradeCost) {
        coinCount -= upgradeCost;
        coinsPerTap += 1;
        upgradeCost *= 2;
        coinCountElement.textContent = coinCount;
        coinsPerTapElement.textContent = `${coinsPerTap} per tap`;
        saveUserStats(coinCount, coinsPerTap, userStatusElement.textContent, boostActive, boostEndTimeTimestamp);
    }
});

automateButton.addEventListener('click', () => {
    confirmAutomation.disabled = coinCount < automateCost;
    document.getElementById('automation-modal').style.display = 'flex';
});

confirmAutomation.addEventListener('click', () => {
    if (coinCount >= automateCost) {
        coinCount -= automateCost;
        isAutomated = true;
        automateButton.style.display = 'none';
        coinCountElement.textContent = coinCount;
        coinsPerTapElement.textContent = `${coinsPerTap} per tap`;
        startAutomation(defaultAutomationInterval);
        saveUserStats(coinCount, coinsPerTap, userStatusElement.textContent, boostActive, boostEndTimeTimestamp);
    }
    document.getElementById('automation-modal').style.display = 'none';
});

cancelAutomation.addEventListener('click', () => {
    document.getElementById('automation-modal').style.display = 'none';
});

boostButton.addEventListener('click', () => {
    updateBoostOptions();
    boostModal.style.display = 'flex';
});

boostOptions.forEach(option => {
    option.addEventListener('click', () => {
        if (!option.classList.contains('disabled')) {
            boostOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedBoostOption = option.id;
            updateBoostButton();
        }
    });
});

confirmBoost.addEventListener('click', () => {
    if (selectedBoostOption) {
        applyBoost(selectedBoostOption);
        saveUserStats(coinCount, coinsPerTap, userStatusElement.textContent, boostActive, boostEndTimeTimestamp);
    }
    boostModal.style.display = 'none';
});

cancelBoost.addEventListener('click', () => {
    boostModal.style.display = 'none';
});

homeButton.addEventListener('click', () => {
    homeView.style.display = 'flex';
    leaderboardView.style.display = 'none';
    homeButton.classList.add('selected');
    leaderboardButton.classList.remove('selected');
});

leaderboardButton.addEventListener('click', () => {
    homeView.style.display = 'none';
    leaderboardView.style.display = 'flex';
    leaderboardButton.classList.add('selected');
    homeButton.classList.remove('selected');
    loadLeaderboard();
});



closeBoostTimer.addEventListener('click', () => {
    boostTimerModal.style.display = 'none';
});

function addCoins(amount, x = null, y = null) {
    animateCoinCount(coinCount, coinCount + amount);
    coinCount += amount;
    updateUserStatus();

    if (x !== null && y !== null) {
        const fadeText = document.createElement('div');
        fadeText.textContent = `+${amount}`;
        fadeText.classList.add('fade-text');
        fadeText.style.left = `${x}px`;
        fadeText.style.top = `${y}px`;
        coinElement.appendChild(fadeText);

        setTimeout(() => {
            fadeText.remove();
        }, 1000);
    }
}

function startAutomation(interval) {
    if (automationIntervalId) {
        clearInterval(automationIntervalId);
    }
    automationIntervalId = setInterval(() => {
        if (isAutomated || boostActive) {
            addCoins(coinsPerTap * boostMultiplier);
            saveUserStats(coinCount, coinsPerTap, userStatusElement.textContent, boostActive, boostEndTimeTimestamp);
        }
    }, interval);
}

function updateUserStatus() {
    if (coinCount < 1000) {
        userStatusElement.textContent = 'Junior';
    } else if (coinCount < 10000) {
        userStatusElement.textContent = 'Junior+';
    } else if (coinCount < 100000) {
        userStatusElement.textContent = 'Student';
    } else if (coinCount < 500000) {
        userStatusElement.textContent = 'Student+';
    } else if (coinCount < 2000000) {
        userStatusElement.textContent = 'Master';
    } else if (coinCount < 5000000) {
        userStatusElement.textContent = 'Master+';
    } else {
        userStatusElement.textContent = 'God';
    }
}

function createFallingStar() {
    const star = document.createElement('div');
    star.classList.add('star');
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `-${Math.random() * 20}px`; // Ensure stars start from above the screen
    document.querySelector('.game-container').appendChild(star);

    setTimeout(() => {
        star.remove();
    }, 10000);
}

function createParticles(count) {
    const radius = coinElement.offsetWidth / 2;
    const centerX = coinElement.offsetLeft + radius;
    const centerY = coinElement.offsetTop + radius;

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--x', `${Math.random() * 200 - 100}px`);
        particle.style.setProperty('--y', `${Math.random() * 200 - 100}px`);
        document.querySelector('.game-container').appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 600);
    }
}

function animateCoinCount(start, end) {
    const duration = 1000;
    const increment = (end - start) / (duration / 60);
    let current = start;
    const counter = setInterval(() => {
        current += increment;
        coinCountElement.textContent = Math.floor(current);
        if (increment > 0 && current >= end || increment < 0 && current <= end) {
            clearInterval(counter);
            coinCountElement.textContent = end;
        }
    }, 16);
}

function applyBoost(optionId) {
    let boostDuration, nextAvailable, cost;
    if (optionId === 'boost-option-1') {
        boostMultiplier = 2;
        boostInterval = 400;
        boostDuration = 10 * 60 * 1000;
        nextAvailable = 2 * 60 * 60 * 1000;
        cost = 0;
    } else if (optionId === 'boost-option-2') {
        boostMultiplier = 2;
        boostInterval = 200;
        boostDuration = 30 * 60 * 1000;
        nextAvailable = 5 * 60 * 60 * 1000;
        cost = 5000;
    } else if (optionId === 'boost-option-3') {
        boostMultiplier = 4;
        boostInterval = 400;
        boostDuration = 60 * 60 * 1000;
        nextAvailable = 24 * 60 * 60 * 1000;
        cost = 20000;
    }

    if (coinCount >= cost) {
        coinCount -= cost;
        coinCountElement.textContent = coinCount;
        startBoost(boostDuration, optionId, false);
        saveUserStats(coinCount, coinsPerTap, userStatusElement.textContent, boostActive, boostEndTimeTimestamp);
    }
}

function startBoost(duration, type, isResuming = false) {
    boostButton.disabled = true;
    const endTime = isResuming ? duration : Date.now() + duration;
    boostEndTimeTimestamp = endTime;
    boostActive = true;

    if (!isResuming) {
        // If not resuming, clear any previous timeout
        clearTimeout(boostTimeout);
    }

    boostTimeout = setTimeout(() => {
        boostMultiplier = 1;
        boostInterval = 1000;
        boostActive = false;
        boostButton.disabled = false;
        boostButton.textContent = 'Boost';
        if (isAutomated) {
            startAutomation(defaultAutomationInterval);
        } else {
            clearInterval(automationIntervalId);
        }
        saveUserStats(coinCount, coinsPerTap, userStatusElement.textContent, boostActive, boostEndTimeTimestamp);
    }, duration);

    boostEndTime.textContent = new Date(endTime).toLocaleTimeString();
    boostTimerModal.style.display = 'flex';

    updateBoostButtonText(endTime);
    boostEndTimeInterval = setInterval(() => {
        updateBoostButtonText(endTime);
    }, 1000);

    startAutomation(boostInterval);
    saveUserStats(coinCount, coinsPerTap, userStatusElement.textContent, boostActive, boostEndTimeTimestamp);
}

function updateBoostButton() {
    if (selectedBoostOption === 'boost-option-1') {
        confirmBoost.textContent = 'Confirm (Free)';
    } else if (selectedBoostOption === 'boost-option-2') {
        confirmBoost.textContent = 'Confirm (5000 coins)';
    } else if (selectedBoostOption === 'boost-option-3') {
        confirmBoost.textContent = 'Confirm (20000 coins)';
    }
    confirmBoost.disabled = false;
}

function updateBoostButtonText(endTime) {
    const remainingTime = endTime - Date.now();
    if (remainingTime <= 0) {
        clearInterval(boostEndTimeInterval);
        boostButton.textContent = 'Boost';
    } else {
        const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        boostButton.textContent = `(${minutes}m ${seconds}s)`;
    }
}

function updateBoostOptions() {
    boostOptions.forEach(option => {
        option.classList.remove('disabled');
        const optionId = option.id;
        let cost;
        if (optionId === 'boost-option-2') {
            cost = 5000;
        } else if (optionId === 'boost-option-3') {
            cost = 20000;
        }
        if (coinCount < cost) {
            option.classList.add('disabled');
        }
    });
}

function updateTapCount() {
    tapCountElement.textContent = `${currentTaps}/${maxTaps}`;
}

setInterval(() => {
    if (currentTaps < maxTaps) {
        currentTaps = Math.min(currentTaps + tapRestoreRate, maxTaps);
        updateTapCount();
    }
}, 1000);

setInterval(createFallingStar, 200);

async function loadLeaderboard() {
    const leaderboardList = document.querySelector('.leaderboard-list');
    leaderboardList.innerHTML = ''; // Clear previous content

    // Fetch leaderboard data from the server
    const leaderboardData = await fetchLeaderboard();

    leaderboardData.forEach((player, index) => {
        const playerElement = document.createElement('div');
        playerElement.classList.add('leaderboard-item');
        playerElement.innerHTML = `
            <div class="left-col">
            <p class="rank">${index + 1}</p>
            <img src="assets/profile.webp" alt="Profile Image">
            <p class="leader-username">${player.username}</p>
            </div>
            <div class="right-col">
            <span class="score">${player.coinCount} <img src="assets/sitcoin.png" alt="Coin Icon" class="coin-icon"></span>
            </div>`;
        if (index < 3) {
            playerElement.classList.add('top-three');
        }
        leaderboardList.appendChild(playerElement);
    });
}
