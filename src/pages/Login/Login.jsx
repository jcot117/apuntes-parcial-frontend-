import {
    Box,
    Button,
    Container,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useContext, useRef } from 'react';
import { login } from './services/login.service';
import { useNavigate } from 'react-router';
import AuthContext from '../../context/AuthContext';

function SignIn() {
    const ref = useRef();
    const nav = useNavigate();
    const { login: setAuthToken } = useContext(AuthContext);


    const onSubmit = async (e) => {
        e.preventDefault(); // Evitar que el formulario se envíe y recargue la página
        const formData = new FormData(ref.current);
        console.log(ref.current);
        const data = Object.fromEntries(formData);
        console.log(data);
        try {
            const response = await login(data.username, data.password);
            setAuthToken(response.accessToken);
            nav('/feed');
        } catch (error) {
            console.error('Error en login:', error);
            alert('Credenciales inválidas');
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2 }}>
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ p: { xs: 3, md: 4 } }}>
                    <Stack spacing={3} component="form" ref={ref}>
                        <Box>
                            <Typography variant="h4" component="h1" fontWeight={700}>
                                Login
                            </Typography>
                        </Box>

                        <TextField
                            label="Username"
                            name="username"
                            fullWidth
                        />

                        <TextField
                            label="Password"
                            name="password"
                            type="password"
                            fullWidth
                        />

                        <Button type="submit" variant="contained" onClick={onSubmit}>
                            Entrar
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}

export default SignIn;
