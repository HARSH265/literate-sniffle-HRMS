import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { DataTable } from '../DataTable';

interface TestRecord {
  id: string;
  name: string;
  age: number;
}

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age' },
];

const dataSource: TestRecord[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
];

describe('DataTable', () => {
  it('renders data rows', () => {
    render(<DataTable columns={columns} dataSource={dataSource} rowKey="id" />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('shows skeleton when loading with no data', () => {
    const { container } = render(<DataTable columns={columns} loading dataSource={[]} rowKey="id" />);

    const skeleton = container.querySelector('.ant-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('does not show skeleton when loading with existing data', () => {
    const { container } = render(
      <DataTable columns={columns} loading dataSource={dataSource} rowKey="id" />,
    );

    const skeleton = container.querySelector('.ant-skeleton');
    expect(skeleton).not.toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<DataTable columns={columns} dataSource={dataSource} rowKey="id" />);

    const headers = screen.getAllByText('Name');
    expect(headers.length).toBeGreaterThanOrEqual(1);
    const ageHeaders = screen.getAllByText('Age');
    expect(ageHeaders.length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty data source', () => {
    const { container } = render(<DataTable columns={columns} dataSource={[]} rowKey="id" />);

    expect(container.querySelector('.ant-table-empty')).toBeInTheDocument();
  });
});
