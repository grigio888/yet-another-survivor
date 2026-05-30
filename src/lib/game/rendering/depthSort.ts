/** Entities with a lower y are drawn first; higher y draws on top (closer to camera). */
export interface DepthSortable {
    y: number;
}

export function compareDepth(a: DepthSortable, b: DepthSortable): number {
    return a.y - b.y;
}

export function sortByDepth<T extends DepthSortable>(items: readonly T[]): T[] {
    return [...items].sort(compareDepth);
}
