import { createContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

function decodeToken(token) {
    try {
        const decoded = jwtDecode(token);

        if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => {
        const storedToken = localStorage.getItem('token');

        if (!storedToken) {
            return null;
        }

        const decodedUser = decodeToken(storedToken);

        if (!decodedUser) {
            localStorage.removeItem('token');
            return null;
        }

        return storedToken;
    });

    const [user, setUser] = useState(() => {
        const storedToken = localStorage.getItem('token');
        return storedToken ? decodeToken(storedToken) : null;
    });

    const value = {
        token,
        user,
        isAuthenticated: Boolean(token && user),
        login: (newToken) => {
            setToken(newToken);
            const decodedUser = decodeToken(newToken);
            setUser(decodedUser);
            localStorage.setItem('token', newToken);
        },
        logout: () => {
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;