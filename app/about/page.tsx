import ContentPage from '../ContentPage';

export const metadata = {
  title: 'About Qutlas | Materials and manufacturing',
  description: 'Qutlas brings material sourcing, component development and custom making into one clear starting point.',
};

export default function AboutPage() {
  return <ContentPage eyebrow="About Qutlas" title="Materials and making, together." description="Qutlas helps customers organise material supply and custom manufacturing requirements through a single project request." action="Start a project" sections={[
    { title: 'One place to explain the job', body: 'Customers can begin with steel, wood, granite, a drawing, or a straightforward description of what they need.' },
    { title: 'Built around review and confirmation', body: 'Material availability, process, price, and timing must be confirmed for each requirement before an order is accepted.' },
    { title: 'Built to connect ideas and making', body: 'Qutlas is designed for builders, engineers, designers, makers and organisations. Availability, delivery and production coverage are confirmed for each request.' },
  ]} />;
}