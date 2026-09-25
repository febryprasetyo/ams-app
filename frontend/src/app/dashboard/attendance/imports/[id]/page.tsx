import AttendanceImportsPage from '@/components/attendance/AttendanceImportsPage';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AttendanceImportsPage batchId={Number(id)} />; }
