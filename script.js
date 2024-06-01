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

const coinCountElement = document.getElementById('coin-count');
const coinElement = document.getElementById('coin');
const coinsPerTapElement = document.getElementById('coins-per-tap');
const upgradeButton = document.getElementById('upgrade-button');
const automateButton = document.getElementById('automate-button');
const boostButton = document.getElementById('boost-button');
const automationModal = document.getElementById('automation-modal');
const confirmAutomation = document.getElementById('confirm-automation');
const cancelAutomation = document.getElementById('cancel-automation');
const userStatusElement = document.getElementById('user-status');
const homeButton = document.getElementById('home-button');
const tasksButton = document.getElementById('tasks-button');
const tasksModal = document.getElementById('tasks-modal');
const closeTasks = document.getElementById('close-tasks');
const boostModal = document.getElementById('boost-modal');
const confirmBoost = document.getElementById('confirm-boost');
const cancelBoost = document.getElementById('cancel-boost');
const boostOptions = document.querySelectorAll('.boost-option');
const boostTimerModal = document.getElementById('boost-timer-modal');
const boostEndTime = document.getElementById('boost-end-time');
const nextFreeBoost = document.getElementById('next-free-boost');
const closeBoostTimer = document.getElementById('close-boost-timer');
const tapCountElement = document.getElementById('tap-count');

let selectedBoostOption = null;
let boostTimeout;
let boostEndTimeInterval;

coinElement.addEventListener('click', (e) => {
    if (currentTaps >= coinsPerTap * boostMultiplier) {
        currentTaps -= coinsPerTap * boostMultiplier;
        updateTapCount();
        const rect = coinElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addCoins(coinsPerTap * boostMultiplier, x, y);
        createParticles(10);
    }
});

// Example code to read query parameters in your game (e.g., script.js)
function getQueryParams() {
    let params = {};
    window.location.search.substring(1).split("&").forEach(pair => {
        let [key, value] = pair.split("=");
        params[key] = value;
    });
    return params;
}

document.addEventListener("DOMContentLoaded", () => {
    let params = getQueryParams();
    if (params.username) {
        document.getElementById("username").innerHTML = params.username + `<span class="user-status" id="user-status">Junior</span>`;
        console.log(params.username);
    }
});


upgradeButton.addEventListener('click', () => {
    if (coinCount >= upgradeCost) {
        coinCount -= upgradeCost;
        coinsPerTap += 1;
        upgradeCost *= 2;
        coinCountElement.textContent = coinCount;
        coinsPerTapElement.textContent = `${coinsPerTap} per tap`;
    }
});

automateButton.addEventListener('click', () => {
    confirmAutomation.disabled = coinCount < automateCost;
    automationModal.style.display = 'flex';
});

confirmAutomation.addEventListener('click', () => {
    if (coinCount >= automateCost) {
        coinCount -= automateCost;
        isAutomated = true;
        automateButton.style.display = 'none';
        coinCountElement.textContent = coinCount;
        coinsPerTapElement.textContent = `${coinsPerTap} per tap`;
        startAutomation(defaultAutomationInterval);
    }
    automationModal.style.display = 'none';
});

cancelAutomation.addEventListener('click', () => {
    automationModal.style.display = 'none';
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
    }
    boostModal.style.display = 'none';
});

cancelBoost.addEventListener('click', () => {
    boostModal.style.display = 'none';
});

homeButton.addEventListener('click', () => {
    homeButton.classList.add('selected');
    tasksButton.classList.remove('selected');
});

tasksButton.addEventListener('click', () => {
    tasksButton.classList.add('selected');
    homeButton.classList.remove('selected');
    tasksModal.style.display = 'flex';
});

closeTasks.addEventListener('click', () => {
    tasksModal.style.display = 'none';
    homeButton.classList.add('selected');
    tasksButton.classList.remove('selected');
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
        startBoost(boostDuration, nextAvailable);
    }
}

function startBoost(duration, nextAvailable) {
    boostButton.disabled = true;
    const endTime = Date.now() + duration;
    const nextBoostTime = Date.now() + nextAvailable;
    boostActive = true;

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
    }, duration);

    boostEndTime.textContent = new Date(endTime).toLocaleTimeString();
    nextFreeBoost.textContent = new Date(nextBoostTime).toLocaleTimeString();
    boostTimerModal.style.display = 'flex';

    updateBoostButtonText(endTime);
    boostEndTimeInterval = setInterval(() => {
        updateBoostButtonText(endTime);
    }, 1000);

    startAutomation(boostInterval);
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
