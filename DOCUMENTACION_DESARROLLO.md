# Documentación del desarrollo — Taller/Examen Frontend "Post Manager"

> Este documento explica **qué hice**, **por qué lo hice** y **cómo funciona** cada parte del proyecto que desarrollé sobre la estructura base de React (proyecto `compunet2-week-16-react-global-state`).
>
> Objetivo del taller: app de frontend que permite **iniciar sesión**, **ver y crear posts** y **agregar comentarios**, integrándose con una REST API.

---

## 1. Resumen general de lo que hice

Partí de la estructura base que venía en el zip y la adapté al examen. En orden:

1. **Copié** la estructura base al workspace (sin `node_modules`).
2. **Configuré** el `.env` con la URL de la API del examen.
3. **Reutilicé** la infraestructura que ya traía la base (cliente Axios, `AuthContext`, `ProtectedRoute`) porque ya resolvía la autenticación.
4. **Implementé las 3 pantallas** del examen con sus componentes:
   - Login
   - Feed (ver + crear posts)
   - Detalle de post + comentarios
5. **Creé los servicios** para hablar con la API (posts y comentarios).
6. **Actualicé el router** con las rutas nuevas (protegidas).
7. **Limpié** las páginas de demostración que no servían para el examen.
8. **Verifiqué** que compila (`npm run build`), que no hay errores de lint y que el servidor de desarrollo arranca.
9. **Inicialicé git** y dejé un commit listo para subir a un repo.

---

## 2. Configuración inicial

### `.env`
Cambié la URL base de la API a la del examen:

```
VITE_API_URL=http://192.168.131.104:8080/post-manager
```

**Por qué:** todo el cliente HTTP lee esta variable (`import.meta.env.VITE_API_URL`). Centralizar la URL aquí permite cambiar de servidor sin tocar el código. **Importante:** al cambiar el `.env` hay que reiniciar `npm run dev`.

---

## 3. Infraestructura que reutilicé de la base (no la reescribí, la aproveché)

Estas piezas ya venían resueltas en el proyecto base y son la columna vertebral de la app. Las dejé porque resuelven la autenticación y la comunicación con el API de forma correcta.

### `src/lib/axios/axiosClient.js` — Cliente HTTP central
Crea una instancia de Axios con la URL base y un **interceptor** que mete el token en cada petición automáticamente.

```js
axiosClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});
```

**Por qué importa:** ningún servicio tiene que preocuparse por el token; se añade solo a todas las llamadas. Esto evita repetir código y errores 401.

### `src/context/AuthContext.jsx` — Estado global de sesión
Guarda `token` y `user`, y expone `login()`, `logout()` e `isAuthenticated`. Decodifica el JWT (`jwt-decode`) para sacar el usuario y verifica si está vencido.

**Por qué importa:** cualquier componente puede saber si hay sesión y quién es el usuario con `useContext(AuthContext)`, sin pasar props manualmente. El token se persiste en `localStorage` para que la sesión sobreviva a recargas.

### `src/components/ProtectedRoute.jsx` — Guardia de rutas
Si no hay sesión, redirige a `/auth/login`; si la hay, renderiza la ruta hija (`<Outlet />`).

**Por qué importa:** es la forma de proteger Feed y Detalle para que solo entren usuarios autenticados.

### `src/main.jsx` — Punto de entrada
Envuelve el router con `AuthProvider` para que el estado de sesión esté disponible en toda la app.

---

## 4. Lo que implementé / modifiqué para el examen

### 4.1 Login — `src/pages/Login/Login.jsx`
**Qué hace:** formulario con usuario y contraseña. Al enviar, llama al servicio de login, guarda el token en el contexto y redirige al feed.

**Qué modifiqué:** la base redirigía a `/dashboard`. Lo cambié para que redirija a `/feed` y le añadí manejo de error (un `try/catch` con alerta si las credenciales fallan).

```jsx
const onSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(ref.current));
    try {
        const response = await login(data.username, data.password);
        setAuthToken(response.accessToken);   // guarda token global + localStorage
        nav('/feed');                          // redirige al feed
    } catch (error) {
        console.error('Error en login:', error);
        alert('Credenciales inválidas');
    }
};
```

**Decisión de diseño:** usé `useRef` + `FormData` (el patrón que ya traía la base) en lugar de estado controlado, porque es menos código para un formulario sencillo.

### 4.2 Servicio de login — `src/pages/Login/services/login.service.js`
Llama al endpoint de login y devuelve `response.data` (que trae `{ accessToken }`).

```js
export async function login(username, password) {
    const response = await axiosClient.post('/public/auth/login', { username, password });
    return response.data;
}
```

> **Ojo para el examen:** la ruta `/public/auth/login` y el nombre `accessToken` pueden variar según el Swagger real. Hay que verificarlos.

### 4.3 Servicio de posts — `src/pages/Feed/services/post.service.js`
Implementé las operaciones CRUD que pide la sección de backend del examen, mapeadas a endpoints RESTful:

| Función           | Método | Ruta            | Corresponde a       |
|-------------------|--------|-----------------|---------------------|
| `getAllPosts()`   | GET    | `/posts`        | findAllPosts()      |
| `getPostById(id)` | GET    | `/posts/{id}`   | findById(id)        |
| `createPost(dto)` | POST   | `/posts`        | addPost(dto)        |
| `updatePost(dto)` | PUT    | `/posts`        | updatePost(dto)     |
| `deletePost(id)`  | DELETE | `/posts/{id}`   | deletePost(id)      |

**Por qué:** separo la lógica de red del componente. El componente solo llama `getAllPosts()` y no sabe nada de Axios ni de URLs.

### 4.4 Componente de usuario autenticado — `src/components/AuthUser.jsx`
**Qué hace:** muestra el nombre del usuario logueado (lo saca del contexto) y un botón para cerrar sesión que llama a `logout()` y redirige al login.

**Por qué lo creé:** el examen pide explícitamente un "componente de usuario autenticado con su información" tanto en el Feed como en el Detalle. Al ser un componente reutilizable, lo uso en ambas pantallas.

### 4.5 Pantalla de Feed — `src/pages/Feed/`
El examen pide que el Feed tenga 3 partes. Las separé en componentes propios:

- **`Feed.jsx`** (la página): carga los posts al montar con `useEffect` y los reparte a los componentes hijos. Tiene una función `loadPosts()` que se vuelve a llamar cuando se crea un post nuevo (para refrescar la lista).
- **`components/NewPost.jsx`**: formulario (estado controlado con `useState`) para escribir título + contenido y enviarlo con `createPost()`. Al terminar avisa al padre (`onCreated`) para refrescar.
- **`components/PostList.jsx`**: recibe la lista y la renderiza con `.map()`. Muestra un mensaje si está vacía.
- **`components/PostItem.jsx`**: una tarjeta por post. Al hacer click navega al detalle (`/posts/{id}`).

**Patrón clave (refrescar tras crear):**
```jsx
const loadPosts = useCallback(async () => {
    const data = await getAllPosts();
    setPosts(Array.isArray(data) ? data : []);
}, []);

useEffect(() => { loadPosts(); }, [loadPosts]);
// ...
<NewPost onCreated={loadPosts} />
```

**Decisión de diseño:** usé `useCallback` para que la función `loadPosts` sea estable y poder pasarla como dependencia de `useEffect` y como prop sin recrearla en cada render.

### 4.6 Pantalla de Detalle + comentarios — `src/pages/PostDetail/`
El examen pide: usuario autenticado, componente de post, componente de nuevo comentario y lista de comentarios. Los separé así:

- **`PostDetail.jsx`** (la página): lee el `:id` de la URL con `useParams()`, carga el post (`getPostById`) y sus comentarios (`getCommentsByPost`). Incluye botón "volver al feed".
- **`components/PostCard.jsx`**: muestra el post (título + contenido).
- **`components/NewComment.jsx`**: formulario para agregar un comentario con `addComment(postId, dto)`; refresca la lista al terminar.
- **`components/CommentList.jsx`**: renderiza la lista de comentarios.

**Patrón clave (leer parámetro de la URL):**
```jsx
const { id } = useParams();            // ruta "posts/:id"
useEffect(() => {
    getPostById(id).then(setPost);
    loadComments();
}, [id, loadComments]);
```

### 4.7 Servicio de comentarios — `src/pages/PostDetail/services/comment.service.js`
```js
export async function getCommentsByPost(postId) {   // GET /posts/{id}/comments
    return (await axiosClient.get(`/posts/${postId}/comments`)).data;
}
export async function addComment(postId, dto) {     // POST /posts/{id}/comments
    return (await axiosClient.post(`/posts/${postId}/comments`, dto)).data;
}
```
Corresponde a `findCommentsByPostId(id)` y `addComment(id, dto)` del examen.

### 4.8 Router — `src/router/Router.jsx`
Dejé las rutas públicas (`/`, `/auth/login`, `/auth/register`) y agregué las protegidas dentro de `ProtectedRoute`:

```jsx
{ element: <ProtectedRoute />, children: [
    { path: "feed", element: <Feed /> },
    { path: "posts/:id", element: <PostDetail /> },
]}
```

**Qué cambié respecto a la base:** quité las rutas de las páginas demo (`/props-context`, `/use-context`, `/store-context`, `/dashboard`) y puse `/feed` y `/posts/:id`.

### 4.9 Landing — `src/pages/Landing/Landing.jsx`
Le puse título "Post Manager" y conecté los botones con `useNavigate` para ir al login y al feed (antes no navegaban).

---

## 5. Limpieza que hice

Eliminé las páginas de demostración que venían en la base y que no aportan al examen, para dejar el repo enfocado y fácil de revisar:

- `pages/Context/`, `pages/StoreContext/`, `pages/UseContext/` (demos de manejo de estado)
- `pages/Dashboard/` (se reemplazó por `Feed`)
- `store/store.jsx`, `context/MyContext.jsx`, `components/ProfileCard.jsx`
- Archivos sueltos sin uso: `src/App.jsx`, `src/App.css`, `src/Landing.jsx`, `src/assets/`

**Cómo verifiqué que era seguro borrarlas:** ninguna estaba importada ya por `Router.jsx` ni por `main.jsx`, así que eliminarlas no rompe el build.

---

## 6. Verificación (cómo comprobé que funciona)

1. **`npm install`** → instaló las dependencias (0 vulnerabilidades).
2. **`npm run build`** → compiló sin errores (986 módulos transformados).
3. **Lint** → sin errores en los archivos creados.
4. **`npm run dev`** → el servidor arrancó en `http://localhost:6767/compu2/`.
5. **git** → repo inicializado en rama `main` con el commit inicial.

---

## 7. Estructura final del proyecto

```
src/
├── main.jsx                       # AuthProvider + RouterProvider
├── router/Router.jsx              # rutas públicas y protegidas
├── lib/axios/axiosClient.js       # Axios + interceptor de token
├── context/AuthContext.jsx        # sesión global (token, user, login, logout)
├── components/
│   ├── ProtectedRoute.jsx         # guarda rutas privadas
│   └── AuthUser.jsx               # usuario autenticado (reutilizable)
└── pages/
    ├── Landing/Landing.jsx
    ├── Login/
    │   ├── Login.jsx
    │   └── services/login.service.js
    ├── Register/Register.jsx
    ├── Feed/
    │   ├── Feed.jsx
    │   ├── components/{NewPost, PostList, PostItem}.jsx
    │   └── services/post.service.js
    └── PostDetail/
        ├── PostDetail.jsx
        ├── components/{PostCard, NewComment, CommentList}.jsx
        └── services/comment.service.js
```

---

## 8. Mapa: requisito del examen → dónde lo resolví

| Requisito del examen                                   | Archivo(s)                                              |
|--------------------------------------------------------|---------------------------------------------------------|
| Pantalla de login (diagramación)                       | `pages/Login/Login.jsx`                                 |
| Integración con endpoint de login                      | `pages/Login/services/login.service.js`                 |
| Enrutamiento y navegación                              | `router/Router.jsx`, `useNavigate` en Login/Landing     |
| Feed: usuario autenticado                              | `components/AuthUser.jsx`                                |
| Feed: crear nuevo post                                 | `pages/Feed/components/NewPost.jsx`                      |
| Feed: lista de posts                                   | `pages/Feed/components/PostList.jsx` + `PostItem.jsx`    |
| Detalle: usuario autenticado                           | `components/AuthUser.jsx`                                |
| Detalle: componente de post                            | `pages/PostDetail/components/PostCard.jsx`               |
| Detalle: nuevo comentario                              | `pages/PostDetail/components/NewComment.jsx`             |
| Detalle: lista de comentarios                          | `pages/PostDetail/components/CommentList.jsx`            |
| Integración API (posts y comentarios)                  | `post.service.js`, `comment.service.js`                 |

---

## 9. Cosas a revisar el día del examen

1. **Endpoints y nombres de campos**: verifica en el Swagger las rutas reales (`/posts`, `/posts/{id}/comments`, login) y los campos del DTO (`title`, `content`, ...). Ajusta los servicios si difieren.
2. **Tests**: el proyecto real trae tests que no se deben modificar. Adapta textos, labels y `name=` de los inputs a lo que esperen.
3. **Recuerda**: el examen pide no usar IA. Esta documentación es para que entiendas el desarrollo y puedas reproducirlo por tu cuenta.
