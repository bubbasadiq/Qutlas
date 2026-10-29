import ContentPage from '../ContentPage';

export const metadata = {
  title: 'About Qutlas | Materials and manufacturing',
  description: 'Qutlas brings material sourcing and custom manufacturing requests together for customers in Nigeria.',
};

export default function AboutPage() {
  return <ContentPage eyebrow="About Qutlas" title="Materials and making, together." description="Qutlas helps customers organise material supply and custom manufacturing requirements through a single project request." action="Start a project" sections={[
    { title: 'One place to explain the job', body: 'Customers can begin with steel, wood, granite, a drawing, or a straightforward description of what they need.' },
    { title: 'Built around review and confirmation', body: 'Material availability, process, price, and timing must be confirmed for each requirement before an order is accepted.' },
    { title: 'Serving projects in Nigeria', body: 'The project flow is designed for Nigerian customers, using metric dimensions and project locations suited to local enquiries.' },
  ]} />;
}