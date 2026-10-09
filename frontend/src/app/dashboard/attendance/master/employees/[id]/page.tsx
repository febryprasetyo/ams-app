import EmployeeDetailPage from '@/components/master/EmployeeDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeDetailPage employeeId={Number(id)} basePath="/dashboard/attendance/master/employees" />;
}
