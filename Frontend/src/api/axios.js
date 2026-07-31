import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api', // Yahan aakhir mein '/api' lazmi add karein
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