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

export const materialUseCases: Record<string, string[]> = {
  steel: ['Sheet and plate', 'Sections and bars', 'Tubes and profiles', 'Made-to-measure components'],
  wood: ['Boards and sheet materials', 'Timber', 'Panels', 'Cut-to-size components'],
  granite: ['Countertops', 'Steps', 'Architectural surfaces', 'Cut-to-size enquiries'],
};