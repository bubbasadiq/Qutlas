export const materials = [
  { id: 'steel', name: 'Steel', description: 'Source sheet, plate, sections, bars, tubes, and made-to-measure components.', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Mechanical_workshop.jpg/1280px-Mechanical_workshop.jpg', alt: 'Metal workshop with steel stock and fabrication benches.', detail: 'Sheet · plate · sections · bars · tubes' },
  { id: 'wood', name: 'Wood', description: 'Source boards, panels, timber, and made-to-measure wood components.', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Stack_of_wooden_planks_-_close-up_01.jpg/1280px-Stack_of_wooden_planks_-_close-up_01.jpg', alt: 'Stacked timber boards showing the wood grain.', detail: 'Boards · panels · timber · components' },
  { id: 'granite', name: 'Granite', description: 'Request granite for countertops, steps, and architectural finishes.', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Granite_slabs_on_a_truck_awaiting_to_installed_in_a_kitchen.jpg/1280px-Granite_slabs_on_a_truck_awaiting_to_installed_in_a_kitchen.jpg', alt: 'Granite slabs prepared for delivery.', detail: 'Countertops · steps · cut-to-size surfaces' },
];

export const services = [
  { id: 'material-supply', name: 'Material supply', description: 'Request the material, size, quantity, and destination. Availability is confirmed for each enquiry.', kind: 'material' },
  { id: 'cut-to-size', name: 'Cut to size', description: 'Share dimensions and quantities for a cut-to-size request. Process and availability are checked before quotation.', kind: 'custom' },
  { id: 'custom-manufacturing', name: 'Custom manufacturing', description: 'Describe a component or assembly, add drawings or references, and request a technical review.', kind: 'custom' },
  { id: 'project-sourcing', name: 'Project sourcing', description: 'Bring a material list or project brief into one request for review and quotation.', kind: 'project' },
];

export const resources = [
  { href: '/resources/material-guides', title: 'Material guides', description: 'What to include when requesting steel, wood, or granite.' },
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
  { id: 'steel', name: 'Steel' },
  { id: 'wood', name: 'Wood' },
  { id: 'granite', name: 'Granite' },
];

export const catalogueProducts: CatalogueProduct[] = [
  { id: 'steel-rhs', code: 'ST / 01', material: 'steel', category: 'steel', family: 'Steel', form: 'Rectangular hollow section', name: 'Rectangular hollow section', summary: 'A hollow steel profile for frames, enclosures, furniture, robotics and fabricated structures.', tags: ['rhs', 'tube', 'box section', 'profile'], status: 'to-confirm', sellingUnit: 'Usually per length · confirm with enquiry', specs: [{ label: 'Dimensions', value: 'External width × height, wall thickness and stock length' }, { label: 'Grade / quality', value: 'Grade, standard and finish to be confirmed' }, { label: 'Processing', value: 'Cutting or fabrication subject to review' }] },
  { id: 'steel-sheet', code: 'ST / 02', material: 'steel', category: 'steel', family: 'Steel', form: 'Sheet or plate', name: 'Steel sheet or plate', summary: 'Flat stock for panels, brackets, machine parts, bases and cut components.', tags: ['sheet', 'plate', 'flat', 'cut'], status: 'to-confirm', sellingUnit: 'Per sheet, plate or cut piece · confirm with enquiry', specs: [{ label: 'Dimensions', value: 'Thickness, width and length' }, { label: 'Grade / quality', value: 'Material grade, standard and finish to be confirmed' }, { label: 'Processing', value: 'Cutting and fabrication subject to review' }] },
  { id: 'plywood-panel', code: 'WD / 01', material: 'wood', category: 'wood', family: 'Wood', form: 'Engineered board', name: 'Plywood or engineered panel', summary: 'Panel stock for joinery, interiors, furniture, product design and project cutting lists.', tags: ['plywood', 'board', 'panel', 'sheet'], status: 'to-confirm', sellingUnit: 'Per sheet or cut panel · confirm with enquiry', specs: [{ label: 'Dimensions', value: 'Thickness and sheet format' }, { label: 'Grade / quality', value: 'Grade, veneer, core and finish to be confirmed' }, { label: 'Use', value: 'Indoor, outdoor or structural suitability must be verified' }] },
  { id: 'granite-slab', code: 'GR / 01', material: 'granite', category: 'granite', family: 'Granite', form: 'Slab', name: 'Granite slab', summary: 'Natural stone for worktops, steps, furniture details and architectural surfaces.', tags: ['slab', 'countertop', 'stone', 'surface'], status: 'to-confirm', sellingUnit: 'Per slab or cut-to-size component · confirm with enquiry', specs: [{ label: 'Dimensions', value: 'Nominal slab size, thickness and usable yield' }, { label: 'Quality', value: 'Colour, pattern, condition and exact slab selection to be confirmed' }, { label: 'Finish', value: 'Polished, honed or other finish where available' }] },
];

export const materialUseCases: Record<string, string[]> = {
  steel: ['Sheet and plate', 'Sections and bars', 'Tubes and profiles', 'Made-to-measure components'],
  wood: ['Boards and sheet materials', 'Timber', 'Panels', 'Cut-to-size components'],
  granite: ['Countertops', 'Steps', 'Architectural surfaces', 'Cut-to-size enquiries'],
};
