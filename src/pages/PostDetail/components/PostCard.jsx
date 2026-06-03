import { Card, CardContent, Typography } from "@mui/material";

// Componente de post: representa el registro del post en la pantalla de detalle.
export default function PostCard({ post }) {
    if (!post) return null;

    return (
        <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    {post.title || `Post #${post.id}`}
                </Typography>
                <Typography color="text.secondary">
                    {post.content || post.body || ""}
                </Typography>
            </CardContent>
        </Card>
    );
}
