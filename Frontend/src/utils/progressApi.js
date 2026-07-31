import api from '../api/axios'; // Centralized axios instance

/**
 * Startup progress create karne ke liye
 * @param {Object} data - { currentPhase, percentage, startupId }
 */
export const saveProgress = async (data) => {
    try {
        const response = await api.post('/progress', {
            currentPhase: data.currentPhase,
            percentage: data.percentage,
            startupId: data.startupId
        });

        console.log("Progress saved successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error("Creation failed:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Startup ID ke zariye progress fetch karne ke liye (Alias methods dono support ke liye)
 * @param {Long} startupId
 */
export const getProgressByStartupId = async (startupId) => {
    try {
        const response = await api.get(`/progress/startup/${startupId}`);
        return response.data;
    } catch (error) {
        console.error("Fetching progress failed:", error.response?.data || error.message);
        throw error;
    }
};

export const getProgressByStartup = async (startupId) => {
    return await getProgressByStartupId(startupId);
};

/**
 * Progress update karne ke liye
 * @param {Long} id - Progress table ki primary key ID
 * @param {Object} data - Update hua data
 */
export const updateProgress = async (id, data) => {
    try {
        const response = await api.put(`/progress/${id}`, {
            currentPhase: data.currentPhase,
            percentage: data.percentage
        });
        return response.data;
    } catch (error) {
        console.error("Update failed:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Create or Update progress wrapper
 */
export const createOrUpdateProgress = async (progressData) => {
    return await saveProgress(progressData);
};