import { create } from 'zustand';

/* In dev mode the code is always 123456 so QA is instant */
const IS_DEV  = import.meta.env.DEV;
const DEV_CODE = '123456';

function generateCode() {
  return IS_DEV
    ? DEV_CODE
    : String(Math.floor(100000 + Math.random() * 900000));
}

/* Module-level interval — not UI state, no reason to put it in the store */
let _resendInterval = null;

export const useCheckoutStore = create((set, get) => ({
  /* ── OTP ─────────────────────────────────────────────── */
  otpCode:     '',
  otpSent:     false,
  otpSending:  false,
  otpVerified: false,
  otpError:    '',
  resendTimer: 0,

  /* Simulate a 1-second send delay, then surface the code */
  sendOtp() {
    set({ otpSending: true, otpError: '', otpSent: false, otpVerified: false });

    setTimeout(() => {
      const code = generateCode();

      clearInterval(_resendInterval);
      set({ otpCode: code, otpSent: true, otpSending: false, resendTimer: 60 });

      _resendInterval = setInterval(() => {
        const t = get().resendTimer;
        if (t <= 1) {
          clearInterval(_resendInterval);
          set({ resendTimer: 0 });
        } else {
          set({ resendTimer: t - 1 });
        }
      }, 1000);
    }, 1000);
  },

  /* Returns true on success so the caller can advance the step */
  verifyOtp(input) {
    if (input === get().otpCode) {
      set({ otpVerified: true, otpError: '' });
      return true;
    }
    set({ otpError: 'Falscher Code. Bitte erneut versuchen.' });
    return false;
  },

  /* Call on checkout unmount / order complete to avoid stale state */
  resetOtp() {
    clearInterval(_resendInterval);
    set({
      otpCode:     '',
      otpSent:     false,
      otpSending:  false,
      otpVerified: false,
      otpError:    '',
      resendTimer: 0,
    });
  },
}));
