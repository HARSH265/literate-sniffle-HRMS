import { useState, useCallback } from 'react';
import apiClient from '../api/apiClient';
import useNotify from './useNotify';

interface UploadOptions {
  onProgress?: (percent: number) => void;
}

export function useFileUpload(options?: UploadOptions) {
  const [uploading, setUploading] = useState(false);
  const notify = useNotify();

  const upload = useCallback(async (file: File, endpoint: string): Promise<string | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && options?.onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress(percent);
          }
        },
      });

      return response.data.data.url;
    } catch {
      notify.error('File upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  }, [notify, options]);

  return { upload, uploading };
}

export default useFileUpload;