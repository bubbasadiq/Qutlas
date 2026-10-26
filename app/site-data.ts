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
  price?: number;
};

export const catalogueCategories = [
  { id: 'steel', name: 'Steel forms' },
  { id: 'wood', name: 'Wood & boards' },
  { id: 'stone', name: 'Granite & stone' },
  { id: 'tiles', name: 'Tiles' },
  { id: 'hardware', name: 'Hardware & components' },
];

export const catalogueProducts: CatalogueProduct[] = [
  { id: 'steel-rhs', code: 'ST / 01', material: 'steel', category: 'steel', family: 'Steel', form: 'Rectangular hollow section', name: 'Rectangular hollow section', summary: 'A hollow steel profile for frames, enclosures and fabricated structures.', tags: ['rhs', 'tube', 'box section', 'profile'], status: 'to-confirm', sellingUnit: 'Typically per length · confirm with enquiry', specs: [{ label: 'Dimensions', value: 'External width × height, wall thickness, stock length' }, { label: 'Material', value: 'Grade and finish to be confirmed' }, { label: 'Processing', value: 'Custom cutting may be requested' }] },
  { id: 'steel-sheet', code: 'ST / 02', material: 'steel', category: 'steel', family: 'Steel', form: 'Sheet or plate', name: 'Steel sheet or plate', summary: 'Flat stock for panels, brackets, bases and cut components.', tags: ['sheet', 'plate', 'flat', 'cut'], status: 'to-confirm', sellingUnit: 'Per sheet, plate or cut piece · confirm with enquiry', specs: [{ label: 'Dimensions', value: 'Thickness, width and length' }, { label: 'Material', value: 'Carbon, stainless or galvanised classification to be confirmed' }, { label: 'Processing', value: 'Cutting and fabrication subject to review' }] },
  { id: 'plywood-panel', code: 'WD / 01', material: 'wood', category: 'wood', family: 'Wood', form: 'Engineered board', name: 'Plywood or engineered panel', summary: 'Panel stock for joinery, interiors, furniture and project cutting lists.', tags: ['plywood', 'board', 'panel', 'sheet'], status: 'to-confirm', sellingUnit: 'Per sheet or cut panel · confirm with enquiry', specs: [{ label: 'Dimensions', value: 'Thickness and sheet format' }, { label: 'Surface', value: 'Grade, veneer and finish to be confirmed' }, { label: 'Use', value: 'Indoor, outdoor or structural suitability must be verified' }] },
  { id: 'granite-slab', code: 'GR / 01', material: 'granite', category: 'stone', family: 'Granite', form: 'Slab', name: 'Granite slab', summary: 'Natural stone slab for countertops, steps and architectural surfaces.', tags: ['slab', 'countertop', 'stone', 'surface'], status: 'to-confirm', sellingUnit: 'Per slab or cut-to-size component · confirm with enquiry', specs: [{ label: 'Dimensions', value: 'Nominal slab size and usable yield' }, { label: 'Appearance', value: 'Colour, pattern and exact slab selection to be confirmed' }, { label: 'Finish', value: 'Polished, honed or other finish where available' }] },
  { id: 'porcelain-tile', code: 'TL / 01', material: 'tiles', category: 'tiles', family: 'Tiles', form: 'Porcelain or ceramic tile', name: 'Porcelain or ceramic tile', summary: 'Tile options for floor, wall, wet-area and exterior projects where documented.', tags: ['tile', 'porcelain', 'ceramic', 'floor', 'wall'], status: 'to-confirm', sellingUnit: 'Per box · box coverage and MOQ to be confirmed', specs: [{ label: 'Dimensions', value: 'Nominal size, thickness and actual size where specified' }, { label: 'Performance', value: 'Water absorption, slip rating and application must be verified' }, { label: 'Quantity', value: 'Box coverage, batch and shade variation to be confirmed' }] },
  { id: 'hinge-hardware', code: 'HW / 01', material: 'steel', category: 'hardware', family: 'Components', form: 'Hinge or pivot hardware', name: 'Hinges, pivots and joining hardware', price: 2500, summary: 'Components that can be added to an enclosure, frame or fabricated assembly enquiry.', tags: ['hinge', 'pivot', 'hardware', 'component'], status: 'to-confirm', sellingUnit: 'Per piece or pack · confirm with enquiry', specs: [{ label: 'Selection', value: 'Type, dimensions, material and finish' }, { label: 'Fit', value: 'Mounting method and compatibility must be checked' }, { label: 'Project link', value: 'Carry selected component into a fabrication request' }] },
  { id: 'fasteners', code: 'HW / 02', material: 'steel', category: 'hardware', family: 'Components', form: 'Fastener or fixing', name: 'Bolts, screws, nuts and washers', price: 850, summary: 'Assembly and installation components for sourced materials and custom work.', tags: ['bolt', 'screw', 'nut', 'washer', 'fastener'], status: 'to-confirm', sellingUnit: 'Per piece or pack · thread, grade and pack quantity to be confirmed', specs: [{ label: 'Selection', value: 'Type, head, diameter, thread and length' }, { label: 'Material', value: 'Grade and finish where verified' }, { label: 'Compatibility', value: 'Related nuts, washers or anchors can be requested' }] },
];

export const materialUseCases: Record<string, string[]> = {
  steel: ['Sheet and plate', 'Sections and bars', 'Tubes and profiles', 'Made-to-measure components'],
  wood: ['Boards and sheet materials', 'Timber', 'Panels', 'Cut-to-size components'],
  tiles: ['Floor and wall tiles', 'Wet areas', 'Room quantities', 'Project supply enquiries'],
  granite: ['Countertops', 'Steps', 'Architectural surfaces', 'Cut-to-size enquiries'],
};
