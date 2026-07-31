import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Interceptor: JWT token ko automatically har request mein daalne ke liye
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
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