import type { CatalogItem } from '../api/catalog';

/** Renderer inputs — no API, pricing, or cart concepts leak in. */
export type BaseShape = 'ring' | 'twist' | 'pillow';
export type ToppingShape = 'dot' | 'bar' | 'flake' | 'curl';

export interface RendererTopping {
  instanceId: string;
  color: string;
  shape: ToppingShape;
}

export interface DonutVisualSpec {
  baseColor: string;
  baseShape: BaseShape;
  sauceColor: string | null;
  toppings: RendererTopping[];
}

const SHAPES: ToppingShape[] = ['dot', 'bar', 'flake', 'curl'];

function shapeForSlug(slug: string): ToppingShape {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return SHAPES[h % SHAPES.length] as ToppingShape;
}

function baseShapeFor(item: CatalogItem): BaseShape {
  const key = (item.visual_key || '').toLowerCase();
  const slug = item.slug.toLowerCase();
  if (key.includes('cocoa') || slug.includes('cocoa')) return 'ring';
  if (key.includes('twist') || slug.includes('twist')) return 'twist';
  if (key.includes('pillow') || slug.includes('pillow') || slug.includes('filled')) return 'pillow';
  return 'ring';
}

/** Explicit visual mapping; future images/3D can replace this module. */
export function compositionToVisual(
  base: CatalogItem,
  sauce: CatalogItem | null,
  toppings: CatalogItem[],
): DonutVisualSpec {
  return {
    baseColor: base.color || '#E8B06E',
    baseShape: baseShapeFor(base),
    sauceColor: sauce ? sauce.color || '#F6A8BE' : null,
    toppings: toppings.map((t) => ({
      instanceId: `t-${t.id}`,
      color: t.color || '#FFFFFF',
      shape: shapeForSlug(t.slug),
    })),
  };
}

/** Deterministic scatter: same topping order always yields same layout. */
export function scatterPosition(index: number, total: number): { dx: number; dy: number; rot: number } {
  const golden = 2.399963;
  const angle = index * golden + 0.4;
  const ring = total <= 1 ? 0.55 : 0.42 + 0.38 * ((index * 0.6180339887) % 1);
  return { dx: Math.cos(angle) * ring, dy: Math.sin(angle) * ring * 0.92, rot: (index * 47) % 180 };
}
