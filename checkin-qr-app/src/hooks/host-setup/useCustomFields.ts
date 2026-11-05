'use client';

import { useCallback } from 'react';
import type { CustomFieldConfig } from '@/types/database';
import { useHostSetupStore } from '@/stores/host-setup-store';

export interface HostSetupCustomField extends CustomFieldConfig {
  id: string;
  fixed: boolean;
}

export function useCustomFields() {
  const fields = useHostSetupStore((state) => state.fields);
  const updateFields = useHostSetupStore((state) => state.setFields);

  const addField = useCallback(() => {
    const id = Date.now().toString();
    updateFields((currentFields) => [
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
  }, [updateFields]);

  const removeField = useCallback((id: string) => {
    updateFields((currentFields) => currentFields.filter((field) => field.id !== id));
  }, [updateFields]);

  const reorderField = useCallback((sourceId: string, targetId: string, placeAfter: boolean) => {
    updateFields((currentFields) => {
      const sourceIndex = currentFields.findIndex((field) => field.id === sourceId);
      const targetIndex = currentFields.findIndex((field) => field.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1 || sourceId === targetId) return currentFields;

      const reorderedFields = [...currentFields];
      const [movedField] = reorderedFields.splice(sourceIndex, 1);
      const adjustedTargetIndex = reorderedFields.findIndex((field) => field.id === targetId);
      reorderedFields.splice(adjustedTargetIndex + (placeAfter ? 1 : 0), 0, movedField);
      return reorderedFields;
    });
  }, [updateFields]);

  const updateFieldLabel = useCallback((id: string, label: string) => {
    updateFields((currentFields) =>
      currentFields.map((field) => {
        if (field.id !== id) return field;
        const key = field.fixed
          ? field.key
          : label.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || `field_${id}`;
        return { ...field, label, key };
      })
    );
  }, [updateFields]);

  const updateFieldType = useCallback((id: string, type: 'text' | 'tel' | 'number') => {
    updateFields((currentFields) =>
      currentFields.map((field) => (field.id === id ? { ...field, type } : field))
    );
  }, [updateFields]);

  const updateFieldRequired = useCallback((id: string, required: boolean) => {
    updateFields((currentFields) =>
      currentFields.map((field) => (field.id === id ? { ...field, required } : field))
    );
  }, [updateFields]);

  return { fields, addField, removeField, reorderField, updateFieldLabel, updateFieldType, updateFieldRequired };
}
