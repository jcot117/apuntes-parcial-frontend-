import { useContext } from "react";
import { Avatar, Box, Button, Paper, Stack, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router";
import AuthContext from "../context/AuthContext";

// Componente de usuario autenticado: muestra la info del usuario y permite cerrar sesión.
export default function AuthUser() {
    const { user, logout } = useContext(AuthContext);
    const nav = useNavigate();

    const displayName = user?.username || user?.sub || user?.email || "Usuario";

    const onLogout = () => {
        logout();
        nav("/auth/login");
    };

    return (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar>{displayName.charAt(0).toUpperCase()}</Avatar>
                    <Box>
                        <Typography fontWeight={700}>{displayName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sesión activa
                        </Typography>
                    </Box>
                </Stack>
                <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={onLogout}>
                    Salir
                </Button>
            </Stack>
        </Paper>
    );
}
