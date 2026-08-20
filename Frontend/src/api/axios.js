import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request Interceptor: Automatically attach the JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem('token') ||
            localStorage.getItem('jwtToken') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('authToken') ||
            localStorage.getItem('access_token') ||
            localStorage.getItem('user');

        if (token) {
            let cleanToken = token;
            try {
                const parsed = JSON.parse(token);
                if (parsed.token || parsed.accessToken || parsed.jwt) {
                    cleanToken = parsed.token || parsed.accessToken || parsed.jwt;
                }
            } catch (e) {}

            config.headers.Authorization = `Bearer ${cleanToken}`;
        }

        if (!config.headers['Content-Type'] && config.data && !(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 403) {
            console.error("403 Forbidden Error: The token has expired or there is no permission for this route.");
        }
        return Promise.reject(error);
    }
);

export default api;