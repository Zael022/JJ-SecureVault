// Presenta mensajes de carga y error accesibles.
import React from 'react';
export default function Status({ loading, error }) { return <>{loading && <p role="status">Cargando…</p>}{error && <p className="error" role="alert">{error}</p>}</>; }
