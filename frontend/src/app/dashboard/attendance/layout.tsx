import AttendanceWorkspace from '@/components/attendance/AttendanceWorkspace';

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return <AttendanceWorkspace>{children}</AttendanceWorkspace>;
}
