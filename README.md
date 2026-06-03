# Post Manager — Frontend (React)

Aplicación de frontend para el examen de Computación en Internet II. Permite iniciar sesión, ver y crear publicaciones (posts) y agregar comentarios a cada una, integrándose con una REST API.

## Stack
- React 19 + Vite
- React Router 7
- Material UI (MUI)
- Axios (cliente HTTP con token automático vía interceptor)
- jwt-decode (decodifica el JWT para obtener el usuario)

## Configuración

Edita el archivo `.env` con la URL de la API:

```
VITE_API_URL=http://192.168.131.104:8080/post-manager
```

> Si cambias el `.env`, reinicia el servidor de desarrollo.

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # desarrollo -> http://localhost:6767/compu2/
npm run build    # build de producción
npm run preview  # previsualizar el build
npm run lint     # lint
```

> La app corre bajo el `basename` `/compu2` (configurado en `vite.config.js` y en el router).

## Estructura

```
src/
├── main.jsx                       # monta AuthProvider + Router
├── router/Router.jsx              # rutas (públicas y protegidas)
├── lib/axios/axiosClient.js       # cliente HTTP central (baseURL + Bearer token)
├── context/AuthContext.jsx        # estado global de sesión (token, user, login, logout)
├── components/
│   ├── ProtectedRoute.jsx         # guarda rutas privadas
│   └── AuthUser.jsx               # componente de usuario autenticado
└── pages/
    ├── Landing/                   # página de inicio
    ├── Login/                     # pantalla de login + login.service
    ├── Register/                  # registro (placeholder)
    ├── Feed/                      # feed: ver y crear posts
    │   ├── components/            #   NewPost, PostList, PostItem
    │   └── services/              #   post.service.js (CRUD de posts)
    └── PostDetail/                # detalle de post + comentarios
        ├── components/            #   PostCard, NewComment, CommentList
        └── services/              #   comment.service.js
```

## Rutas

| Ruta            | Pantalla        | Acceso     |
|-----------------|-----------------|------------|
| `/`             | Landing         | Público    |
| `/auth/login`   | Login           | Público    |
| `/auth/register`| Register        | Público    |
| `/feed`         | Feed            | Protegido  |
| `/posts/:id`    | Detalle de post | Protegido  |

## Endpoints usados (ajustar al Swagger del examen)

| Acción                | Método | Ruta                         |
|-----------------------|--------|------------------------------|
| Login                 | POST   | `/public/auth/login`         |
| Listar posts          | GET    | `/posts`                     |
| Obtener post por id   | GET    | `/posts/{id}`                |
| Crear post            | POST   | `/posts`                     |
| Actualizar post       | PUT    | `/posts`                     |
| Eliminar post         | DELETE | `/posts/{id}`                |
| Listar comentarios    | GET    | `/posts/{id}/comments`       |
| Agregar comentario    | POST   | `/posts/{id}/comments`       |

> Las rutas y los nombres de los campos del DTO (`title`, `content`, ...) pueden variar según la API real. Verifícalos en el Swagger:
> `http://192.168.131.104:8080/post-manager/swagger-ui/index.html`

## Flujo de autenticación
1. El usuario inicia sesión en `/auth/login`.
2. `login.service` llama a la API y devuelve `{ accessToken }`.
3. `AuthContext.login(token)` guarda el token en estado global y en `localStorage`, y decodifica el usuario del JWT.
4. El interceptor de Axios añade `Authorization: Bearer <token>` a cada petición.
5. `ProtectedRoute` deja pasar solo si hay sesión; si no, redirige al login.
