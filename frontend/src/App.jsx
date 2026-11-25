// Proporciona el enrutador y la estructura general de la aplicación.
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './Rutas/AppRoutes';
export default function App() { return <BrowserRouter><AppRoutes /></BrowserRouter>; }
