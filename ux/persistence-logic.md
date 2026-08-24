# User Data Persistence Logic

## Overview

Use `localStorage` to preserve user state across sessions. If a user accidentally closes the tab, restore their working context.

---

## Stored Data

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `alucalc_alloy` | string | Last selected alloy ID | `"6061"` |
| `alucalc_unit_price` | number | Last entered unit price per kg | `0` |
| `alucalc_unit_system` | string | Metric or Imperial | `"metric"` |
| `alucalc_last_shape` | string | Last used shape type | `"plate"` |
| `alucalc_last_dimensions` | object | Last entered dimensions | `{}` |
| `alucalc_cutting_method` | string | Last selected cutting method | `"laser_fiber"` |
| `alucalc_theme` | string | Light or dark mode | `"system"` |

---

## Implementation

### Save Function
```typescript
export function saveUserPreference<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`alucalc_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage unavailable:', e);
  }
}
```

### Load Function
```typescript
export function loadUserPreference<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(`alucalc_${key}`);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}
```

### React Hook
```typescript
export function usePersistedState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => 
    loadUserPreference(key, defaultValue)
  );

  useEffect(() => {
    saveUserPreference(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
```

---

## Usage in Components

```tsx
// MaterialSelector.tsx
const [selectedAlloy, setSelectedAlloy] = usePersistedState('alloy', '6061');

// UnitToggle.tsx
const [unitSystem, setUnitSystem] = usePersistedState('unit_system', 'metric');

// CostCalculator.tsx
const [unitPrice, setUnitPrice] = usePersistedState('unit_price', 0);
```

---

## Session Restoration Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. User opens AluCalculator                            │
│  2. Check localStorage for saved preferences            │
│  3. Hydrate alloy selector with saved alloy             │
│  4. Restore unit system (metric/imperial)               │
│  5. Restore last dimensions if same shape selected      │
│  6. Apply saved theme preference                        │
│  7. User continues from where they left off             │
└─────────────────────────────────────────────────────────┘
```

---

## Privacy & Security

| Concern | Mitigation |
|---------|------------|
| Sensitive data | Never store project names, client info, or proprietary dimensions |
| Storage quota | Keep data minimal (<10KB total) |
| GDPR | No personal data stored, no consent required |
| Cross-tab sync | Use `storage` event listener for multi-tab consistency |

---

## Clear User Data

Provide a "Reset Preferences" option:

```typescript
export function clearAllPreferences(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('alucalc_'));
  keys.forEach(key => localStorage.removeItem(key));
}
```

---

## Future: IndexedDB for Projects

For the upcoming "Project List" feature, migrate to IndexedDB:
- Larger storage capacity (>50MB)
- Structured data with indexes
- Transaction support for data integrity
- Supports saving full calculation history
