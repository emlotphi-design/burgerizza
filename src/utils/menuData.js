export const CATEGORIES = [
  {
    id: 'burger',
    emoji: '🍔',
    title: 'BURGER',
    subtitle: 'Juicy & Bold',
    path: '/burger',
  },
  {
    id: 'pizza',
    emoji: '🍕',
    title: 'PIZZA',
    subtitle: 'Crispy & Creative',
    path: '/pizza',
  },
  {
    id: 'dessert',
    emoji: '🍰',
    title: 'DESSERT',
    subtitle: 'Sweet & Dreamy',
    path: '/dessert',
  },
  {
    id: 'drinks',
    emoji: '🥤',
    title: 'DRINKS',
    subtitle: 'Fresh & Fizzy',
    path: '/drinks',
  },
];

/**
 * Nutrition fields (weight/calories) — added for the Nutrition & Calories
 * system. No verified nutrition spec has been provided for these prepared
 * menu items yet, so `calories: 0` / `weight: null` means "not yet supplied"
 * (never estimated). Editable from the admin Ingredients page.
 */
export const MENU_ITEMS = {
  burger: [
    {
      id: 'b1',
      name: 'Classic Smash Burger',
      description: 'Double smash patty, American cheese, secret sauce, brioche bun',
      price: 8.90,
      emoji: '🍔',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'b2',
      name: 'BBQ Bacon Burger',
      description: 'Crispy smoked bacon, smoky BBQ glaze, caramelised onions',
      price: 10.50,
      emoji: '🥓',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'b3',
      name: 'Double Patty Monster',
      description: 'Two juicy patties, double cheddar, pickles, special sauce',
      price: 12.90,
      emoji: '🍔',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'b4',
      name: 'Crispy Chicken Burger',
      description: 'Golden fried chicken thigh, ranch sauce, coleslaw, dill pickles',
      price: 9.50,
      emoji: '🐔',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'b5',
      name: 'Veggie Delight',
      description: 'Black bean & quinoa patty, avocado cream, fresh salsa',
      price: 8.20,
      emoji: '🥦',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'b6',
      name: 'Mushroom Swiss',
      description: 'Sautéed wild mushrooms, melted Swiss cheese, garlic aioli',
      price: 9.80,
      emoji: '🍄',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
  ],
  pizza: [
    {
      id: 'p1',
      name: 'Margherita Classica',
      description: 'San Marzano tomato, fresh buffalo mozzarella, basil, olive oil',
      price: 9.90,
      emoji: '🍕',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'p2',
      name: 'Pepperoni Special',
      description: 'Double pepperoni, chilli oil, smoked mozzarella, oregano',
      price: 12.50,
      emoji: '🌶️',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'p3',
      name: 'BBQ Chicken',
      description: 'Grilled chicken, smoky BBQ sauce, caramelised red onion, cheddar',
      price: 13.90,
      emoji: '🍗',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'p4',
      name: 'Veggie Supreme',
      description: 'Seasonal roasted vegetables, pesto base, feta, sun-dried tomato',
      price: 11.50,
      emoji: '🥗',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'p5',
      name: 'Truffle Mushroom',
      description: 'Wild mushrooms, truffle cream, Parmesan shavings, thyme',
      price: 14.50,
      emoji: '🍄',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'p6',
      name: 'Spicy Inferno',
      description: 'Nduja sausage, jalapeños, fresh chilli, honey drizzle',
      price: 12.90,
      emoji: '🔥',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
  ],
  dessert: [
    {
      id: 'd1',
      name: 'Churros & Chocolate',
      description: 'Warm cinnamon churros with rich dark chocolate dipping sauce',
      price: 5.50,
      emoji: '🍩',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'd2',
      name: 'Lava Cake',
      description: 'Molten chocolate centre, vanilla bean ice cream, caramel drizzle',
      price: 6.90,
      emoji: '🍫',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'd3',
      name: 'Tiramisu',
      description: 'Classic Italian, espresso soaked ladyfingers, mascarpone cream',
      price: 5.90,
      emoji: '☕',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'd4',
      name: 'Ice Cream Float',
      description: 'Two scoops vanilla, root beer, crushed wafer, caramel sauce',
      price: 4.50,
      emoji: '🍦',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'd5',
      name: 'Glazed Donuts ×3',
      description: 'Fresh-glazed donuts with seasonal flavour rotation daily',
      price: 4.90,
      emoji: '🍩',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'd6',
      name: 'Cheesecake Slice',
      description: 'New York style baked, berry compote, butter biscuit base',
      price: 5.90,
      emoji: '🍰',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
  ],
  drinks: [
    {
      id: 'dr1',
      name: 'Coca-Cola',
      description: 'Ice cold classic or zero sugar, served with fresh ice',
      price: 2.90,
      emoji: '🥤',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'dr2',
      name: 'Mango Lemonade',
      description: 'Fresh-pressed lemon juice, real mango purée, mint sprig',
      price: 3.50,
      emoji: '🍋',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'dr3',
      name: 'Fresh Orange Juice',
      description: 'Squeezed to order, zero added sugar, pulp on request',
      price: 3.90,
      emoji: '🍊',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'dr4',
      name: 'Watermelon Slush',
      description: 'Blended fresh watermelon, mint leaves, fresh lime squeeze',
      price: 4.20,
      emoji: '🍉',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'dr5',
      name: 'Iced Coffee',
      description: 'Cold brew concentrate, oat milk, house vanilla syrup',
      price: 4.50,
      emoji: '☕',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
    {
      id: 'dr6',
      name: 'Milkshake',
      description: 'Choose: Vanilla · Chocolate · Strawberry · Salted Caramel',
      price: 5.50,
      emoji: '🥛',
      weight: null, calories: 0, protein: null, carbs: null, fat: null,
    },
  ],
};

/** O(1) lookup: item id → menu item (across all categories) */
export const MENU_ITEMS_BY_ID = Object.fromEntries(
  Object.values(MENU_ITEMS).flat().map(item => [item.id, item])
);
