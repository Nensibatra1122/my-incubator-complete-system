import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Sabhi possible token keys ko check karein taake mismatch na ho
    const token = localStorage.getItem('token') ||
        localStorage.getItem('jwtToken') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('jwt');

    // Agar token nahi hai, toh Login page par bhej do
    if (!token) {
        return <Navigate to="/" replace />;
    }

    // Agar token mil gaya, toh Dashboard render hone do
    return children;
};

export default ProtectedRoute;