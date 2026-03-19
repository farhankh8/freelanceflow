const fs=require("fs");const c=`import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import useAuthStore from "./store/authStore"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Clients from "./pages/Clients"
import Layout from "./components/Layout"
const PrivateRoute = ({ children }) => {
  const { accessToken } = useAuthStore()
  return accessToken ? children : React.createElement(Navigate, {to:"/login"})
}
export default function App() {
  return React.createElement(BrowserRouter, null)
}`;fs.writeFileSync("./App.jsx",c);console.log("Done!");