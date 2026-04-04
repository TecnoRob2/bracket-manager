import { useParams, useNavigate } from 'react-router-dom';

export default function BracketViewPage() {
  const { id } = useParams(); // Esto extrae el número de torneo de la URL
  const navigate = useNavigate();

  return (
    <div style={{padding: '2rem'}}>
      <button onClick={() => navigate('/dashboard')}>⬅ Volver al Dashboard</button>
      <button onClick={() => navigate(`/torneo/${id}/borradores`)}>Ver Borradores</button>
      
      <h1>Viendo el Bracket del Torneo #{id}</h1>
      <p>Aquí irá el componente visual de Drag&Drop de partidas.</p>
    </div>
  )
}