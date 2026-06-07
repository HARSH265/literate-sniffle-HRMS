import { render, screen } from '../../../../test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { EssDocumentsPage } from '../EssDocumentsPage';

const mockDocuments = { success: true, data: [] };

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['ess', 'documents'], mockDocuments);
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConfigProvider>
          <AntApp>
            <EssDocumentsPage />
          </AntApp>
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EssDocumentsPage', () => {
  it('renders page title', () => {
    renderPage();
    expect(screen.getByText('My Documents')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    renderPage();
    expect(screen.getByText('No documents uploaded yet')).toBeInTheDocument();
  });
});
