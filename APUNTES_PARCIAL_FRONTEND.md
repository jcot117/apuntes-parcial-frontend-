# Apuntes Parcial Frontend (React) — Computación en Internet II

> Basado en el proyecto base `compunet2-week-16-react-global-state`.
> Estos apuntes te sirven para **cualquier** ejercicio que te pongan (Login + Feed + Comentarios, o lo que sea). La idea es que entiendas el **patrón** y solo cambies los nombres.

---

## 0. Lo primero que debes hacer SIEMPRE al recibir el proyecto

```bash
npm install          # instala dependencias
npm run dev          # levanta el front (Vite) -> http://localhost:5173
npm test             # si hay tests, córrelos para ver qué piden
```

Revisa el archivo `.env` y ajústalo a la API del examen:

```
VITE_API_URL=http://192.168.131.104:8080/post-manager
```

> Se accede en código con `import.meta.env.VITE_API_URL`.
> **Si cambias el `.env` debes reiniciar `npm run dev`.**

Abre el **Swagger** (`.../swagger-ui/index.html`) y anota:
- La ruta del **login** y qué devuelve (normalmente `{ accessToken: "..." }`).
- Las rutas de los recursos (posts, comments...) y la **forma del JSON** (campos: `id`, `title`, `content`, etc.).

---

## 1. Estructura del proyecto (mapa mental)

```
src/
├── main.jsx                      # punto de entrada: monta Providers + Router
├── router/Router.jsx             # define TODAS las rutas (createBrowserRouter)
├── lib/axios/axiosClient.js      # cliente HTTP central (baseURL + token automático)
├── context/AuthContext.jsx       # estado GLOBAL de autenticación (token, user, login, logout)
├── components/
│   ├── ProtectedRoute.jsx        # "guardia": bloquea rutas si no hay sesión
│   └── ProfileCard.jsx           # componente reutilizable de ejemplo
├── store/store.jsx               # estado global con TanStack Store (alternativa a Context)
└── pages/
    └── <Pantalla>/
        ├── <Pantalla>.jsx        # la página
        ├── components/           # piezas de esa página
        └── services/             # llamadas HTTP de esa página (xxx.service.js)
```

**Regla de oro de organización:**
> Cada pantalla = una carpeta en `pages/`. Dentro: el `.jsx` de la página, su carpeta `components/` (las piezas) y su carpeta `services/` (las llamadas al API). **Nunca** llames a `axios` directo desde un componente: siempre pasa por un `service`.

### Flujo de datos (cómo viaja la info)
```
Componente  →  llama función del  service  →  usa  axiosClient  →  API REST
   ↑                                                                  │
   └──────────── setState / Context / Store ←── response.data ────────┘
```

---

## 2. Las piezas clave explicadas (con el código del ejemplo)

### 2.1 Cliente Axios — `lib/axios/axiosClient.js`
Centraliza la URL base y **mete el token en cada petición automáticamente** (interceptor). Esto lo escribes UNA vez y no lo vuelves a tocar.

```js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const axiosClient = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor: antes de CADA request, si hay token lo añade como Bearer
axiosClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;
```

### 2.2 Service — `pages/<X>/services/<x>.service.js`
Una función por endpoint. Solo hace la llamada y devuelve `response.data`.

```js
import axiosClient from "../../../lib/axios/axiosClient";

export async function getAllGames() {
    const response = await axiosClient.get('/games');
    return response.data;
}
```

> **Patrón CRUD genérico** (te sirve para cualquier recurso):
```js
get('/posts')            // GET    listar todos        -> findAll
get(`/posts/${id}`)      // GET    uno por id          -> findById
post('/posts', dto)      // POST   crear               -> add
put('/posts', dto)       // PUT    actualizar          -> update
delete(`/posts/${id}`)   // DELETE borrar              -> delete
```

### 2.3 Estado global de sesión — `context/AuthContext.jsx`
Guarda `token` y `user`, expone `login()`, `logout()`, `isAuthenticated`. Decodifica el JWT para sacar el usuario y revisa si está vencido.

```jsx
import { createContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

function decodeToken(token) {
    try {
        const decoded = jwtDecode(token);
        if (decoded?.exp && decoded.exp * 1000 < Date.now()) return null; // vencido
        return decoded;
    } catch { return null; }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [user, setUser]  = useState(() => {
        const t = localStorage.getItem('token');
        return t ? decodeToken(t) : null;
    });

    const value = {
        token,
        user,
        isAuthenticated: Boolean(token && user),
        login: (newToken) => {
            setToken(newToken);
            setUser(decodeToken(newToken));
            localStorage.setItem('token', newToken);
        },
        logout: () => {
            setToken(null); setUser(null);
            localStorage.removeItem('token');
        },
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
```

**Cómo se consume en cualquier componente:**
```jsx
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';

const { user, isAuthenticated, login, logout } = useContext(AuthContext);
```

### 2.4 Ruta protegida — `components/ProtectedRoute.jsx`
Si no hay sesión, redirige al login. Si hay, deja pasar (`<Outlet />` = los hijos de la ruta).

```jsx
import { Navigate, Outlet } from 'react-router';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export default function ProtectedRoute() {
    const { isAuthenticated } = useContext(AuthContext);
    if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
    return <Outlet />;
}
```

### 2.5 Rutas — `router/Router.jsx`
Aquí declaras todas las pantallas. Las que requieren sesión van **dentro** del `ProtectedRoute`.

```jsx
const router = createBrowserRouter([
    { path: "/", element: <Landing /> },
    { path: "/auth", children: [
        { index: true, element: <Login /> },
        { path: "login", element: <Login /> },
        { path: "register", element: <Register /> },
    ]},
    { element: <ProtectedRoute />, children: [          // <- protegidas
        { path: "dashboard", element: <Dashboard /> },
        { path: "posts/:id", element: <PostDetail /> }, // ruta con parámetro
    ]},
], { basename: "/compu2" });
```
> Ojo con el `basename`: la app vive en `/compu2`, así que navega con rutas relativas (`/dashboard`, `/auth/login`) usando `useNavigate`.

### 2.6 Providers — `main.jsx`
Todo lo global (Auth) envuelve al Router.

```jsx
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </StrictMode>
);
```

---

## 3. RECETA UNIVERSAL: "me piden una pantalla nueva"

Para **cualquier** pantalla que te pidan, sigue estos pasos en orden:

1. **Crear carpeta** `src/pages/MiPantalla/` con `MiPantalla.jsx`.
2. **Registrar la ruta** en `router/Router.jsx` (¿protegida o pública?).
3. **Crear el service** `services/miRecurso.service.js` con las funciones HTTP que necesites.
4. **En la página**:
   - Leer datos al montar: `useState` + `useEffect` que llama al service.
   - Renderizar la lista con `.map()` (¡siempre con `key`!).
5. **Si hay formulario** (crear/editar): captura los datos y al `submit` llama al service y refresca la lista.
6. **Si necesitas el usuario logueado**: `useContext(AuthContext)`.
7. **Navegar** entre pantallas: `useNavigate()` o `<Link>`.

### Plantilla: leer y listar datos
```jsx
import { useEffect, useState } from "react";
import { getAllPosts } from "./services/post.service";

export default function Feed() {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        getAllPosts().then(setPosts).catch(console.error);
    }, []);                               // [] = solo al montar

    return (
        <div>
            {posts.map(post => (
                <div key={post.id}>{post.title}</div>
            ))}
        </div>
    );
}
```

### Plantilla: formulario (2 formas)

**Forma A — `useRef` + `FormData`** (la que usa el proyecto en Login):
```jsx
const ref = useRef();

const onSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(ref.current)); // {username, password}
    await login(data.username, data.password);
};
// <form ref={ref}> ... <input name="username" /> ...
```

**Forma B — estado controlado** (más común para crear posts/comentarios):
```jsx
const [content, setContent] = useState("");

const onSubmit = async (e) => {
    e.preventDefault();
    await createPost({ content });
    setContent("");            // limpiar
    await refrescarLista();    // volver a cargar
};
// <input value={content} onChange={e => setContent(e.target.value)} />
```

### Plantilla: leer parámetro de la URL (ej. detalle de un post)
```jsx
import { useParams } from "react-router";
const { id } = useParams();           // ruta "posts/:id"
useEffect(() => { getPostById(id).then(setPost); }, [id]);
```

---

## 4. Hooks que SIEMPRE aparecen (resumen rápido)

| Hook | Para qué | Recordar |
|------|----------|----------|
| `useState` | guardar datos que cambian y re-renderizan | `const [x, setX] = useState(inicial)` |
| `useEffect` | ejecutar algo al montar / cuando cambia algo | `useEffect(fn, [deps])`; `[]` = solo al inicio |
| `useContext` | leer estado global (Auth) | `useContext(AuthContext)` |
| `useNavigate` | navegar por código | `const nav = useNavigate(); nav('/dashboard')` |
| `useParams` | leer `:id` de la URL | `const { id } = useParams()` |
| `useRef` | referencia a un elemento del DOM / form | `const ref = useRef()` |

---

## 5. EXAMEN RESUELTO (úsalo como ejemplo guía)

El examen pide: **Login → Feed (ver/crear posts) → Detalle (post + comentarios)**.
Aquí está cada pieza resuelta con el patrón de arriba.

### 5.1 Login — `pages/Login/Login.jsx`
```jsx
import { Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { useContext, useRef } from 'react';
import { login } from './services/login.service';
import { useNavigate } from 'react-router';
import AuthContext from '../../context/AuthContext';

export default function Login() {
    const ref = useRef();
    const nav = useNavigate();
    const { login: setAuthToken } = useContext(AuthContext);

    const onSubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(ref.current));
        const response = await login(data.username, data.password);
        setAuthToken(response.accessToken);   // guarda token global + localStorage
        nav('/dashboard');                     // redirige al feed
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Stack spacing={3} component="form" ref={ref}>
                        <Typography variant="h4">Login</Typography>
                        <TextField label="Username" name="username" fullWidth />
                        <TextField label="Password" name="password" type="password" fullWidth />
                        <Button type="submit" variant="contained" onClick={onSubmit}>Entrar</Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
```
`pages/Login/services/login.service.js`:
```js
import axiosClient from "../../../lib/axios/axiosClient";

export async function login(username, password) {
    const response = await axiosClient.post('/public/auth/login', { username, password });
    return response.data;   // { accessToken: "..." }
}
```
> Ajusta `/public/auth/login` a lo que diga el **Swagger** del examen.

### 5.2 Service de posts — `pages/Feed/services/post.service.js`
```js
import axiosClient from "../../../lib/axios/axiosClient";

export async function getAllPosts() {
    const res = await axiosClient.get('/posts');
    return res.data;
}
export async function getPostById(id) {
    const res = await axiosClient.get(`/posts/${id}`);
    return res.data;
}
export async function createPost(dto) {
    const res = await axiosClient.post('/posts', dto);
    return res.data;
}
```

### 5.3 Componente usuario autenticado — `components/AuthUser.jsx`
```jsx
import { useContext } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import AuthContext from "../context/AuthContext";

export default function AuthUser() {
    const { user, logout } = useContext(AuthContext);
    const nav = useNavigate();
    return (
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", p: 2 }}>
            <Typography>Hola, {user?.username || user?.sub || "usuario"}</Typography>
            <Button onClick={() => { logout(); nav('/auth/login'); }}>Salir</Button>
        </Box>
    );
}
```

### 5.4 Feed — `pages/Feed/Feed.jsx` (ver + crear posts)
```jsx
import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { getAllPosts, createPost } from "./services/post.service";
import AuthUser from "../../components/AuthUser";

export default function Feed() {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState("");
    const nav = useNavigate();

    const cargar = () => getAllPosts().then(setPosts).catch(console.error);
    useEffect(() => { cargar(); }, []);

    const onCreate = async (e) => {
        e.preventDefault();
        await createPost({ content });   // ajusta los campos al DTO real
        setContent("");
        await cargar();                  // refresca la lista
    };

    return (
        <Box sx={{ maxWidth: 600, mx: "auto", p: 2 }}>
            <AuthUser />

            {/* Crear nuevo post */}
            <Stack component="form" spacing={2} onSubmit={onCreate} sx={{ mb: 4 }}>
                <TextField label="¿Qué estás pensando?" value={content}
                           onChange={e => setContent(e.target.value)} multiline />
                <Button type="submit" variant="contained">Publicar</Button>
            </Stack>

            {/* Lista de posts */}
            {posts.map(post => (
                <Card key={post.id} sx={{ mb: 2, cursor: "pointer" }}
                      onClick={() => nav(`/posts/${post.id}`)}>
                    <CardContent>
                        <Typography variant="h6">{post.title}</Typography>
                        <Typography>{post.content}</Typography>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
}
```

### 5.5 Service de comentarios — `pages/PostDetail/services/comment.service.js`
```js
import axiosClient from "../../../lib/axios/axiosClient";

export async function getCommentsByPost(postId) {
    const res = await axiosClient.get(`/posts/${postId}/comments`);
    return res.data;
}
export async function addComment(postId, dto) {
    const res = await axiosClient.post(`/posts/${postId}/comments`, dto);
    return res.data;
}
```

### 5.6 Detalle del post + comentarios — `pages/PostDetail/PostDetail.jsx`
```jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { getPostById } from "../Feed/services/post.service";
import { getCommentsByPost, addComment } from "./services/comment.service";
import AuthUser from "../../components/AuthUser";

export default function PostDetail() {
    const { id } = useParams();                 // ruta "posts/:id"
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [text, setText] = useState("");

    const cargarComentarios = () => getCommentsByPost(id).then(setComments);

    useEffect(() => {
        getPostById(id).then(setPost);
        cargarComentarios();
    }, [id]);

    const onAdd = async (e) => {
        e.preventDefault();
        await addComment(id, { content: text });
        setText("");
        await cargarComentarios();
    };

    return (
        <Box sx={{ maxWidth: 600, mx: "auto", p: 2 }}>
            <AuthUser />

            {/* Componente de post */}
            {post && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h5">{post.title}</Typography>
                        <Typography>{post.content}</Typography>
                    </CardContent>
                </Card>
            )}

            {/* Nuevo comentario */}
            <Stack component="form" spacing={2} onSubmit={onAdd} sx={{ mb: 3 }}>
                <TextField label="Escribe un comentario" value={text}
                           onChange={e => setText(e.target.value)} />
                <Button type="submit" variant="contained">Comentar</Button>
            </Stack>

            {/* Lista de comentarios */}
            {comments.map(c => (
                <Card key={c.id} sx={{ mb: 1 }}>
                    <CardContent><Typography>{c.content}</Typography></CardContent>
                </Card>
            ))}
        </Box>
    );
}
```

### 5.7 Registrar las rutas nuevas en `router/Router.jsx`
```jsx
{ element: <ProtectedRoute />, children: [
    { path: "dashboard", element: <Feed /> },      // o "feed"
    { path: "posts/:id", element: <PostDetail /> },
]},
```

---

## 6. Estado global con TanStack Store (tema de la semana 16)

Alternativa al Context para estado compartido. Útil si te piden "estado global" que no sea la sesión.

`store/store.jsx`:
```jsx
import { createStore } from "@tanstack/react-store";

export const store = createStore({ myState: 0 });

export const incrementByAmount = (amount) =>
    store.setState(s => ({ ...s, myState: s.myState + amount }));
```
Consumir en un componente (se re-renderiza solo cuando cambia lo que seleccionas):
```jsx
import { useSelector } from "@tanstack/react-store";
import { store, incrementByAmount } from "../store/store";

const myState = useSelector(store, s => s.myState);
// <Button onClick={() => incrementByAmount(10)}>+10</Button>
```

**Context vs Store (cuándo usar cuál):**
- **Context** → datos de sesión/config que se leen en muchos lugares (Auth). Ya viene listo.
- **Store (TanStack)** → estado global con acciones tipo Redux, sin envolver en Provider; cada componente se suscribe solo a lo que necesita.

---

## 7. Checklist para PASAR LOS TESTS y entregar

- [ ] `npm install` y `npm run dev` corren sin errores.
- [ ] **NO toques los archivos de test.** Adapta tu código a lo que el test espera (nombres de componentes, `name=` de inputs, textos, rutas).
- [ ] Lee los tests: a menudo buscan textos exactos (`getByText`), labels (`getByLabelText("Username")`) o roles de botón. Pon esos textos tal cual.
- [ ] El login guarda el token con `setAuthToken(response.accessToken)` y redirige.
- [ ] Las pantallas privadas están dentro de `<ProtectedRoute>`.
- [ ] Cada lista renderiza con `key` única.
- [ ] Los `name` de los inputs coinciden con lo que envías a la API.
- [ ] Ajustaste rutas del service (`/posts`, `/auth/login`...) a lo que dice el **Swagger**.
- [ ] `npm test` en verde.

---

## 8. Errores típicos y cómo evitarlos

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| 401 Unauthorized | No se envía el token | Verifica el interceptor de `axiosClient` y que guardaste el token en `localStorage` |
| CORS / Network Error | URL base mal | Revisa `VITE_API_URL` en `.env` y **reinicia** `npm run dev` |
| "Cannot read property of undefined" | Datos aún no cargados | Usa `post?.title` o renderiza condicional `{post && (...)}` |
| La lista no se actualiza tras crear | No refrescaste | Llama de nuevo al `getAll...()` después del `create` |
| Warning de `key` | Falta `key` en `.map()` | Añade `key={item.id}` |
| Ruta no encontrada | Olvidaste el `basename` `/compu2` | Navega con `useNavigate` y rutas que empiezan en `/` |

---

## 9. Comandos rápidos

```bash
npm install            # dependencias
npm run dev            # desarrollo
npm test               # tests (NO los modifiques)
npm run build          # build de producción
npm run lint           # corrige estilo
```

**Dependencias clave ya incluidas:** `react`, `react-router` (v7), `axios`, `jwt-decode`, `@mui/material` + `@mui/icons-material` (UI), `@tanstack/react-store` (estado global).

---

### TL;DR — el patrón en 1 frase
> **Service** habla con la API (vía `axiosClient` con token automático) → la **Página** usa `useState`/`useEffect` para leer y `.map()` para mostrar → los **formularios** llaman al service y refrescan → la **sesión** vive en `AuthContext` → las **rutas privadas** van dentro de `ProtectedRoute` declaradas en `Router.jsx`.
