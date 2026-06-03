import { useState } from "react";
import { Button, Paper, Stack, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { createPost } from "../services/post.service";

// Componente para crear un nuevo post y enviarlo al servidor.
// onCreated: callback para avisar al padre que refresque la lista.
export default function NewPost({ onCreated }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        setLoading(true);
        try {
            await createPost({ title, content });
            setTitle("");
            setContent("");
            onCreated?.();
        } catch (error) {
            console.error("Error creando post:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Stack component="form" spacing={2} onSubmit={onSubmit}>
                <Typography variant="h6">Crear nuevo post</Typography>
                <TextField
                    label="Título"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                />
                <TextField
                    label="¿Qué quieres publicar?"
                    name="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                />
                <Button
                    type="submit"
                    variant="contained"
                    endIcon={<SendIcon />}
                    disabled={loading}
                >
                    Publicar
                </Button>
            </Stack>
        </Paper>
    );
}
