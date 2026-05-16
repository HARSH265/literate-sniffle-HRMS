import { PageHeader } from '../../../core/components/PageHeader';

export function EmployeeEditPage() {
  return (
    <div>
      <PageHeader title="Edit Employee" breadcrumbs={[{ label: 'Employees', path: '/employees' }, { label: 'Edit' }]} />
      <p>Edit employee form</p>
    </div>
  );
}