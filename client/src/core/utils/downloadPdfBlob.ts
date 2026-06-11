import apiClient from '../api/apiClient';

export async function downloadPdfBlob(
  url: string,
  filename: string,
  params?: Record<string, string>,
): Promise<void> {
  const response = await apiClient.get(url, { params, responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
