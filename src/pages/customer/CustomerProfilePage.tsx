import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';

export default function CustomerProfilePage() {
  const user = useAuthStore((s) => s.user);
  return (
    <div>
      <PageHeader title="Profile" />
      <Card className="max-w-lg">
        <CardHeader title="Account details" />
        <CardBody className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Name</span>
            <span className="text-text">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Email</span>
            <span className="text-text">{user?.email}</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
