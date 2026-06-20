import { useState, useCallback } from 'react';
import { useAssemblyStore } from '@/lib/store/assemblyStore';

export function useCalculatorBridge() {
  const selectedId = useAssemblyStore((s) => s.selectedId);
  const component = useAssemblyStore((s) => s.selectedId ? s.components[s.selectedId] : null);
  const updateMetadata = useAssemblyStore((s) => s.updateMetadata);

  const [isOpen, setIsOpen] = useState(false);
  const [calcId, setCalcId] = useState<string>('');
  const [initialInputs, setInitialInputs] = useState<Record<string, string>>({});

  const openBridge = useCallback(() => {
    if (!component) return;

    if (component.type === 'profile') {
      setCalcId('beam-deflection-calc');
      const lengthM = ((component.metadata.length || 200) / 1000).toString();
      const isAl = (component.metadata.material || '').toLowerCase().includes('al');
      const E = isAl ? '6.9e10' : '2.1e11';

      setInitialInputs({
        L: lengthM,
        E: E,
        w: '5000',
        I: '1.28e-5'
      });
    } else if (component.type === 'bolt') {
      setCalcId('bolt-torque-calc');
      setInitialInputs({
        d: '0.012',
        F: '40000',
        K: '0.15'
      });
    } else {
      // Bracket / other types map to shaft diameter
      setCalcId('shaft-diameter-calc');
      setInitialInputs({
        T: '100',
        tau: '50e6'
      });
    }

    setIsOpen(true);
  }, [component]);

  const saveResult = useCallback((resultStr: string) => {
    if (selectedId) {
      updateMetadata(selectedId, {
        ...({ calculationResult: resultStr } as any)
      });
    }
    setIsOpen(false);
  }, [selectedId, updateMetadata]);

  return {
    isOpen,
    setIsOpen,
    calcId,
    initialInputs,
    openBridge,
    saveResult,
    selectedComponent: component
  };
}
