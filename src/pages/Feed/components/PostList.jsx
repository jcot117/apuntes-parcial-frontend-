import { Stack, Typography } from "@mui/material";
import PostItem from "./PostItem";

// Componente de lista de posts publicados.
export default function PostList({ posts }) {
    if (!posts.length) {
        return (
            <Typography color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
                Aún no hay posts. ¡Sé el primero en publicar!
            </Typography>
        );
    }

    return (
        <Stack spacing={2}>
            {posts.map((post) => (
                <PostItem key={post.id} post={post} />
            ))}
        </Stack>
    );
}
