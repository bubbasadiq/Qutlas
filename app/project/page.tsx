import ProjectConfigurator from '../ProjectConfigurator';

type ProjectPageProps = {
  searchParams: Promise<{ material?: string; startMode?: string; item?: string }>;
};

export default async function ProjectPage({ searchParams }: ProjectPageProps) {
  const { material = 'unsure', startMode = 'description', item = '' } = await searchParams;
  return <ProjectConfigurator initialMaterial={material} initialStartMode={startMode} initialItemName={item} />;
}