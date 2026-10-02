import EmployeeFormPage from '@/components/master/EmployeeFormPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeFormPage mode="edit" employeeId={Number(id)} basePath="/dashboard/attendance/master/employees" />;
}
