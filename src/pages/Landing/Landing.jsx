import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router';

function Landing() {
    const nav = useNavigate();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'grid',
                placeItems: 'center',
                px: 2,
            }}
        >
            <Container maxWidth="md">
                <Box sx={{ p: { xs: 4, md: 6 }, bgcolor: 'white' }}>
                    <Stack spacing={3}>
                        <Typography variant="h3" component="h1" fontWeight={700}>
                            Post Manager
                        </Typography>
                        <Typography color="text.secondary">
                            Inicia sesión para ver el feed y comentar publicaciones.
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button variant="contained" onClick={() => nav('/auth/login')}>
                                Ir al login
                            </Button>
                            <Button variant="outlined" onClick={() => nav('/feed')}>
                                Ver Feed
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
}

export default Landing;
