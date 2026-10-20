import { notFound } from 'next/navigation';
import ContentPage from '../../ContentPage';
import { services } from '../../site-data';

type ServicePageProps = { params: Promise<{ service: string }> };

export function generateStaticParams() {
  return services.map(({ id }) => ({ service: id }));
}

export async function generateMetadata({ params }: ServicePageProps) {
  const { service: id } = await params;
  const service = services.find((item) => item.id === id);
  return service ? { title: `${service.name} | Qutlas`, description: service.description } : { title: 'Service not found | Qutlas' };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { service: id } = await params;
  const service = services.find((item) => item.id === id);
  if (!service) notFound();

  return <ContentPage eyebrow="Services" title={service.name} description={service.description} action={`Request ${service.name.toLowerCase()}`} actionHref={`/project?startMode=${service.kind === 'project' ? 'idea' : 'description'}`} sections={[
    { title: 'Describe the job', body: 'Start with a material, drawing, list, or description. Add dimensions, quantities, and location where you know them.' },
    { title: 'Review before quotation', body: 'Qutlas checks the requested scope and relevant supply or workshop availability before a price or timing is confirmed.' },
    { title: 'Move forward with an agreed scope', body: 'Review the written quotation and confirmed details before approving the work. No price or production slot is assumed at the enquiry stage.' },
  ]} />;
}