import { App } from 'antd';

export function useNotify() {
  const { message } = App.useApp();
  const success = (content: string) => message.success(content);
  const error = (content: string) => message.error(content);
  const warning = (content: string) => message.warning(content);
  const info = (content: string) => message.info(content);
  return { success, error, warning, info };
}

export default useNotify;