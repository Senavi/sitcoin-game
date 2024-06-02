import { params } from './params.js';

const baseURL = "https://sitcoincryptogame-ed48f5fed350.herokuapp.com"; // Ensure this is correct and without trailing slash

// Function to fetch the IP address
async function fetchIpAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error("Error fetching IP address:", error);
        return null;
    }
}

async function fetchUserStats() {
    if (params.telegramId) {
        try {
            const response = await fetch(`${baseURL}/user-stats/${params.telegramId}`);
            const stats = await response.json();
            return stats;
        } catch (error) {
            console.error("Error fetching user stats:", error);
            return null;
        }
    }
    return null;
}

async function saveUserStats(coinCount, coinsPerTap, status, boostActive, boostEndTimeTimestamp, selectedBoostOption) {
    const ipAddress = await fetchIpAddress(); // Fetch the IP address

    const data = {
        coinCount,
        coinsPerTap,
        status,
        username: params.username,
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
        ipAddress // Include the IP address
    };
    try {
        const response = await fetch(`${baseURL}/user-stats/${params.telegramId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const updatedUser = await response.json();
        console.log("Updated user stats:", updatedUser); // Debugging
    } catch (error) {
        console.error("Error saving user stats:", error); // Debugging
    }
}

async function fetchLeaderboard() {
    try {
        const response = await fetch(`${baseURL}/leaderboard`);
        const leaderboardData = await response.json();
        return leaderboardData;
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        return [];
    }
}

export { fetchUserStats, saveUserStats, fetchLeaderboard };
