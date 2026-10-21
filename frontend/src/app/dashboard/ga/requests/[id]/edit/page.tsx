import GoodsRequestEditWrapper from '@/components/ga/GoodsRequestEditWrapper';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GoodsRequestEditWrapper id={id} />;
}
