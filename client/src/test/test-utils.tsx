import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { ConfigProvider, App as AntApp } from 'antd';

function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
