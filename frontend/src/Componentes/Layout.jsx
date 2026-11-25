// Muestra la navegación y la estructura común de cada pantalla.
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
export default function Layout({ user, onLogout, children }) { const navigate = useNavigate(); async function logout() { try { await api('/auth/logout', { method: 'POST' }); onLogout(); navigate('/login'); } catch (e) { window.alert(e.message); } } return <><header><div className="bar"><Link className="brand" to="/">J.J <span>SecureVault</span></Link><nav aria-label="Navegación principal">{user ? <><Link to="/">Notas</Link><Link to="/profile">Perfil</Link>{user.role === 'administrador' && <Link to="/admin">Administración</Link>}<button className="link" onClick={logout}>Cerrar sesión</button></> : <><Link to="/login">Ingresar</Link><Link to="/register">Registrarse</Link></>}</nav></div></header><main>{children}</main><footer>Una práctica universitaria de seguridad web.</footer></>; }
