import { useParams, useNavigate } from 'react-router-dom';

export default function BorradoresPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{padding: '2rem'}}>
      <button onClick={() => navigate(`/torneo/${id}/bracket`)}>⬅ Volver al Bracket</button>
      
      <h1>Borradores del Torneo #{id}</h1>
      <p>Aquí mostraremos la lista de posiciones guardadas en Dexie (IndexedDB).</p>
    </div>
  )
}