import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Box, Button, Container, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AuthUser from "../../components/AuthUser";
import PostCard from "./components/PostCard";
import NewComment from "./components/NewComment";
import CommentList from "./components/CommentList";
import { getPostById } from "../Feed/services/post.service";
import { getCommentsByPost } from "./services/comment.service";

// Pantalla de detalle: muestra un post específico con sus comentarios.
export default function PostDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);

    const loadComments = useCallback(async () => {
        try {
            const data = await getCommentsByPost(id);
            setComments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando comentarios:", error);
        }
    }, [id]);

    useEffect(() => {
        getPostById(id).then(setPost).catch((e) => console.error("Error cargando post:", e));
        loadComments();
    }, [id, loadComments]);

    return (
        <Box sx={{ minHeight: "100vh", py: 4, bgcolor: "grey.100" }}>
            <Container maxWidth="sm">
                <AuthUser />
                <Button startIcon={<ArrowBackIcon />} onClick={() => nav("/feed")} sx={{ mb: 2 }}>
                    Volver al feed
                </Button>

                <PostCard post={post} />

                <Typography variant="h6" gutterBottom>
                    Comentarios
                </Typography>
                <NewComment postId={id} onCreated={loadComments} />
                <CommentList comments={comments} />
            </Container>
        </Box>
    );
}
