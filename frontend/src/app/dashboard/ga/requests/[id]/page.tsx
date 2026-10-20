import GoodsRequestDetail from '@/components/ga/GoodsRequestDetail';
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <GoodsRequestDetail key={id} id={id} saved={query.saved === '1'} />;
}
