export interface DemoDonut {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  tags: string[];
  glaze: 'strawberry' | 'chocolate' | 'vanilla' | 'matcha';
  toppings: string[];
  isDemo: true;
}

export const DEMO_CURRENCY = 'USD';

export const demoDonuts: DemoDonut[] = [
  {
    id: 'demo-strawberry-cloud',
    name: 'Strawberry Cloud',
    description: 'Fluffy ring, strawberry glaze, rainbow pearls.',
    price: 3.5,
    currency: DEMO_CURRENCY,
    tags: ['fruity', 'classic'],
    glaze: 'strawberry',
    toppings: ['pearls', 'shimmer'],
    isDemo: true,
  },
  {
    id: 'demo-choco-crave',
    name: 'Choco Crave',
    description: 'Cocoa dough, dark glaze, cocoa-nib crunch.',
    price: 3.9,
    currency: DEMO_CURRENCY,
    tags: ['chocolate', 'rich'],
    glaze: 'chocolate',
    toppings: ['nibs', 'drizzle'],
    isDemo: true,
  },
  {
    id: 'demo-vanilla-dream',
    name: 'Vanilla Dream',
    description: 'Golden dough, vanilla glaze, gold dusting.',
    price: 3.2,
    currency: DEMO_CURRENCY,
    tags: ['vanilla', 'light'],
    glaze: 'vanilla',
    toppings: ['gold', 'sugar'],
    isDemo: true,
  },
  {
    id: 'demo-matcha-mood',
    name: 'Matcha Mood',
    description: 'Earthy matcha glaze, sesame snap.',
    price: 4.1,
    currency: DEMO_CURRENCY,
    tags: ['matcha', 'new'],
    glaze: 'matcha',
    toppings: ['sesame', 'lime zest'],
    isDemo: true,
  },
];

export const builderBases = ['Classic ring', 'Cocoa ring', 'Glazed twist'] as const;
export const builderSauces = ['Strawberry', 'Chocolate', 'Vanilla', 'Matcha'] as const;
export const builderToppings = ['Pearls', 'Cocoa nibs', 'Gold dust', 'Sesame'] as const;

export type BuilderBase = (typeof builderBases)[number];
export type BuilderSauce = (typeof builderSauces)[number];
export type BuilderTopping = (typeof builderToppings)[number];
