import { createBrowserRouter } from "react-router";
import Login from "../pages/Login/Login";
import Feed from "../pages/Feed/Feed";
import PostDetail from "../pages/PostDetail/PostDetail";
import Landing from "../pages/Landing/Landing";
import Register from "../pages/Register/Register";
import ProtectedRoute from "../components/ProtectedRoute";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Landing />,
    },
    {
        path: "/auth",
        children: [
            {
                index: true,
                element: <Login />,
            },
            {
                path: "login",
                element: <Login />,
            },
            {
                path: "register",
                element: <Register />,
            },
        ],
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: "feed",
                element: <Feed />,
            },
            {
                path: "posts/:id",
                element: <PostDetail />,
            },
        ],
    },
], { basename: "/compu2" });

export default router;
