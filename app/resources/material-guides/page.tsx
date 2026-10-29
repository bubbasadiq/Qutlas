import ContentPage from '../../ContentPage';
import { materials } from '../../site-data';

export const metadata = {
  title: 'Material guides | Qutlas',
  description: 'What details to include when requesting steel, wood, or granite.',
};

export default function MaterialGuidesPage() {
  return <ContentPage eyebrow="Resources" title="Material guides" description="You do not need every technical detail to start. Share what you know about the material, use, size, quantity, and destination." action="Choose a material" actionHref="/materials" sections={materials.map((material) => ({ title: material.name, body: material.description, items: material.id === 'steel' ? ['Product form and grade, if known', 'Thickness and dimensions in mm', 'Cutting or fabrication needs'] : material.id === 'wood' ? ['Board, panel, or timber type', 'Thickness, length, and width in mm', 'Cutting or edge requirements'] : ['Intended use: countertop, steps, or another surface', 'Colour, finish, and dimensions in mm', 'Cut-outs, edge details, and installation interest'] }))} />;
}