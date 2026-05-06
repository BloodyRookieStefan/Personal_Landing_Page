import React from 'react';
import { ICON_PALETTE } from '../../../domain/icons/palette';
import { IconDisplay } from './IconDisplay';
import styles from './IconPicker.module.css';

interface IconPickerProps {
  value: string;
  onChange: (iconId: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className={styles.grid} role="radiogroup" aria-label="Icon selection">
      {ICON_PALETTE.map(icon => (
        <button
          key={icon.id}
          type="button"
          role="radio"
          aria-checked={value === icon.id}
          aria-label={icon.label}
          title={icon.label}
          className={`${styles.item} ${value === icon.id ? styles.selected : ''}`}
          onClick={() => onChange(icon.id)}
        >
          <IconDisplay iconId={icon.id} size={20} />
        </button>
      ))}
    </div>
  );
}
