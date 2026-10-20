import ProjectConfigurator from '../ProjectConfigurator';

type ProjectPageProps = {
  searchParams: Promise<{ material?: string; startMode?: string }>;
};

export default async function ProjectPage({ searchParams }: ProjectPageProps) {
  const { material = 'unsure', startMode = 'description' } = await searchParams;
  return <ProjectConfigurator initialMaterial={material} initialStartMode={startMode} />;
}