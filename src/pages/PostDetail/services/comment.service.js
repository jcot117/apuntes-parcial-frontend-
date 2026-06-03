import axiosClient from "../../../lib/axios/axiosClient";

// GET /posts/{id}/comments -> findCommentsByPostId(id): comentarios de un post
export async function getCommentsByPost(postId) {
    const response = await axiosClient.get(`/posts/${postId}/comments`);
    return response.data;
}

// POST /posts/{id}/comments -> addComment(id, dto): agrega un comentario al post
export async function addComment(postId, dto) {
    const response = await axiosClient.post(`/posts/${postId}/comments`, dto);
    return response.data;
}
