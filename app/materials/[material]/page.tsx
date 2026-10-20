import { notFound } from 'next/navigation';
import ContentPage from '../../ContentPage';
import { materials, materialUseCases } from '../../site-data';

type MaterialPageProps = { params: Promise<{ material: string }> };

export function generateStaticParams() {
  return materials.map(({ id }) => ({ material: id }));
}

export async function generateMetadata({ params }: MaterialPageProps) {
  const { material: id } = await params;
  const material = materials.find((item) => item.id === id);
  return material ? { title: `${material.name} | Qutlas`, description: material.description } : { title: 'Material not found | Qutlas' };
}

export default async function MaterialPage({ params }: MaterialPageProps) {
  const { material: id } = await params;
  const material = materials.find((item) => item.id === id);
  if (!material) notFound();

  return <ContentPage eyebrow="Materials" title={material.name} description={material.description} image={material.image} imageAlt={material.alt} action={`Request ${material.name}`} actionHref={`/project?material=${material.id}`} sections={[
    { title: `What you can request`, body: `Share the material form, quantity, location, and intended use for your ${material.name.toLowerCase()} requirement. Availability and any processing are confirmed for each request.`, items: materialUseCases[material.id] },
    { title: 'Add the details you know', body: 'Use metric dimensions where applicable. You can leave unknown specifications blank and explain the application in your own words.', items: ['Material type or grade, if known', 'Dimensions and units, if known', 'Quantity and delivery location'] },
    { title: 'Have a drawing or reference?', body: 'Start a project with a drawing, a photo, a list, or a plain-language description. A technical review is arranged when the requirement needs it.' },
  ]} />;
}