import { create } from "zustand";

export const useUIStore = create((set) => ({
    mobileMenuOpen: false,
    loading: false,

    toggleMenu: () =>
        set((state) => ({
            mobileMenuOpen: !state.mobileMenuOpen,
        })),

    setLoading: (value) =>
        set({
            loading: value,
        }),
}));