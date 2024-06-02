// user.js

import { params } from './params.js';

const baseURL = "https://sitcoincryptogame-ed48f5fed350.herokuapp.com/"; // Ensure this is correct and without trailing slash

async function fetchUserStats() {
    if (params.telegramId) {
        const response = await fetch(`${baseURL}/user-stats/${params.telegramId}`);
        const stats = await response.json();
        console.log("Fetched user stats:", stats); // Debugging
        return stats;
    }
    return null;
}

function saveUserStats() {
    const data = {
        telegramLink: `https://t.me/${params.username}`,
    };
    console.log("Saving user link:", data); // Debugging
    fetch(`${baseURL}/user-stats/${params.telegramId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(updatedUser => console.log("Updated user link:", updatedUser)) // Debugging
        .catch(error => console.error("Error saving user link:", error)); // Debugging
}


export { fetchUserStats, saveUserStats };
