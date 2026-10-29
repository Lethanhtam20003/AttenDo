'use client';

import { useCallback, useState } from 'react';
import type { CustomFieldConfig } from '@/types/database';

export interface HostSetupCustomField extends CustomFieldConfig {
  id: string;
  fixed: boolean;
}

const INITIAL_FIELDS: HostSetupCustomField[] = [
  { id: '1', key: 'full_name', label: 'Họ và tên', type: 'text', required: true, fixed: true },
  { id: '2', key: 'phone', label: 'Số điện thoại', type: 'tel', required: true, fixed: false },
  { id: '3', key: 'don_vi', label: 'Đơn vị công tác', type: 'text', required: false, fixed: false },
];

export function useCustomFields() {
  const [fields, setFields] = useState<HostSetupCustomField[]>(INITIAL_FIELDS);

  const addField = useCallback(() => {
    const id = Date.now().toString();
    setFields((currentFields) => [
      ...currentFields,
      {
        id,
        key: `field_${id}`,
        label: 'Thông tin mới',
        type: 'text',
        required: false,
        fixed: false,
      },
    ]);
  }, []);

  const removeField = useCallback((id: string) => {
    setFields((currentFields) => currentFields.filter((field) => field.id !== id));
  }, []);

  const updateFieldLabel = useCallback((id: string, label: string) => {
    setFields((currentFields) =>
      currentFields.map((field) => {
        if (field.id !== id) return field;
        const key = field.fixed
          ? field.key
          : label.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || `field_${id}`;
        return { ...field, label, key };
      })
    );
  }, []);

  const updateFieldType = useCallback((id: string, type: 'text' | 'tel' | 'number') => {
    setFields((currentFields) =>
      currentFields.map((field) => (field.id === id ? { ...field, type } : field))
    );
  }, []);

  const updateFieldRequired = useCallback((id: string, required: boolean) => {
    setFields((currentFields) =>
      currentFields.map((field) => (field.id === id ? { ...field, required } : field))
    );
  }, []);

  return { fields, addField, removeField, updateFieldLabel, updateFieldType, updateFieldRequired };
}
