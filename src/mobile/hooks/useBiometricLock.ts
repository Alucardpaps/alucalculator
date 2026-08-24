'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMobileStore } from '@/mobile/store/mobileStore';

export function useBiometricLock() {
  const { biometricLockEnabled, biometricUnlocked, setBiometricUnlocked } = useMobileStore();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        .then(setIsAvailable)
        .catch(() => setIsAvailable(false));
    }
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    if (!biometricLockEnabled) {
      setBiometricUnlocked(true);
      return true;
    }
    setIsChecking(true);
    try {
      if (window.PublicKeyCredential && isAvailable) {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'required',
            rpId: window.location.hostname || 'localhost',
          },
        } as CredentialRequestOptions);
        setBiometricUnlocked(true);
        return true;
      }
      const pin = window.prompt('Enter PIN to unlock (demo):');
      const ok = pin === '1234' || pin === '';
      setBiometricUnlocked(ok);
      return ok;
    } catch {
      setBiometricUnlocked(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [biometricLockEnabled, isAvailable, setBiometricUnlocked]);

  const lock = useCallback(() => {
    if (biometricLockEnabled) setBiometricUnlocked(false);
  }, [biometricLockEnabled, setBiometricUnlocked]);

  return {
    isAvailable,
    isChecking,
    isLocked: biometricLockEnabled && !biometricUnlocked,
    unlock,
    lock,
  };
}
