import AttendanceReportsPage from '@/components/attendance/AttendanceReportsPage';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AttendanceReportsPage employeeId={Number(id)} />; }
