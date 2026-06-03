import { Card, CardContent, Stack, Typography } from "@mui/material";

// Componente de lista de comentarios del post.
export default function CommentList({ comments }) {
    if (!comments.length) {
        return (
            <Typography color="text.secondary">
                Todavía no hay comentarios.
            </Typography>
        );
    }

    return (
        <Stack spacing={2}>
            {comments.map((comment) => (
                <Card key={comment.id} variant="outlined">
                    <CardContent>
                        <Typography>{comment.content || comment.body || ""}</Typography>
                    </CardContent>
                </Card>
            ))}
        </Stack>
    );
}
