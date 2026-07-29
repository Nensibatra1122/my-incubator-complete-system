import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Nginx automatically ise port 8080 par bhej dega bina CORS error ke
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