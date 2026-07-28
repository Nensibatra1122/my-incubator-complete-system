import api from '../api/axios'; // Aapka existing axios instance import ho raha hai

/**
 * Startup progress create karne ke liye
 * @param {Object} data - { currentPhase, percentage, startupId }
 */
export const saveProgress = async (data) => {
    try {
        // Axios instance ka use ho raha hai, toh base URL '/api' include hai
        // URL banega: http://localhost:8080/api/progress
        const response = await api.post('/progress', {
            currentPhase: data.currentPhase,
            percentage: data.percentage,
            startupId: data.startupId
        });

        console.log("Progress saved successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error("Creation failed:", error.response?.data || error.message);
        throw error; // Component mein error dikhane ke liye throw zaroori hai
    }
};

/**
 * Startup ID ke zariye progress fetch karne ke liye
 * @param {Long} startupId
 */
export const getProgressByStartupId = async (startupId) => {
    try {
        // URL banega: http://localhost:8080/api/progress/startup/{startupId}
        const response = await api.get(`/progress/startup/${startupId}`);
        return response.data;
    } catch (error) {
        console.error("Fetching progress failed:", error.response?.data || error.message);
        throw error;
    }
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