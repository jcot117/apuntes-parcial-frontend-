import { useState } from "react";
import { Button, Paper, Stack, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { addComment } from "../services/comment.service";

// Componente de nuevo comentario: permite escribir un comentario para el post.
export default function NewComment({ postId, onCreated }) {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        setLoading(true);
        try {
            await addComment(postId, { content });
            setContent("");
            onCreated?.();
        } catch (error) {
            console.error("Error agregando comentario:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Stack component="form" spacing={2} onSubmit={onSubmit}>
                <Typography variant="h6">Nuevo comentario</Typography>
                <TextField
                    label="Escribe un comentario"
                    name="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    multiline
                    minRows={2}
                    fullWidth
                />
                <Button type="submit" variant="contained" endIcon={<SendIcon />} disabled={loading}>
                    Comentar
                </Button>
            </Stack>
        </Paper>
    );
}
