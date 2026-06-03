import { useCallback, useEffect, useState } from "react";
import { Box, Container, Typography } from "@mui/material";
import AuthUser from "../../components/AuthUser";
import NewPost from "./components/NewPost";
import PostList from "./components/PostList";
import { getAllPosts } from "./services/post.service";

// Pantalla de Feed: el usuario ve y crea posts.
export default function Feed() {
    const [posts, setPosts] = useState([]);

    const loadPosts = useCallback(async () => {
        try {
            const data = await getAllPosts();
            setPosts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando posts:", error);
        }
    }, []);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    return (
        <Box sx={{ minHeight: "100vh", py: 4, bgcolor: "grey.100" }}>
            <Container maxWidth="sm">
                <AuthUser />
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Feed
                </Typography>
                <NewPost onCreated={loadPosts} />
                <PostList posts={posts} />
            </Container>
        </Box>
    );
}
