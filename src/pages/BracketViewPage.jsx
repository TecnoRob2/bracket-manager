import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BracketViewPage.css'; // Importamos sus nuevos estilos

export default function BracketViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="bracket-view-page">
      
      {/* 1. Botón de volver arriba a la izquierda */}
      <div className="bv-top-bar">
        <button className="btn-volver" onClick={() => navigate('/dashboard')}>
          ⬅ Volver al Dashboard
        </button>
      </div>

      {/* 2. Cabecera con el Título y los Botones de Acción */}
      <header className="bv-header">
        <h1>Bracket del Torneo #{id}</h1>
        
        <div className="bv-botones-accion">
          <button 
            className="btn-secundario" 
            onClick={() => navigate(`/torneo/${id}/borradores`)}
          >
            Ver Borradores
          </button>
          
          {/* Nuevos botones sin funcionalidad por ahora */}
          <button 
            className="btn-secundario" 
            onClick={() => console.log('Guardando borrador localmente...')}
          >
            Guardar borrador
          </button>
          
          <button 
            className="btn-exportar" 
            onClick={() => console.log('Exportando posiciones a la API de start.gg...')}
          >
            Subir 
          </button>
        </div>
      </header>

      {/* 3. El lienzo donde irá el bracket más adelante */}
      <main className="bv-lienzo">
        <p>El lienzo visual del Drag & Drop irá aquí.</p>
      </main>

    </div>
  );
}