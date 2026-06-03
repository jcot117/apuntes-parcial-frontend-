# Guía paso a paso — Cómo resolver CUALQUIER parcial de frontend (React)

> Receta general y reproducible. No depende del examen específico (posts, vehículos, productos, lo que sea). Sigue los pasos en orden y solo cambia los nombres del recurso.

---

## FASE 0 — Antes de escribir código (5 min)

1. **Lee todo el enunciado** y subraya: pantallas pedidas, componentes obligatorios y si hay tests.
2. **Abre el proyecto base** y mira si ya trae: cliente Axios, `AuthContext`, `ProtectedRoute`, router. Casi siempre sí → **reutilízalos, no los reescribas**.
3. **Abre el Swagger** del API y anota para cada recurso:
   - La ruta (`/posts`, `/comments`, ...)
   - El método (GET/POST/PUT/DELETE)
   - La **forma del JSON** (qué campos: `id`, `title`, `content`...)
   - La ruta del **login** y qué devuelve (normalmente `{ accessToken }`).
4. **Arranca el proyecto:**
   ```bash
   npm install
   npm run dev
   npm test        # si hay tests, míralos: te dicen exactamente qué esperan
   ```
5. **Configura el `.env`** con la URL del API y **reinicia** `npm run dev`.

> Regla mental: **una pantalla = una carpeta en `pages/`**. Dentro van el `.jsx` de la página, su carpeta `components/` y su carpeta `services/`.

---

## FASE 1 — Verifica la infraestructura (debe existir o crearla 1 vez)

Comprueba que existan estas 4 piezas. Si faltan, créalas (este es el orden):

### 1. Cliente Axios — `src/lib/axios/axiosClient.js`
```js
import axios from "axios";
const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
});
axiosClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});
export default axiosClient;
```

### 2. Contexto de sesión — `src/context/AuthContext.jsx`
Guarda `token` + `user`, expone `login()`, `logout()`, `isAuthenticated`. (Ver el del proyecto base; cópialo tal cual.)

### 3. Ruta protegida — `src/components/ProtectedRoute.jsx`
```jsx
import { Navigate, Outlet } from 'react-router';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
export default function ProtectedRoute() {
    const { isAuthenticated } = useContext(AuthContext);
    return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
}
```

### 4. Providers — `src/main.jsx`
```jsx
<AuthProvider>
    <RouterProvider router={router} />
</AuthProvider>
```

---

## FASE 2 — Login (siempre es lo primero del flujo)

**Paso 1. Servicio** — `pages/Login/services/login.service.js`
```js
import axiosClient from "../../../lib/axios/axiosClient";
export async function login(username, password) {
    const res = await axiosClient.post('/RUTA_LOGIN', { username, password });
    return res.data;   // { accessToken: "..." }
}
```

**Paso 2. Pantalla** — `pages/Login/Login.jsx`
```jsx
const ref = useRef();
const nav = useNavigate();
const { login: setAuthToken } = useContext(AuthContext);

const onSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(ref.current));
    const res = await login(data.username, data.password);
    setAuthToken(res.accessToken);   // guarda sesión global
    nav('/RUTA_PRIVADA');            // redirige
};
// <form ref={ref}> con <input name="username"/> y <input name="password"/>
```

**Paso 3. Ruta** en `router/Router.jsx`: `/auth/login → <Login />` (pública).

---

## FASE 3 — Receta para CADA pantalla nueva (repite por cada una)

Para cualquier pantalla que pidan (lista, detalle, formulario...), sigue SIEMPRE estos 5 pasos:

### Paso A — Crear el servicio (la capa que habla con el API)
`pages/MiPantalla/services/recurso.service.js`. Una función por endpoint:
```js
import axiosClient from "../../../lib/axios/axiosClient";

export async function getAll()       { return (await axiosClient.get('/recurso')).data; }
export async function getById(id)    { return (await axiosClient.get(`/recurso/${id}`)).data; }
export async function create(dto)    { return (await axiosClient.post('/recurso', dto)).data; }
export async function update(dto)    { return (await axiosClient.put('/recurso', dto)).data; }
export async function remove(id)     { return (await axiosClient.delete(`/recurso/${id}`)).data; }
```

### Paso B — Crear la página y leer datos al montar
```jsx
const [items, setItems] = useState([]);

const load = useCallback(async () => {
    const data = await getAll();
    setItems(Array.isArray(data) ? data : []);
}, []);

useEffect(() => { load(); }, [load]);
```

### Paso C — Mostrar la lista con `.map()` (¡siempre con `key`!)
```jsx
{items.map(item => (
    <Card key={item.id} onClick={() => nav(`/recurso/${item.id}`)}>
        {item.title}
    </Card>
))}
```

### Paso D — Si hay formulario (crear/editar): capturar, enviar, refrescar
```jsx
const [content, setContent] = useState("");

const onSubmit = async (e) => {
    e.preventDefault();
    await create({ content });   // envía al API
    setContent("");              // limpia
    await load();                // refresca la lista
};
// <input value={content} onChange={e => setContent(e.target.value)} />
```

### Paso E — Registrar la ruta en `router/Router.jsx`
¿Necesita sesión? → dentro de `<ProtectedRoute>`. ¿Lleva id? → `path: "recurso/:id"`.

---

## FASE 4 — Pantalla de detalle (cuando piden ver "uno" con sus hijos)

Igual que la receta, pero leyendo el id de la URL:
```jsx
import { useParams } from "react-router";
const { id } = useParams();              // ruta "recurso/:id"

useEffect(() => {
    getById(id).then(setItem);           // el registro principal
    loadChildren();                      // ej. comentarios
}, [id]);
```
Patrón típico: **un componente para el registro** (PostCard), **uno para crear hijo** (NewComment) y **uno para listar hijos** (CommentList).

---

## FASE 5 — Mostrar el usuario autenticado

Casi siempre piden un componente con la info del usuario logueado:
```jsx
const { user, logout } = useContext(AuthContext);
// user?.username || user?.sub || user?.email
// botón salir: logout() + nav('/auth/login')
```

---

## FASE 6 — Verificación final (antes de entregar)

```bash
npm test         # debe pasar (NO modifiques los tests)
npm run build    # debe compilar sin errores
npm run dev      # prueba el flujo a mano
```

**Prueba manual del flujo completo:**
1. Login → entra y redirige.
2. Recargar la página → la sesión se mantiene (token en localStorage).
3. Crear un registro → aparece en la lista sin recargar.
4. Entrar al detalle → se ve el registro y sus hijos.
5. Crear un hijo (comentario) → aparece en la lista.
6. Salir → vuelve al login y no deja entrar a rutas privadas.

---

## CHECKLIST RÁPIDO (imprime mentalmente esto)

- [ ] `.env` con la URL correcta (y reiniciar dev).
- [ ] Axios con interceptor de token ✔ (1 sola vez).
- [ ] Login guarda token con el contexto y redirige.
- [ ] Cada pantalla: **service → page (useState/useEffect) → map → form → ruta**.
- [ ] Rutas privadas dentro de `ProtectedRoute`.
- [ ] Detalle usa `useParams` para el `:id`.
- [ ] Toda lista con `key={item.id}`.
- [ ] Tras crear/editar/borrar → **refrescar** (volver a llamar `getAll`).
- [ ] Componente de usuario autenticado con `useContext(AuthContext)`.
- [ ] `name` de inputs y textos coinciden con lo que piden los tests.
- [ ] `npm test` y `npm run build` en verde.

---

## ERRORES TÍPICOS Y CÓMO RESOLVERLOS

| Síntoma | Causa | Solución |
|---------|-------|----------|
| 401 Unauthorized | falta el token | revisa el interceptor y que guardaste el token en localStorage |
| Network Error / CORS | URL base mal | corrige `VITE_API_URL` y **reinicia** `npm run dev` |
| "Cannot read ... of undefined" | datos aún no cargan | usa `item?.campo` o renderiza condicional `{item && (...)}` |
| la lista no se actualiza | no refrescaste | vuelve a llamar `getAll()` después de crear/editar/borrar |
| warning de `key` | falta `key` en `.map()` | añade `key={item.id}` |
| ruta no encontrada | olvidaste registrarla o el `basename` | revisa `Router.jsx` y navega con rutas absolutas (`/...`) |

---

## EL PATRÓN EN UNA FRASE

> **Service** habla con el API (Axios con token automático) → la **Página** usa `useState`/`useEffect` para leer y `.map()` para mostrar → los **formularios** envían al service y refrescan → la **sesión** vive en `AuthContext` → las **rutas privadas** van dentro de `ProtectedRoute`, declaradas en `Router.jsx`.

Si memorizas esa frase y las 6 fases, puedes resolver cualquier parcial de este tipo aunque cambien el recurso.
