// Datos base de Ritmo+: deportes, alimentos y menús.
// Valores nutricionales aproximados por 100 g (o por unidad cuando se indica).

const SPORTS = [
  { id: "correr",     n: "Correr",       ic: "run",    c: "#d4ff3a", gps: true,  met: 9.8 },
  { id: "bici",       n: "Bici",         ic: "bike",   c: "#38bdf8", gps: true,  met: 7.5 },
  { id: "caminar",    n: "Caminar",      ic: "walk",   c: "#a78bfa", gps: true,  met: 3.5 },
  { id: "senderismo", n: "Senderismo",   ic: "hike",   c: "#34d399", gps: true,  met: 6.0 },
  { id: "gym",        n: "Gimnasio",     ic: "gym",    c: "#ff7a45", gps: false, met: 5.0 },
  { id: "padel",      n: "Pádel",        ic: "padel",  c: "#facc15", gps: false, met: 7.0, match: true },
  { id: "tenis",      n: "Tenis",        ic: "tennis", c: "#a3e635", gps: false, met: 7.3, match: true },
  { id: "futbol",     n: "Fútbol",       ic: "ball",   c: "#4ade80", gps: false, met: 7.0, match: true },
  { id: "baloncesto", n: "Baloncesto",   ic: "basket", c: "#fb923c", gps: false, met: 6.5, match: true },
  { id: "natacion",   n: "Natación",     ic: "swim",   c: "#22d3ee", gps: false, met: 7.0 },
  { id: "yoga",       n: "Yoga",         ic: "yoga",   c: "#f0abfc", gps: false, met: 2.8 },
  { id: "hiit",       n: "HIIT / Cross", ic: "bolt",   c: "#f87171", gps: false, met: 8.0 },
  { id: "otro",       n: "Otro",         ic: "spark",  c: "#94a3b8", gps: false, met: 5.0 },
];
const sportOf = id => SPORTS.find(s => s.id === id) || SPORTS[SPORTS.length - 1];

const GYM_EX = ["Press banca", "Press inclinado", "Sentadilla", "Peso muerto", "Press militar", "Dominadas", "Remo con barra", "Remo en polea",
  "Jalón al pecho", "Curl bíceps", "Tríceps polea", "Fondos", "Prensa", "Zancadas", "Hip thrust", "Elevaciones laterales",
  "Aperturas", "Extensión cuádriceps", "Curl femoral", "Gemelos", "Plancha", "Abdominales"];

// Alimentos por 100 g: [nombre, kcal, proteína, carbohidratos, grasa, ración típica en g]
const FOODS = [
  ["Pechuga de pollo", 165, 31, 0, 3.6, 150], ["Pavo (fiambre)", 105, 19, 2, 2, 50], ["Ternera magra", 170, 26, 0, 7, 150],
  ["Cerdo (lomo)", 190, 27, 0, 9, 150], ["Salmón", 208, 20, 0, 13, 150], ["Merluza", 90, 18, 0, 1.5, 150], ["Atún en lata (al natural)", 110, 25, 0, 1, 80],
  ["Atún en aceite (escurrido)", 190, 26, 0, 9, 60], ["Huevo (unidad)", 143, 12.6, 0.7, 9.5, 60], ["Claras de huevo", 52, 11, 0.7, 0.2, 100],
  ["Gambas", 99, 24, 0, 0.3, 100], ["Tofu", 144, 15, 3, 8, 125], ["Arroz blanco (cocido)", 130, 2.7, 28, 0.3, 200],
  ["Arroz integral (cocido)", 123, 2.7, 26, 1, 200], ["Pasta (cocida)", 158, 5.8, 31, 0.9, 200], ["Pan blanco", 265, 9, 49, 3.2, 60],
  ["Pan integral", 247, 13, 41, 3.4, 60], ["Avena", 389, 17, 66, 7, 50], ["Patata (cocida)", 87, 1.9, 20, 0.1, 200],
  ["Boniato (asado)", 90, 2, 21, 0.2, 200], ["Quinoa (cocida)", 120, 4.4, 21, 1.9, 180], ["Lentejas (cocidas)", 116, 9, 20, 0.4, 200],
  ["Garbanzos (cocidos)", 164, 8.9, 27, 2.6, 200], ["Alubias (cocidas)", 127, 8.7, 23, 0.5, 200], ["Leche semidesnatada", 46, 3.3, 4.8, 1.6, 250],
  ["Leche de avena", 45, 1, 6.5, 1.5, 250], ["Yogur natural", 61, 3.5, 4.7, 3.3, 125], ["Yogur griego", 115, 6, 4, 9, 125],
  ["Skyr / yogur proteico", 63, 11, 4, 0.2, 150], ["Queso fresco batido 0%", 46, 8, 3.5, 0.1, 150], ["Queso fresco", 174, 12, 3, 13, 60],
  ["Queso curado", 400, 27, 0.5, 33, 30], ["Mozzarella", 254, 18, 2, 19, 60], ["Plátano", 89, 1.1, 23, 0.3, 120], ["Manzana", 52, 0.3, 14, 0.2, 180],
  ["Naranja", 47, 0.9, 12, 0.1, 180], ["Fresas", 32, 0.7, 7.7, 0.3, 150], ["Frutos rojos", 50, 0.8, 11, 0.4, 100], ["Kiwi", 61, 1.1, 15, 0.5, 100],
  ["Uvas", 69, 0.7, 18, 0.2, 120], ["Aguacate", 160, 2, 8.5, 14.7, 70], ["Tomate", 18, 0.9, 3.9, 0.2, 150], ["Lechuga / ensalada", 15, 1.4, 2.9, 0.2, 100],
  ["Brócoli", 34, 2.8, 7, 0.4, 150], ["Espinacas", 23, 2.9, 3.6, 0.4, 100], ["Calabacín", 17, 1.2, 3.1, 0.3, 200], ["Pimiento", 31, 1, 6, 0.3, 120],
  ["Zanahoria", 41, 0.9, 10, 0.2, 100], ["Champiñones", 22, 3.1, 3.3, 0.3, 120], ["Cebolla", 40, 1.1, 9, 0.1, 80], ["Judías verdes", 31, 1.8, 7, 0.2, 150],
  ["Aceite de oliva (cucharada)", 884, 0, 0, 100, 10], ["Almendras", 579, 21, 22, 50, 30], ["Nueces", 654, 15, 14, 65, 30],
  ["Crema de cacahuete", 588, 25, 20, 50, 20], ["Chocolate negro 85%", 600, 10, 20, 50, 20], ["Miel", 304, 0.3, 82, 0, 15],
  ["Proteína whey (cacito)", 380, 78, 8, 5, 30], ["Hummus", 177, 7.9, 14, 9.6, 60], ["Jamón serrano", 241, 31, 0, 13, 40],
  ["Tortilla de patatas", 155, 6, 13, 9, 150], ["Pizza", 266, 11, 33, 10, 250], ["Hamburguesa (completa)", 254, 13, 24, 12, 220],
  ["Kebab", 215, 12, 18, 11, 350], ["Patatas fritas", 312, 3.4, 41, 15, 120], ["Croissant", 406, 8, 46, 21, 60], ["Galletas", 480, 6, 68, 20, 30],
  ["Cerveza (caña)", 43, 0.5, 3.6, 0, 200], ["Vino tinto (copa)", 85, 0.1, 2.6, 0, 150], ["Refresco", 42, 0, 10.6, 0, 330], ["Zumo de naranja", 45, 0.7, 10, 0.2, 200],
  ["Café con leche", 30, 2, 3, 1, 200], ["Barrita de cereales", 400, 6, 70, 10, 25],
];

// Menús: plato, momento, [ingrediente, gramos base], etiquetas.
// Las calorías se calculan a partir de los ingredientes y la ración se ajusta a tu objetivo.
const MEALS = [
  // Desayunos
  { n: "Avena con plátano y crema de cacahuete", m: "desayuno", ing: [["Avena", 60], ["Leche semidesnatada", 250], ["Plátano", 100], ["Crema de cacahuete", 15]], t: ["veg"] },
  { n: "Tostadas con huevo y aguacate", m: "desayuno", ing: [["Pan integral", 70], ["Huevo (unidad)", 120], ["Aguacate", 50], ["Tomate", 50]], t: ["veg"] },
  { n: "Skyr con frutos rojos y nueces", m: "desayuno", ing: [["Skyr / yogur proteico", 200], ["Frutos rojos", 100], ["Nueces", 20], ["Miel", 10]], t: ["veg"] },
  { n: "Tostada con tomate y jamón", m: "desayuno", ing: [["Pan blanco", 80], ["Tomate", 60], ["Aceite de oliva (cucharada)", 8], ["Jamón serrano", 40]], t: [] },
  { n: "Tortilla de claras con avena", m: "desayuno", ing: [["Claras de huevo", 200], ["Avena", 40], ["Plátano", 100]], t: ["veg"] },
  { n: "Yogur griego con fruta y almendras", m: "desayuno", ing: [["Yogur griego", 150], ["Kiwi", 100], ["Almendras", 20], ["Avena", 30]], t: ["veg"] },
  { n: "Batido de proteína con avena", m: "desayuno", ing: [["Proteína whey (cacito)", 30], ["Leche semidesnatada", 300], ["Avena", 50], ["Plátano", 100]], t: ["veg"] },
  // Comidas
  { n: "Pollo con arroz y brócoli", m: "comida", ing: [["Pechuga de pollo", 160], ["Arroz blanco (cocido)", 200], ["Brócoli", 150], ["Aceite de oliva (cucharada)", 10]], t: [] },
  { n: "Lentejas con verduras", m: "comida", ing: [["Lentejas (cocidas)", 300], ["Zanahoria", 60], ["Pimiento", 60], ["Cebolla", 50], ["Aceite de oliva (cucharada)", 10]], t: ["veg"] },
  { n: "Pasta con atún y tomate", m: "comida", ing: [["Pasta (cocida)", 220], ["Atún en lata (al natural)", 80], ["Tomate", 120], ["Aceite de oliva (cucharada)", 10]], t: [] },
  { n: "Salmón con patata y judías", m: "comida", ing: [["Salmón", 150], ["Patata (cocida)", 200], ["Judías verdes", 150], ["Aceite de oliva (cucharada)", 5]], t: [] },
  { n: "Ternera con boniato y ensalada", m: "comida", ing: [["Ternera magra", 150], ["Boniato (asado)", 200], ["Lechuga / ensalada", 100], ["Tomate", 100], ["Aceite de oliva (cucharada)", 10]], t: [] },
  { n: "Garbanzos con espinacas y huevo", m: "comida", ing: [["Garbanzos (cocidos)", 250], ["Espinacas", 100], ["Huevo (unidad)", 60], ["Aceite de oliva (cucharada)", 10]], t: ["veg"] },
  { n: "Bowl de quinoa, tofu y verduras", m: "comida", ing: [["Quinoa (cocida)", 200], ["Tofu", 150], ["Calabacín", 100], ["Pimiento", 80], ["Aceite de oliva (cucharada)", 10]], t: ["veg"] },
  { n: "Arroz con gambas y verduras", m: "comida", ing: [["Arroz integral (cocido)", 220], ["Gambas", 150], ["Pimiento", 60], ["Judías verdes", 80], ["Aceite de oliva (cucharada)", 10]], t: [] },
  { n: "Lomo con patata y pimientos", m: "comida", ing: [["Cerdo (lomo)", 150], ["Patata (cocida)", 200], ["Pimiento", 100], ["Aceite de oliva (cucharada)", 10]], t: [] },
  { n: "Alubias con verduras", m: "comida", ing: [["Alubias (cocidas)", 280], ["Zanahoria", 60], ["Cebolla", 50], ["Pimiento", 50], ["Aceite de oliva (cucharada)", 10]], t: ["veg"] },
  // Meriendas
  { n: "Yogur con fruta", m: "merienda", ing: [["Yogur natural", 125], ["Manzana", 150]], t: ["veg"] },
  { n: "Tostada con hummus", m: "merienda", ing: [["Pan integral", 40], ["Hummus", 50]], t: ["veg"] },
  { n: "Plátano y almendras", m: "merienda", ing: [["Plátano", 120], ["Almendras", 20]], t: ["veg"] },
  { n: "Queso batido con fresas", m: "merienda", ing: [["Queso fresco batido 0%", 200], ["Fresas", 120]], t: ["veg"] },
  { n: "Bocadillo de pavo", m: "merienda", ing: [["Pan integral", 60], ["Pavo (fiambre)", 50], ["Tomate", 40]], t: [] },
  { n: "Batido de proteína", m: "merienda", ing: [["Proteína whey (cacito)", 30], ["Leche semidesnatada", 250]], t: ["veg"] },
  // Cenas
  { n: "Tortilla francesa con ensalada", m: "cena", ing: [["Huevo (unidad)", 120], ["Lechuga / ensalada", 100], ["Tomate", 100], ["Pan integral", 40], ["Aceite de oliva (cucharada)", 8]], t: ["veg"] },
  { n: "Merluza con verduras al horno", m: "cena", ing: [["Merluza", 200], ["Calabacín", 150], ["Pimiento", 80], ["Patata (cocida)", 120], ["Aceite de oliva (cucharada)", 10]], t: [] },
  { n: "Ensalada de pollo y aguacate", m: "cena", ing: [["Pechuga de pollo", 130], ["Lechuga / ensalada", 120], ["Aguacate", 60], ["Tomate", 100], ["Pan integral", 40]], t: [] },
  { n: "Revuelto de champiñones y gambas", m: "cena", ing: [["Huevo (unidad)", 120], ["Gambas", 100], ["Champiñones", 120], ["Pan integral", 40], ["Aceite de oliva (cucharada)", 5]], t: [] },
  { n: "Crema de calabacín y tortilla", m: "cena", ing: [["Calabacín", 250], ["Patata (cocida)", 80], ["Huevo (unidad)", 120], ["Aceite de oliva (cucharada)", 8]], t: ["veg"] },
  { n: "Salmón con espinacas", m: "cena", ing: [["Salmón", 140], ["Espinacas", 150], ["Boniato (asado)", 120]], t: [] },
  { n: "Pizza casera de pan integral", m: "cena", ing: [["Pan integral", 80], ["Tomate", 80], ["Mozzarella", 60], ["Champiñones", 60], ["Pavo (fiambre)", 40]], t: [] },
  { n: "Tofu salteado con arroz", m: "cena", ing: [["Tofu", 150], ["Arroz integral (cocido)", 150], ["Brócoli", 120], ["Aceite de oliva (cucharada)", 8]], t: ["veg"] },
];

const MOMENTOS = [["desayuno", "Desayuno"], ["comida", "Comida"], ["merienda", "Merienda"], ["cena", "Cena"], ["snack", "Picoteo"]];
const REPARTO = { desayuno: .25, comida: .35, merienda: .10, cena: .30 };
const foodOf = n => FOODS.find(f => f[0] === n);
function mealMacros(meal, k = 1) {
  const r = { kcal: 0, p: 0, c: 0, g: 0 };
  for (const [n, gr] of meal.ing) { const f = foodOf(n); if (!f) continue; const x = gr * k / 100; r.kcal += f[1] * x; r.p += f[2] * x; r.c += f[3] * x; r.g += f[4] * x; }
  return r;
}
