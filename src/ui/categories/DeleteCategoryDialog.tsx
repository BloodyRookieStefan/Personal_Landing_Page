import React from 'react';
import { ConfirmDialog } from '../shared/dialogs/ConfirmDialog';
import { t } from '../../services/i18n/i18n-service';
import type { Category } from '../../domain/categories/model';

interface DeleteCategoryDialogProps {
  category: Category;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteCategoryDialog({
  category,
  onClose,
  onConfirm,
}: DeleteCategoryDialogProps) {
  return (
    <ConfirmDialog
      title={t('categories.deleteConfirm')}
      message={`"${category.name}" – ${t('categories.deleteMessage')}`}
      confirmLabel={t('common.delete')}
      onConfirm={onConfirm}
      onCancel={onClose}
      danger
    />
  );
}
