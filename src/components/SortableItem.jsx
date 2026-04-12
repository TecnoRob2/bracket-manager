import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableItem({id, name, seedNum}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        padding: "8px 0",
        background: "var(--card-bg, #222)", // <-- Cambios para hacerlo compatible con el tema
        color: "var(--text-color, #fff)",   // <-- Cambios para hacerlo compatible con el tema
        borderRadius: "8px",
        cursor: "grab",
        border: "1px solid var(--border-color, #ccc)", // <-- Cambios para hacerlo compatible con el tema
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {seedNum}. {name}
        </div>
    );
}