import axios from 'axios';

const api = axios.create({
    baseURL: 'http://98.94.6.13:8080/api', // Live AWS backend URL
});

// Interceptor: JWT token ko automatically har request mein daalne ke liye
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Key ko 'token' par set kar diya gaya hai
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;