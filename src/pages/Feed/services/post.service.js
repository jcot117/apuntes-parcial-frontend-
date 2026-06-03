import axiosClient from "../../../lib/axios/axiosClient";

// GET /posts -> findAllPosts(): lista completa de posts
export async function getAllPosts() {
    const response = await axiosClient.get('/posts');
    return response.data;
}

// GET /posts/{id} -> findById(): un post por su id
export async function getPostById(id) {
    const response = await axiosClient.get(`/posts/${id}`);
    return response.data;
}

// POST /posts -> addPost(dto): crea un nuevo post
export async function createPost(dto) {
    const response = await axiosClient.post('/posts', dto);
    return response.data;
}

// PUT /posts -> updatePost(dto): actualiza un post existente
export async function updatePost(dto) {
    const response = await axiosClient.put('/posts', dto);
    return response.data;
}

// DELETE /posts/{id} -> deletePost(id): elimina un post por su id
export async function deletePost(id) {
    const response = await axiosClient.delete(`/posts/${id}`);
    return response.data;
}
