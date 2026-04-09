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
        background: "#222",
        color: "#fff",
        borderRadius: "8px",
        cursor: "grab",
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {seedNum}. {name}
        </div>
    );
}