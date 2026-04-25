import { createBrowserRouter } from "react-router-dom"
import { AppLayout } from "@/layouts/AppLayout"
import AnalyticsPage from "@/pages/AnalyticsPage"
import DashboardPage from "@/pages/DashboardPage"
import GoalsPage from "@/pages/GoalsPage"
import NotFoundPage from "@/pages/NotFoundPage"
import ProjectsPage from "@/pages/ProjectsPage"
import RoutinePage from "@/pages/RoutinePage"
import SettingsPage from "@/pages/SettingsPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "goals", element: <GoalsPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "routine", element: <RoutinePage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
