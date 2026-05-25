import { create } from "zustand";

export const usePizzaStore = create((set) => ({
    pizzas: [],

    addPizza: (pizza) =>
        set((state) => ({
            pizzas: [...state.pizzas, pizza],
        })),

    removePizza: (id) =>
        set((state) => ({
            pizzas: state.pizzas.filter((pizza) => pizza.id !== id),
        })),

    clearPizzas: () =>
        set({
            pizzas: [],
        }),
}));