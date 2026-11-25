// Define rutas públicas y protegidas según la sesión y el rol.
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import Layout from '../Componentes/Layout';
import { Login, Register, Forgot, Reset } from '../Pages/Auth';
import Notes from '../Pages/Notes';
import Profile from '../Pages/Profile';
import Admin from '../Pages/Admin';
export default function AppRoutes() { const [user,setUser] = useState(null); const [loading,setLoading] = useState(true); useEffect(() => { api('/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)); }, []); if (loading) return <main><p role="status">Comprobando sesión…</p></main>; const protectedPage = page => user ? page : <Navigate to="/login" replace />; return <Layout user={user} onLogout={() => setUser(null)}><Routes><Route path="/login" element={<Login onLogin={setUser} />} /><Route path="/register" element={<Register />} /><Route path="/forgot-password" element={<Forgot />} /><Route path="/reset-password" element={<Reset />} /><Route path="/" element={protectedPage(<Notes />)} /><Route path="/profile" element={protectedPage(<Profile />)} /><Route path="/admin" element={protectedPage(user?.role === 'administrador' ? <Admin /> : <p>Acceso denegado.</p>)} /><Route path="*" element={<h1>Página no encontrada</h1>} /></Routes></Layout>; }
