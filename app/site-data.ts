export const materials = [
  { id: 'steel', name: 'Steel', description: 'Source sheet, plate, sections, bars, tubes, and made-to-measure components.', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Mechanical_workshop.jpg/1280px-Mechanical_workshop.jpg', alt: 'Metal workshop with steel stock and fabrication benches.', detail: 'Sheet · plate · sections · bars · tubes' },
  { id: 'wood', name: 'Wood', description: 'Source boards, panels, timber, and made-to-measure wood components.', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Stack_of_wooden_planks_-_close-up_01.jpg/1280px-Stack_of_wooden_planks_-_close-up_01.jpg', alt: 'Stacked timber boards showing the wood grain.', detail: 'Boards · panels · timber · components' },
  { id: 'tiles', name: 'Tiles', description: 'Request tile options and quantities for a room or building project.', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Ceramic_tile_6858.jpg/1280px-Ceramic_tile_6858.jpg', alt: 'Ceramic wall tiles used in a building interior.', detail: 'Floor · wall · wet areas · project supply' },
  { id: 'granite', name: 'Granite', description: 'Request granite for countertops, steps, and architectural finishes.', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Granite_slabs_on_a_truck_awaiting_to_installed_in_a_kitchen.jpg/1280px-Granite_slabs_on_a_truck_awaiting_to_installed_in_a_kitchen.jpg', alt: 'Granite slabs prepared for delivery.', detail: 'Countertops · steps · cut-to-size surfaces' },
];

export const services = [
  { id: 'material-supply', name: 'Material supply', description: 'Request the material, size, quantity, and destination. Availability is confirmed for each enquiry.', kind: 'material' },
  { id: 'cut-to-size', name: 'Cut to size', description: 'Share dimensions and quantities for a cut-to-size request. Process and availability are checked before quotation.', kind: 'custom' },
  { id: 'custom-manufacturing', name: 'Custom manufacturing', description: 'Describe a component or assembly, add drawings or references, and request a technical review.', kind: 'custom' },
  { id: 'project-sourcing', name: 'Project sourcing', description: 'Bring a material list or project brief into one request for review and quotation.', kind: 'project' },
];

export const resources = [
  { href: '/resources/material-guides', title: 'Material guides', description: 'What to include when requesting steel, wood, tiles, or granite.' },
  { href: '/resources/drawings-and-files', title: 'Drawings and files', description: 'Prepare drawings, photos, or lists to help explain a requirement.' },
  { href: '/how-it-works', title: 'How it works', description: 'From initial details to quotation, approval, and fulfilment.' },
  { href: '/faqs', title: 'FAQs', description: 'Answers about requests, specifications, files, and quotations.' },
];

export type CatalogueProduct = {
  id: string;
  code: string;
  material: string;
  category: string;
  family: string;
  form: string;
  name: string;
  summary: string;
  tags: string[];
  status: 'verified' | 'to-confirm';
  sellingUnit: string;
  specs: { label: string; value: string }[];
  price: number;
  sizes?: string[];
  grades?: string[];
  finishes?: string[];
  types?: string[];
};

export const catalogueCategories = [
  { id: 'steel', name: 'Steel forms' },
  { id: 'wood', name: 'Wood & boards' },
  { id: 'stone', name: 'Granite & stone' },
  { id: 'tiles', name: 'Tiles' },
  { id: 'hardware', name: 'Hardware & components' },
];

export const catalogueProducts: CatalogueProduct[] = [
  { id: 'steel-rhs', code: 'ST / 01', material: 'steel', category: 'steel', family: 'Steel', form: 'Rectangular hollow section', name: 'Rectangular hollow section', summary: 'A hollow steel profile for frames, enclosures and fabricated structures.', tags: ['rhs', 'tube', 'box section', 'profile'], status: 'verified', sellingUnit: 'Per length', price: 18500, sizes: ['25 × 25 × 1.6 mm', '40 × 40 × 2.0 mm', '50 × 50 × 2.5 mm', '2 × 2 × 1/16 in', '2 × 2 × 3/32 in'], grades: ['S235 / mild steel', 'S355 structural steel'], finishes: ['Mill finish', 'Hot-dip galvanised', 'Primed'], types: ['RHS box section', 'SHS square section'], specs: [{ label: 'Dimensions', value: 'External width × height, wall thickness, stock length' }, { label: 'Material', value: 'Grade and finish to be confirmed' }, { label: 'Processing', value: 'Custom cutting may be requested' }] },
  { id: 'steel-sheet', code: 'ST / 02', material: 'steel', category: 'steel', family: 'Steel', form: 'Sheet or plate', name: 'Steel sheet or plate', summary: 'Flat stock for panels, brackets, bases and cut components.', tags: ['sheet', 'plate', 'flat', 'cut'], status: 'verified', sellingUnit: 'Per sheet or cut piece', price: 125000, sizes: ['1.2 × 2.4 m', '1.5 × 3.0 m', '3 mm', '6 mm', '12 mm'], grades: ['S235 / mild steel', '304 stainless steel', '316 stainless steel'], finishes: ['Mill finish', 'Brushed', 'Galvanised'], types: ['Sheet', 'Plate', 'Perforated sheet'], specs: [{ label: 'Dimensions', value: 'Thickness, width and length' }, { label: 'Material', value: 'Carbon, stainless or galvanised classification to be confirmed' }, { label: 'Processing', value: 'Cutting and fabrication subject to review' }] },
  { id: 'plywood-panel', code: 'WD / 01', material: 'wood', category: 'wood', family: 'Wood', form: 'Engineered board', name: 'Plywood or engineered panel', summary: 'Panel stock for joinery, interiors, furniture and project cutting lists.', tags: ['plywood', 'board', 'panel', 'sheet'], status: 'verified', sellingUnit: 'Per sheet or cut panel', price: 68000, sizes: ['1220 × 2440 mm', '1525 × 3050 mm', '6 mm', '12 mm', '18 mm'], grades: ['Interior', 'Exterior', 'Marine'], finishes: ['Raw', 'Film-faced', 'Veneered'], types: ['Plywood', 'MDF', 'OSB'], specs: [{ label: 'Dimensions', value: 'Thickness and sheet format' }, { label: 'Surface', value: 'Grade, veneer and finish to be confirmed' }, { label: 'Use', value: 'Indoor, outdoor or structural suitability must be verified' }] },
  { id: 'granite-slab', code: 'GR / 01', material: 'granite', category: 'stone', family: 'Granite', form: 'Slab', name: 'Granite slab', summary: 'Natural stone slab for countertops, steps and architectural surfaces.', tags: ['slab', 'countertop', 'stone', 'surface'], status: 'verified', sellingUnit: 'Per slab or cut-to-size piece', price: 210000, sizes: ['600 × 600 mm', '1200 × 600 mm', 'Full slab', 'Custom cut'], grades: ['Commercial', 'Premium select'], finishes: ['Polished', 'Honed', 'Leathered'], types: ['Slab', 'Worktop', 'Step'], specs: [{ label: 'Dimensions', value: 'Nominal slab size and usable yield' }, { label: 'Appearance', value: 'Colour, pattern and exact slab selection to be confirmed' }, { label: 'Finish', value: 'Polished, honed or other finish where available' }] },
  { id: 'porcelain-tile', code: 'TL / 01', material: 'tiles', category: 'tiles', family: 'Tiles', form: 'Porcelain or ceramic tile', name: 'Porcelain or ceramic tile', summary: 'Tile options for floor, wall, wet-area and exterior projects where documented.', tags: ['tile', 'porcelain', 'ceramic', 'floor', 'wall'], status: 'verified', sellingUnit: 'Per box', price: 18500, sizes: ['300 × 300 mm', '600 × 600 mm', '300 × 600 mm', '600 × 1200 mm'], grades: ['Commercial', 'Premium'], finishes: ['Matt', 'Gloss', 'Textured'], types: ['Porcelain', 'Ceramic', 'Mosaic'], specs: [{ label: 'Dimensions', value: 'Nominal size, thickness and actual size where specified' }, { label: 'Performance', value: 'Water absorption, slip rating and application must be verified' }, { label: 'Quantity', value: 'Box coverage, batch and shade variation to be confirmed' }] },
  { id: 'hinge-hardware', code: 'HW / 01', material: 'steel', category: 'hardware', family: 'Components', form: 'Hinge or pivot hardware', name: 'Hinges, pivots and joining hardware', price: 2500, summary: 'Components that can be added to an enclosure, frame or fabricated assembly enquiry.', tags: ['hinge', 'pivot', 'hardware', 'component'], status: 'verified', sellingUnit: 'Per piece', sizes: ['50 mm', '75 mm', '100 mm', '150 mm', '2 in', '4 in'], grades: ['304 stainless steel', '316 stainless steel', 'Mild steel'], finishes: ['Satin stainless', 'Zinc plated', 'Black oxide'], types: ['Butt hinge', 'Piano hinge', 'Pivot', 'Joining plate'], specs: [{ label: 'Selection', value: 'Type, dimensions, material and finish' }, { label: 'Fit', value: 'Mounting method and compatibility must be checked' }, { label: 'Project link', value: 'Carry selected component into a fabrication request' }] },
  { id: 'fasteners', code: 'HW / 02', material: 'steel', category: 'hardware', family: 'Components', form: 'Fastener or fixing', name: 'Bolts, screws, nuts and washers', price: 850, summary: 'Assembly and installation components for sourced materials and custom work.', tags: ['bolt', 'screw', 'nut', 'washer', 'fastener'], status: 'verified', sellingUnit: 'Per piece', sizes: ['M4 × 20 mm', 'M6 × 40 mm', 'M8 × 50 mm', 'M10 × 75 mm', '1/4 × 1 in', '3/8 × 2 in'], grades: ['Class 8.8', 'Class 10.9', '304 stainless steel'], finishes: ['Bright zinc plated', 'Hot-dip galvanised', 'Plain'], types: ['Hex bolt', 'Machine screw', 'Nut', 'Washer'], specs: [{ label: 'Selection', value: 'Type, head, diameter, thread and length' }, { label: 'Material', value: 'Grade and finish where verified' }, { label: 'Compatibility', value: 'Related nuts, washers or anchors can be requested' }] },
];

export const materialUseCases: Record<string, string[]> = {
  steel: ['Sheet and plate', 'Sections and bars', 'Tubes and profiles', 'Made-to-measure components'],
  wood: ['Boards and sheet materials', 'Timber', 'Panels', 'Cut-to-size components'],
  tiles: ['Floor and wall tiles', 'Wet areas', 'Room quantities', 'Project supply enquiries'],
  granite: ['Countertops', 'Steps', 'Architectural surfaces', 'Cut-to-size enquiries'],
};
