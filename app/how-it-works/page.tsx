import ContentPage from '../ContentPage';

export const metadata = {
  title: 'How it works | Qutlas',
  description: 'How to prepare a materials or custom manufacturing request with Qutlas.',
};

export default function HowItWorksPage() {
  return <ContentPage eyebrow="How it works" title="From requirement to quotation." description="Start with a material, a drawing, or a short description. Add the details you know, then Qutlas can review the scope before a price or timing is confirmed." action="Start a project" sections={[
    { title: '1. Tell us what you need', body: 'Choose steel, wood, granite, or not sure yet. Select material supply, cut-to-size work, a component, an assembly, or project sourcing.' },
    { title: '2. Add useful details', body: 'Describe the requirement, enter relevant dimensions and quantities, add the project location, and include supporting files if you have them.' },
    { title: '3. Review your request', body: 'Check the material, specifications, contact details, and destination before preparing the quote request.' },
    { title: '4. Send the request for review', body: 'The current site prepares a text summary and email draft. The request is not received until you send the email. Qutlas must confirm scope, price, supply, and timing before an order is accepted.' },
  ]} />;
}