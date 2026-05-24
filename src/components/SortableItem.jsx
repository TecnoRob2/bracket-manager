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
        padding: "8px 12px",
        marginBottom: "10px",
        background: "var(--primary-color, #ff9800)",
        color: "var(--primary-contrast, #ffffff)",
        borderRadius: "8px",
        cursor: "grab",
        border: "1px solid var(--primary-color-hover, #f08d00)",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {seedNum}. {name}
        </div>
    );
}