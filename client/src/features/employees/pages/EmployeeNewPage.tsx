import { PageHeader } from '../../../core/components/PageHeader';

export function EmployeeNewPage() {
  return (
    <div>
      <PageHeader title="Add Employee" breadcrumbs={[{ label: 'Employees', path: '/employees' }, { label: 'New' }]} />
      <p>Add employee form</p>
    </div>
  );
}