// user.js

import { params } from './params.js';

const baseURL = "https://sitcoincryptogame-ed48f5fed350.herokuapp.com"; // Ensure this is correct and without trailing slash

async function fetchUserStats() {
    if (params.telegramId) {
        const response = await fetch(`${baseURL}/user-stats/${params.telegramId}`);
        const stats = await response.json();
        console.log("Fetched user stats:", stats); // Debugging
        return stats;
    }
    return null;
}

function saveUserStats(coinCount, coinsPerTap, status, boostActive, boostEndTimeTimestamp, selectedBoostOption) {
    const data = {
        coinCount,
        coinsPerTap,
        status,
        telegramLink: `https://t.me/${params.username}`,
        boosterUsage: boostActive ? {
            isActive: true,
            endTime: boostEndTimeTimestamp, // endTime is a timestamp
            type: selectedBoostOption
        } : {
            isActive: false,
            endTime: null,
            type: null
        },
        lastPlayedTime: new Date().toISOString(),
    };
    console.log("Saving user stats:", data); // Debugging
    fetch(`${baseURL}/user-stats/${params.telegramId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(updatedUser => console.log("Updated user stats:", updatedUser)) // Debugging
        .catch(error => console.error("Error saving user stats:", error)); // Debugging
}

export { fetchUserStats, saveUserStats };
