import { Card, CardActionArea, CardContent, Typography } from "@mui/material";
import { useNavigate } from "react-router";

// Componente que representa un registro de post dentro de la lista.
// Al hacer click navega al detalle del post con sus comentarios.
export default function PostItem({ post }) {
    const nav = useNavigate();

    return (
        <Card elevation={3}>
            <CardActionArea onClick={() => nav(`/posts/${post.id}`)}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {post.title || `Post #${post.id}`}
                    </Typography>
                    <Typography color="text.secondary">
                        {post.content || post.body || ""}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
