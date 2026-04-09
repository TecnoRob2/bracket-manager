import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";

/**
 * @param {Object} props
 * @param {PlayerSeed[]} props.seeds
 * @param {function} props.setSeeds
 * @param {(updatedSeeds: PlayerSeed[]) => void} [props.onSeedsReordered]
 * @returns 
 */
export default function DraggableSeeding({ seeds, setSeeds, onSeedsReordered }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = seeds.findIndex((seed) => seed.seedId === active.id);
    const newIndex = seeds.findIndex((seed) => seed.seedId === over.id);

    const newOrder = arrayMove(seeds, oldIndex, newIndex)
      .map((item, index) => ({
        ...item,
        seedNum: index + 1,
      }));
    
    setSeeds(newOrder);
    onSeedsReordered?.(newOrder);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={seeds.map((s) => s.seedId)}
        strategy={verticalListSortingStrategy}
      >
        {seeds.map((seed) => (
          <SortableItem key={seed.seedId} id={seed.seedId} name={seed.gamerTag} seedNum={seed.seedNum} />
        ))}
      </SortableContext>
    </DndContext>
  );
}