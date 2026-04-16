// ── Types ────────────────────────────────────────────────────────────────────
export type Cocktail = {
  nom: string;
  categorie: string;
  cout: number;
  prixHH: number;
  prixPlein: number;
};

export type Ingredient = {
  item: string;
  qty: number; // fraction de l'unité DB
};

// ── Couleurs catégories ───────────────────────────────────────────────────────
export const CATEGORIE_COLORS: Record<string, string> = {
  "Havana Club":     "#f59e0b",
  "Spritz":          "#f97316",
  "Classic Indiana": "#6366f1",
  "Absolut":         "#3b82f6",
  "Frozen":          "#06b6d4",
  "Indiana Mix":     "#8b5cf6",
  "XXL":             "#dc2626",
  "Mocktails":       "#10b981",
  "Smoothies":       "#ec4899",
  "Hot Drink":       "#78716c",
  "Bières Boost":    "#84cc16",
};

// ── Cocktails (données fiches techniques Indiana Café 2026) ──────────────────
// Coûts calculés depuis les prix fournisseurs DB
// ⚠️ Cuba Libre, Tennessee Lemonade, Long Island : BIB surestimés (vérifier DB)
export const COCKTAILS: Cocktail[] = [
  // HAVANA CLUB
  { nom: "Classic Mojito",      categorie: "Havana Club",     cout: 1.11, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Cuba Libre",          categorie: "Havana Club",     cout: 2.25, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Mojito Indiana",      categorie: "Havana Club",     cout: 1.42, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Piña Colada",         categorie: "Havana Club",     cout: 1.79, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Planteur",            categorie: "Havana Club",     cout: 0.92, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Maï Taï",             categorie: "Havana Club",     cout: 1.28, prixHH: 6.9,  prixPlein: 10 },

  // SPRITZ
  { nom: "Apérol Spritz",       categorie: "Spritz",          cout: 1.79, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Hugo Spritz",         categorie: "Spritz",          cout: 1.86, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Limoncello Spritz",   categorie: "Spritz",          cout: 2.11, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Bellini Spritz",      categorie: "Spritz",          cout: 1.81, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Sarti Rosa Spritz",   categorie: "Spritz",          cout: 2.56, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Italicus Spritz",     categorie: "Spritz",          cout: 3.46, prixHH: 6.9,  prixPlein: 10 },

  // CLASSIC INDIANA
  { nom: "Margarita",           categorie: "Classic Indiana", cout: 1.56, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Caïpirinha",          categorie: "Classic Indiana", cout: 1.29, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Strawberry Marga",    categorie: "Classic Indiana", cout: 1.71, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Maracuja Caïpi",      categorie: "Classic Indiana", cout: 1.45, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Pink Paloma",         categorie: "Classic Indiana", cout: 1.29, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Mexican Sunrise",     categorie: "Classic Indiana", cout: 1.32, prixHH: 6.9,  prixPlein: 10 },

  // ABSOLUT
  { nom: "Moscow Mule",         categorie: "Absolut",         cout: 1.57, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Cosmopolitan",        categorie: "Absolut",         cout: 1.26, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Sex on the Beach",    categorie: "Absolut",         cout: 1.39, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Berry Caïpiroska",    categorie: "Absolut",         cout: 1.09, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Pornstar Indiana",    categorie: "Absolut",         cout: 1.52, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Expresso Martini",    categorie: "Absolut",         cout: 1.42, prixHH: 6.9,  prixPlein: 10 },

  // FROZEN
  { nom: "Frozen Marga",        categorie: "Frozen",          cout: 1.89, prixHH: 7.5,  prixPlein: 10 },
  { nom: "Exotic Marga",        categorie: "Frozen",          cout: 1.77, prixHH: 7.5,  prixPlein: 10 },
  { nom: "Frozen Red Daïquiri", categorie: "Frozen",          cout: 1.66, prixHH: 7.5,  prixPlein: 10 },
  { nom: "Blue Hawaï",          categorie: "Frozen",          cout: 1.83, prixHH: 7.5,  prixPlein: 10 },

  // INDIANA MIX
  { nom: "London Gin Tonic",    categorie: "Indiana Mix",     cout: 3.42, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Pink Fizz",           categorie: "Indiana Mix",     cout: 1.18, prixHH: 6.9,  prixPlein: 10 },
  { nom: "American Mule",       categorie: "Indiana Mix",     cout: 1.85, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Tennessee Lemonade",  categorie: "Indiana Mix",     cout: 2.45, prixHH: 6.9,  prixPlein: 10 },

  // XXL
  { nom: "Sangria",             categorie: "XXL",             cout: 2.38, prixHH: 10,   prixPlein: 10 },
  { nom: "XL Mojito",           categorie: "XXL",             cout: 1.75, prixHH: 10,   prixPlein: 10 },
  { nom: "XL Long Island",      categorie: "XXL",             cout: 4.14, prixHH: 10,   prixPlein: 10 },
  { nom: "XL Electric Blue",    categorie: "XXL",             cout: 3.77, prixHH: 10,   prixPlein: 10 },
  { nom: "Loco Red Bull",       categorie: "XXL",             cout: 2.72, prixHH: 10,   prixPlein: 10 },
  { nom: "XL Despejito",        categorie: "XXL",             cout: 1.58, prixHH: 10,   prixPlein: 10 },

  // MOCKTAILS
  { nom: "Virgin Spritz",       categorie: "Mocktails",       cout: 1.31, prixHH: 6.9,  prixPlein: 6.9 },
  { nom: "Summer Sangria",      categorie: "Mocktails",       cout: 2.68, prixHH: 6.9,  prixPlein: 6.9 },
  { nom: "Tiki Mule",           categorie: "Mocktails",       cout: 1.55, prixHH: 6.9,  prixPlein: 6.9 },
  { nom: "Miami Sunset",        categorie: "Mocktails",       cout: 1.09, prixHH: 6.9,  prixPlein: 6.9 },
  { nom: "Colorado Sunrise",    categorie: "Mocktails",       cout: 1.01, prixHH: 6.9,  prixPlein: 6.9 },
  { nom: "Virgin Colada",       categorie: "Mocktails",       cout: 1.94, prixHH: 6.9,  prixPlein: 6.9 },
  { nom: "Virgin Mojito",       categorie: "Mocktails",       cout: 0.72, prixHH: 6.9,  prixPlein: 6.9 },

  // SMOOTHIES & MILKSHAKES
  { nom: "Tropical Smoothie",          categorie: "Smoothies", cout: 1.35, prixHH: 7.5, prixPlein: 7.5 },
  { nom: "Red Fruits Smoothie",        categorie: "Smoothies", cout: 1.35, prixHH: 7.5, prixPlein: 7.5 },
  { nom: "Coco Lada Smoothie",         categorie: "Smoothies", cout: 1.66, prixHH: 7.5, prixPlein: 7.5 },
  { nom: "Vanilla Berry Milkshake",    categorie: "Smoothies", cout: 1.56, prixHH: 7.5, prixPlein: 7.5 },
  { nom: "Choco Daim Milkshake",       categorie: "Smoothies", cout: 1.39, prixHH: 7.5, prixPlein: 7.5 },
  { nom: "Cookie Oreo Milkshake",      categorie: "Smoothies", cout: 1.57, prixHH: 7.5, prixPlein: 7.5 },
  { nom: "Caramel Speculoos Milkshake",categorie: "Smoothies", cout: 1.79, prixHH: 7.5, prixPlein: 7.5 },

  // HOT DRINK
  { nom: "Moca Viennois",       categorie: "Hot Drink", cout: 0.57, prixHH: 9,  prixPlein: 9 },
  { nom: "Café Affogato",       categorie: "Hot Drink", cout: 0.70, prixHH: 9,  prixPlein: 9 },
  { nom: "Cookie Irish Coffee", categorie: "Hot Drink", cout: 1.57, prixHH: 9,  prixPlein: 9 },
  { nom: "Cappuccino Frappé",   categorie: "Hot Drink", cout: 1.27, prixHH: 9,  prixPlein: 9 },

  // BIÈRES BOOST + BRUNCH
  { nom: "Bière Boost Curaçao", categorie: "Bières Boost", cout: 1.03, prixHH: 7,  prixPlein: 7 },
  { nom: "Bière Boost Picon",   categorie: "Bières Boost", cout: 0.95, prixHH: 7,  prixPlein: 7 },
  { nom: "Bière Boost Apérol",  categorie: "Bières Boost", cout: 1.03, prixHH: 7,  prixPlein: 7 },
  { nom: "Mimosa",              categorie: "Bières Boost", cout: 1.78, prixHH: 9,  prixPlein: 9 },
  { nom: "Bloody Mary",         categorie: "Bières Boost", cout: 1.28, prixHH: 9,  prixPlein: 9 },
];

// ── Recettes (pour calculateur de stock) ─────────────────────────────────────
// qty = fraction de l'unité DB. Ex: bouteille 100cl → 4cl = 0.04
// Les mix maison sont décomposés en ingrédients principaux
export const RECIPES: Record<string, Ingredient[]> = {
  // HAVANA CLUB
  "Classic Mojito": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.034 }, // 3.4cl via Mix Mojito (70cl/205cl × 10cl)
    { item: "Purée Mojito",            qty: 0.049 }, // 4.9cl via Mix Mojito
  ],
  "Cuba Libre": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.04 },
    { item: "BIB Coca-Cola 19L",       qty: 0.12 },
  ],
  "Mojito Indiana": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.034 },
    { item: "Purée Mojito",            qty: 0.049 },
    { item: "Ravifruit Fraise",        qty: 0.02 },
  ],
  "Piña Colada": [
    { item: "Rhum Ambré Havana Añejo", qty: 0.04 },
    { item: "Smoothie Piña Colada",    qty: 0.014 }, // via Mix Colada
    { item: "Crème de Noix de Coco",   qty: 0.042 }, // via Mix Colada
    { item: "Jus d'Ananas",            qty: 0.105 }, // via Mix Colada
  ],
  "Planteur": [
    { item: "Rhum Ambré Havana Añejo", qty: 0.04 },
    { item: "Sirop Falernum Monin",    qty: 1 / 70 },
  ],
  "Maï Taï": [
    { item: "Rhum Ambré Havana Añejo", qty: 0.03 },
    { item: "Curaçao Triple Sec",      qty: 1 / 70 },
    { item: "Mix Maï Tai",             qty: 0.14 },
  ],

  // SPRITZ
  "Apérol Spritz": [
    { item: "Aperol",                  qty: 0.06 },
    { item: "Prosecco DOC Riccadonna", qty: 10 / 75 },
  ],
  "Hugo Spritz": [
    { item: "Liqueur Fleur de Sureau", qty: 6 / 70 },
    { item: "Prosecco DOC Riccadonna", qty: 10 / 75 },
  ],
  "Limoncello Spritz": [
    { item: "Limoncello Rama d'Oro 70CL", qty: 6 / 70 },
    { item: "Prosecco DOC Riccadonna",    qty: 10 / 75 },
  ],
  "Bellini Spritz": [
    { item: "Liqueur de Pêche Marie Brizard", qty: 6 / 100 },
    { item: "Prosecco DOC Riccadonna",         qty: 10 / 75 },
  ],
  "Sarti Rosa Spritz": [
    { item: "Sarti Rosa Italien 70CL",  qty: 6 / 70 },
    { item: "Prosecco DOC Riccadonna",  qty: 10 / 75 },
  ],
  "Italicus Spritz": [
    { item: "Liqueur Bergamote Italicus", qty: 6 / 70 },
    { item: "Prosecco DOC Riccadonna",   qty: 10 / 75 },
  ],

  // CLASSIC INDIANA
  "Margarita": [
    { item: "Tequila Jose Cuervo",  qty: 0.084 }, // via Mix Marga (70cl/200cl × 12cl)
    { item: "Curaçao Triple Sec",   qty: 0.021 }, // via Mix Marga
    { item: "Purée Margarita",      qty: 0.015 }, // via Mix Marga
  ],
  "Caïpirinha": [
    { item: "Cachaca Sagatiba Pura", qty: 6 / 70 },
  ],
  "Strawberry Marga": [
    { item: "Tequila Jose Cuervo", qty: 0.084 },
    { item: "Curaçao Triple Sec",  qty: 0.021 },
    { item: "Ravifruit Fraise",    qty: 0.02 },
  ],
  "Maracuja Caïpi": [
    { item: "Cachaca Sagatiba Pura", qty: 6 / 70 },
    { item: "Purée de Passion",      qty: 0.02 },
  ],
  "Pink Paloma": [
    { item: "Tequila Jose Cuervo",       qty: 4 / 70 },
    { item: "Soda Pamplemousse La French", qty: 0.16 },
  ],
  "Mexican Sunrise": [
    { item: "Tequila Jose Cuervo", qty: 3 / 70 },
    { item: "Curaçao Triple Sec",  qty: 1 / 70 },
    { item: "Mix Planteur des Îles", qty: 0.14 },
  ],

  // ABSOLUT
  "Moscow Mule": [
    { item: "Vodka Absolut Bleue", qty: 0.04 },
    { item: "Ginger Beer",         qty: 10 / 33 },
  ],
  "Cosmopolitan": [
    { item: "Vodka Absolut Bleue", qty: 0.03 },
    { item: "Curaçao Triple Sec",  qty: 2 / 70 },
    { item: "Nectar Cranberry",    qty: 0.05 },
    { item: "Nectar Citron Vert",  qty: 0.05 },
  ],
  "Sex on the Beach": [
    { item: "Vodka Absolut Bleue",  qty: 0.04 },
    { item: "Mix Sex on the Beach", qty: 0.12 },
    { item: "Nectar Cranberry",     qty: 0.04 },
  ],
  "Berry Caïpiroska": [
    { item: "Vodka Absolut Bleue", qty: 0.04 },
    { item: "Ravifruit Fraise",    qty: 0.02 },
  ],
  "Pornstar Indiana": [
    { item: "Vodka Absolut Bleue", qty: 0.04 },
    { item: "Purée de Passion",    qty: 0.02 },
    { item: "Mix Maï Tai",         qty: 0.10 },
    { item: "Prosecco DOC Riccadonna", qty: 2 / 75 },
  ],
  "Expresso Martini": [
    { item: "Vodka Absolut Bleue",       qty: 0.03 },
    { item: "Kahlua Liqueur de Café",    qty: 2 / 100 },
    { item: "Sirop Sucre de Canne",      qty: 0.02 },
  ],

  // FROZEN
  "Frozen Marga": [
    { item: "Tequila Jose Cuervo", qty: 3 / 70 },
    { item: "Curaçao Triple Sec",  qty: 1 / 70 },
    { item: "Purée Margarita",     qty: 0.008 }, // via Mix Marga (8cl × 25/200)
  ],
  "Exotic Marga": [
    { item: "Tequila Jose Cuervo",    qty: 4 / 70 },
    { item: "Purée Fruits Exotiques", qty: 0.04 },
    { item: "Purée Margarita",        qty: 0.004 },
  ],
  "Frozen Red Daïquiri": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.04 },
    { item: "Purée Summer Berries",    qty: 0.04 },
    { item: "Purée Margarita",         qty: 0.004 },
  ],
  "Blue Hawaï": [
    { item: "Malibu Coco",           qty: 3 / 70 },
    { item: "Curaçao Bleu",          qty: 3 / 70 },
    { item: "Smoothie Piña Colada",  qty: 0.013 }, // via Mix Colada
    { item: "Jus d'Ananas",          qty: 0.079 }, // via Mix Colada
  ],

  // INDIANA MIX
  "London Gin Tonic": [
    { item: "Gin Beefeater",       qty: 0.04 },
    { item: "BIB Finley Tonic 5L", qty: 0.18 },
  ],
  "Pink Fizz": [
    { item: "Gin Beefeater",              qty: 0.04 },
    { item: "Soda Pamplemousse La French", qty: 0.14 },
  ],
  "American Mule": [
    { item: "Jack Daniel's", qty: 4 / 100 },
    { item: "Ginger Beer",   qty: 10 / 33 },
  ],
  "Tennessee Lemonade": [
    { item: "Jack Daniel's",  qty: 3 / 100 },
    { item: "Curaçao Triple Sec", qty: 1 / 70 },
    { item: "BIB Sprite 5L",  qty: 0.12 },
  ],

  // XXL
  "Sangria": [
    { item: "BIB Chardonnay 10L",             qty: 0.14 },
    { item: "Liqueur de Pêche Marie Brizard",  qty: 2 / 100 },
    { item: "Sirop Falernum Monin",            qty: 2 / 70 },
    { item: "BIB Sprite 5L",                   qty: 0.14 },
  ],
  "XL Mojito": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.051 }, // 15cl Mix Mojito
    { item: "Purée Mojito",            qty: 0.073 },
  ],
  "XL Long Island": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 6 / 100 * 14 / 70 },
    { item: "Vodka Wyborowa Pologne",  qty: 6 / 70  * 14 / 70 },
    { item: "Gin Beefeater",           qty: 6 / 100 * 14 / 70 },
    { item: "Tequila Jose Cuervo",     qty: 6 / 70  * 14 / 70 },
    { item: "BIB Coca-Cola 19L",       qty: 0.24 },
  ],
  "XL Electric Blue": [
    { item: "Curaçao Bleu",   qty: 2 / 70 },
    { item: "BIB Sprite 5L",  qty: 0.24 },
  ],
  "Loco Red Bull": [
    { item: "Red Bull Regular 25CL", qty: 1 },
  ],
  "XL Despejito": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.034 }, // via Mix Mojito 10cl
    { item: "Purée Mojito",            qty: 0.049 },
  ],

  // MOCKTAILS
  "Virgin Spritz": [
    { item: "Crodino Spritz 17,5CL", qty: 1 },
  ],
  "Summer Sangria": [
    { item: "Sirop Falernum Monin",       qty: 2 / 70 },
    { item: "BIB Fuzetea Pêche 5L",       qty: 0.14 },
    { item: "Soda Pamplemousse La French", qty: 0.14 },
  ],
  "Tiki Mule": [
    { item: "Mix Maï Tai", qty: 0.14 },
    { item: "Ginger Beer", qty: 14 / 33 },
  ],
  "Miami Sunset": [
    { item: "Nectar Cranberry",     qty: 0.08 },
    { item: "Mix Sex on the Beach", qty: 0.24 },
  ],
  "Colorado Sunrise": [
    { item: "Mix Planteur des Îles", qty: 0.32 },
  ],
  "Virgin Colada": [
    { item: "Jus d'Ananas",         qty: 0.21 }, // via Mix Colada 32cl
    { item: "Crème de Noix de Coco", qty: 0.083 },
    { item: "Smoothie Piña Colada", qty: 0.028 },
  ],
  "Virgin Mojito": [
    { item: "Nectar Citron Vert", qty: 0.04 },
    { item: "BIB Sprite 5L",      qty: 0.24 },
  ],

  // SMOOTHIES
  "Tropical Smoothie":          [{ item: "Purée Fruits Exotiques",       qty: 0.15 }],
  "Red Fruits Smoothie":        [{ item: "Purée Summer Berries",         qty: 0.15 }],
  "Coco Lada Smoothie":         [{ item: "Smoothie Piña Colada",         qty: 0.15 }],
  "Vanilla Berry Milkshake":    [{ item: "Island Oasis Ice Cream Base",  qty: 0.07 }, { item: "Purée Summer Berries", qty: 0.07 }],
  "Choco Daim Milkshake":       [{ item: "Island Oasis Ice Cream Base",  qty: 0.06 }, { item: "Choco-O-Latte",        qty: 0.06 }],
  "Cookie Oreo Milkshake":      [{ item: "Island Oasis Ice Cream Base",  qty: 0.09 }, { item: "Sirop Chocolat Cookies Monin", qty: 2 / 70 }],
  "Caramel Speculoos Milkshake":[{ item: "Island Oasis Ice Cream Base",  qty: 0.09 }],

  // HOT DRINK
  "Moca Viennois":       [{ item: "Sirop Sucre de Canne", qty: 0.02 }],
  "Café Affogato":       [{ item: "Island Oasis Ice Cream Base", qty: 0.05 }],
  "Cookie Irish Coffee": [{ item: "Whisky Bushmill Original",    qty: 4 / 70 }, { item: "Sirop Chocolat Cookies Monin", qty: 2 / 70 }],
  "Cappuccino Frappé":   [{ item: "Island Oasis Ice Cream Base", qty: 0.06 }, { item: "Sirop Sucre de Canne", qty: 0.02 }],

  // BIÈRES BOOST
  "Bière Boost Curaçao": [{ item: "Heineken 5° Fût 30L", qty: 0.23 }, { item: "Curaçao Bleu",  qty: 2 / 70 }],
  "Bière Boost Picon":   [{ item: "Heineken 5° Fût 30L", qty: 0.23 }, { item: "Picon Bière",   qty: 2 / 100 }],
  "Bière Boost Apérol":  [{ item: "Heineken 5° Fût 30L", qty: 0.23 }, { item: "Aperol",        qty: 2 / 100 }],
  "Mimosa":              [{ item: "Champagne Jacquard",  qty: 6 / 75 }, { item: "Jus d'Orange", qty: 0.06 }],
  "Bloody Mary":         [{ item: "Vodka Wyborowa Pologne", qty: 4 / 70 }, { item: "Jus de Tomate", qty: 0.16 }],
};
