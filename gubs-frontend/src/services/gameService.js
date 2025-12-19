import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Create a new game
 * @param {string} playerName - Name of the player creating the game
 * @param {number} maxPlayers - Maximum number of players (default 6)
 * @returns {Promise<Object>} - Response data from API
 */
export const createGame = async (playerName, maxPlayers = 6) => {
  try {
    const response = await axios.post(`${API_URL}/api/games`, {
      playerName,
      maxPlayers
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Failed to create game';
    throw new Error(errorMessage);
  }
};

/**
 * Get a game by ID
 * @param {string} gameId - ID of the game
 * @returns {Promise<Object>} - Game data
 */
export const getGame = async (gameId) => {
  try {
    const response = await axios.get(`${API_URL}/api/games/${gameId}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Failed to get game';
    throw new Error(errorMessage);
  }
};

/**
 * Get all active games
 * @returns {Promise<Array>} - Array of games
 */
export const getAllGames = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/games`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Failed to get games';
    throw new Error(errorMessage);
  }
};
