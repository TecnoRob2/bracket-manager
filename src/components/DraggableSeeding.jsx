import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";

/**
 * @param {Object} props
 * @param {PlayerSeed[]} props.seeds
 * @param {(updatedSeeds: PlayerSeed[]) => void} [props.setSeeds]
 * @param {(updatedSeeds: PlayerSeed[]) => void} [props.onSeedsReordered]
 * @returns 
 */
export default function DraggableSeeding({ seeds = [], setSeeds, onSeedsReordered }) {
  const safeSeeds = Array.isArray(seeds) ? seeds : [];

  const emitReorderedSeeds = (activeId, overId) => {
    if (!overId || activeId === overId) return;

    const oldIndex = safeSeeds.findIndex((seed) => seed.seedId === activeId);
    const newIndex = safeSeeds.findIndex((seed) => seed.seedId === overId);

    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    const newOrder = arrayMove(safeSeeds, oldIndex, newIndex).map((item, index) => ({
      ...item,
      seedNum: index + 1,
    }));

    if (onSeedsReordered) {
      onSeedsReordered(newOrder);
      return;
    }

    setSeeds?.(newOrder);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!active) return;

    emitReorderedSeeds(active.id, over?.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!active) return;
    emitReorderedSeeds(active.id, over?.id);
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={safeSeeds.map((s) => s.seedId)}
        strategy={verticalListSortingStrategy}
      >
        {safeSeeds.map((seed) => (
          <SortableItem key={seed.seedId} id={seed.seedId} name={seed.gamerTag} seedNum={seed.seedNum} />
        ))}
      </SortableContext>
    </DndContext>
  );
}