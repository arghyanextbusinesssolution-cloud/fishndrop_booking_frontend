export interface MenuItem {
  name: string;
  desc: string;
  tag?: string;
  spicy?: boolean;
  vegetarian?: boolean;
}

export interface MenuCategory {
  categoryName: string;
  items: MenuItem[];
}

export interface CateringRestaurant {
  id: string;
  name: string;
  tagline: string;
  cuisine: string;
  badge: string;
  rating: string;
  emoji: string;
  image: string;
  websiteUrl: string;
  websiteLabel: string;
  isDoorDash?: boolean;
  shortDesc: string;
  fullDesc: string;
  highlightDishes: string[];
  categories: MenuCategory[];
}

export const CATERING_RESTAURANTS: CateringRestaurant[] = [
  {
    id: "jamaican_jerk_house",
    name: "Jamaican Jerk House",
    tagline: "Authentic Caribbean Jerk & Island Soul Flavors",
    cuisine: "Jamaican & Caribbean Catering",
    badge: "🇯🇲 Caribbean Jerk House",
    rating: "4.8 ★ DoorDash Top Rated",
    emoji: "🍗",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    websiteUrl: "https://www.doordash.com/search/store/Jamaican%20Jerk%20House/",
    websiteLabel: "Check out Jamaican Jerk House on DoorDash!",
    isDoorDash: true,
    shortDesc: "Authentic Jamaican Jerk chicken, braised oxtail, curry goat, sweet plantains, rice & peas, and Jamaican festival.",
    fullDesc: "Jamaican Jerk House delivers true island culinary tradition directly to your private gathering. Marinated in authentic scotch bonnet peppers, pimento, thyme, and island spices, every platter is slow-smoked and bursting with flavor.",
    highlightDishes: ["Signature Jerk Chicken", "Braised Beef Oxtail", "Curry Goat", "Fried Sweet Plantains", "Authentic Rice & Peas"],
    categories: [
      {
        categoryName: "Signature Island Entrees",
        items: [
          {
            name: "Authentic Jerk Chicken",
            desc: "Slow-smoked chicken marinated in our house scotch bonnet, scallion, and pimento island rub.",
            tag: "House Specialty",
            spicy: true
          },
          {
            name: "Braised Beef Oxtail & Butter Beans",
            desc: "Tender, fall-off-the-bone beef oxtails simmered in rich Jamaican brown stew with butter beans.",
            tag: "Crowd Favorite"
          },
          {
            name: "Traditional Curry Goat",
            desc: "Slow-braised goat cooked in authentic Jamaican turmeric curry and herbs until melt-in-mouth tender.",
            spicy: true
          },
          {
            name: "Escovitch Snapper / King Fish",
            desc: "Pan-fried whole fish topped with spicy pickled carrots, scotch bonnet peppers, and sweet bell peppers.",
            tag: "Seafood"
          },
          {
            name: "Brown Stew Chicken",
            desc: "Caramelized chicken thighs simmered low and slow in aromatic island gravy with sweet peppers."
          }
        ]
      },
      {
        categoryName: "Traditional Island Sides",
        items: [
          {
            name: "Coconut Rice & Red Peas",
            desc: "Jasmine rice simmered in fresh coconut milk, thyme, scallions, and red kidney beans.",
            vegetarian: true
          },
          {
            name: "Caramelized Sweet Plantains",
            desc: "Ripe golden plantains pan-fried sweet and soft.",
            vegetarian: true
          },
          {
            name: "Jamaican Fried Festival",
            desc: "Sweet, crispy fried cornmeal dough dumplings.",
            vegetarian: true
          },
          {
            name: "Steamed Island Cabbage & Veggies",
            desc: "Lightly sauteed cabbage with shredded carrots, bell peppers, and fresh thyme.",
            vegetarian: true
          },
          {
            name: "Caribbean Baked Macaroni & Cheese Pie",
            desc: "Rich 4-cheese baked macaroni pie seasoned with island spices.",
            vegetarian: true
          }
        ]
      },
      {
        categoryName: "Tropical Beverages",
        items: [
          { name: "Homemade Sorrel (Hibiscus & Ginger)", desc: "Fresh hibiscus flower brew infused with Jamaican ginger and cloves." },
          { name: "Jamaican D&G Ginger Beer & Ting", desc: "Crisp sparkling Caribbean sodas." }
        ]
      }
    ]
  },
  {
    id: "east_coast_street_tacos",
    name: "East Coast Street Tacos",
    tagline: "Authentic Handcrafted Mexican Street Tacos & Birria",
    cuisine: "Authentic Mexican Street Food & Fiesta Catering",
    badge: "🇲🇽 East Coast Street Tacos",
    rating: "4.9 ★ Street Mexican",
    emoji: "🌮",
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80",
    websiteUrl: "https://eastcoaststreettacos.com",
    websiteLabel: "Visit East Coast Street Tacos (eastcoaststreettacos.com)",
    isDoorDash: false,
    shortDesc: "Fresh handcrafted tacos, slow-cooked birria with consomé, carne asada, al pastor, fresh guacamole, loaded nachos, and churros.",
    fullDesc: "East Coast Street Tacos brings the authentic flavors of Mexico's street taquerias with housemade corn tortillas, prime meats, vibrant salsas, and rich birria broth.",
    highlightDishes: ["Birria Tacos with Consomé", "Carne Asada Tacos", "Al Pastor with Pineapple", "Loaded Fiesta Nachos", "Churros with Dulce de Leche"],
    categories: [
      {
        categoryName: "Signature Street Tacos",
        items: [
          {
            name: "Birria Tacos con Consomé",
            desc: "Slow-braised beef brisket crisped in chili oil with Oaxaca cheese, cilantro, onions & rich dipping broth.",
            tag: "Best Seller"
          },
          {
            name: "Carne Asada Tacos",
            desc: "Citrus and garlic marinated prime steak char-grilled over open flame with fresh cilantro and onions.",
            tag: "Popular"
          },
          {
            name: "Al Pastor Tacos",
            desc: "Pork loin marinated in achiote and guajillo chili, roasted with sweet grilled pineapple chunks."
          },
          {
            name: "Pollo Asado Tacos",
            desc: "Flame-grilled chicken breast with house cilantro-lime marinade, pico de gallo, and salsa verde."
          },
          {
            name: "Baja Style Crispy Fish / Shrimp Tacos",
            desc: "Beer-battered fish or grilled shrimp topped with crunchy red cabbage slaw and chipotle crema."
          }
        ]
      },
      {
        categoryName: "Fiesta Platters & Street Sides",
        items: [
          {
            name: "Loaded Fiesta Nachos",
            desc: "Warm house tortilla chips piled high with warm queso, black beans, pico, jalapeños, guacamole & crema.",
            vegetarian: true
          },
          {
            name: "Fresh Hand-Smashed Guacamole & Chips",
            desc: "Ripe Hass avocados mashed with lime juice, sea salt, diced onions, cilantro & serrano peppers.",
            vegetarian: true
          },
          {
            name: "Mexican Street Corn (Elote)",
            desc: "Charred sweet corn on the cob slathered in Mexican crema, cotija cheese, chili powder & fresh lime.",
            vegetarian: true
          },
          {
            name: "Cheese & Protein Quesadillas",
            desc: "Giant grilled flour tortillas packed with melted Oaxaca and Chihuahua cheeses."
          }
        ]
      },
      {
        categoryName: "Mexican Desserts & Aguas Frescas",
        items: [
          { name: "Cinnamon Sugar Churros", desc: "Warm crispy fried dough tossed in cinnamon sugar, served with warm dulce de leche." },
          { name: "Housemade Horchata & Jamaica", desc: "Traditional cinnamon rice milk and chilled hibiscus tea." }
        ]
      }
    ]
  },
  {
    id: "cooklyn_eats",
    name: "Cooklyn Eats",
    tagline: "Modern Soul Food & Southern Comfort Elevated",
    cuisine: "Southern Soul Food & Comfort Catering",
    badge: "🍲 Cooklyn Eats",
    rating: "4.9 ★ Chef-Crafted Soul Food",
    emoji: "🍗",
    image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80",
    websiteUrl: "https://www.cooklyneats.com/",
    websiteLabel: "Visit Cooklyn Eats (www.cooklyneats.com)",
    isDoorDash: false,
    shortDesc: "Golden crispy Southern fried chicken, smoked St. Louis BBQ ribs, 5-cheese baked mac & cheese, slow-braised collard greens, and sweet potato cornbread.",
    fullDesc: "Cooklyn Eats brings hearty, soulful Southern recipes crafted with premium cuts, homemade marinades, and generational comfort food recipes that elevate any celebration.",
    highlightDishes: ["Southern Fried Chicken", "Smoked BBQ Ribs", "5-Cheese Baked Mac & Cheese", "Slow-Cooked Collard Greens", "Honey Cornbread"],
    categories: [
      {
        categoryName: "Soul Food Classics & Mains",
        items: [
          {
            name: "Golden Southern Fried Chicken",
            desc: "24-hour buttermilk brined chicken seasoned with secret Southern herbs and fried extra crispy.",
            tag: "Signature Dish"
          },
          {
            name: "Smoked St. Louis BBQ Ribs",
            desc: "Hickory-smoked fall-off-the-bone pork ribs basted in chef's sweet and tangy bourbon BBQ glaze.",
            tag: "Customer Favorite"
          },
          {
            name: "Blackened Salmon & Creamy Grits",
            desc: "Pan-seared Atlantic salmon coated in Cajun blackened spices over stone-ground cheddar grits.",
            tag: "Chef Special"
          },
          {
            name: "Crispy Cornmeal Catfish Fillets",
            desc: "Golden fried catfish fillets served with house spicy Cajun remoulade sauce and lemon wedges."
          },
          {
            name: "Smothered Pork Chops",
            desc: "Tender seasoned pork chops smothered in rich, slow-simmered caramelized onion and herb gravy."
          }
        ]
      },
      {
        categoryName: "Iconic Southern Comfort Sides",
        items: [
          {
            name: "5-Cheese Baked Macaroni & Cheese",
            desc: "Cavatappi pasta loaded with sharp cheddar, smoked gouda, gruyere, Monterey Jack, and parmesan.",
            tag: "Must Try",
            vegetarian: true
          },
          {
            name: "Slow-Braised Collard Greens",
            desc: "Fresh collard greens simmered low and slow with smoked turkey aromatics, garlic, and cider vinegar."
          },
          {
            name: "Candied Sweet Yams",
            desc: "Sliced sweet potatoes baked in brown sugar, pure vanilla, nutmeg, cinnamon, and golden butter glaze.",
            vegetarian: true
          },
          {
            name: "Warm Golden Honey Cornbread",
            desc: "Freshly baked sweet Southern cornbread brushed with wildflower honey butter.",
            vegetarian: true
          }
        ]
      },
      {
        categoryName: "Southern Desserts & Sips",
        items: [
          { name: "Homestyle Peach Cobbler", desc: "Spiced sweet Georgia peaches baked beneath a buttery golden flaky crust." },
          { name: "Southern Sweet Tea & Fresh Lemonade", desc: "Traditional sweet brewed black tea and fresh squeezed lemon Arnold Palmers." }
        ]
      }
    ]
  },
  {
    id: "custom_catering",
    name: "Custom / Multi-Restaurant Mix",
    tagline: "Bespoke Dining Vision or Dietary Requirements",
    cuisine: "Custom Catering Selection",
    badge: "✍️ Custom Menu",
    rating: "Bespoke Service",
    emoji: "✨",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80",
    websiteUrl: "https://eastcoaststreettacos.com",
    websiteLabel: "Discuss custom catering arrangements with our event concierge",
    shortDesc: "Want dishes from multiple partner restaurants, specific dietary accommodations (vegan, kosher, halal), or a custom chef tasting? We will tailor it for you.",
    fullDesc: "Our event team will work with Jamaican Jerk House, East Coast Street Tacos, Cooklyn Eats, or custom private chefs to build a custom menu tailored to your exact preferences.",
    highlightDishes: ["Multi-Cuisine Fusion", "Dietary Accommodations", "Custom Chef Platters"],
    categories: [
      {
        categoryName: "Custom Options",
        items: [
          { name: "Multi-Restaurant Combo Platter", desc: "Select items across all 3 partner restaurants for maximum guest variety." },
          { name: "Dietary-Specific Catering", desc: "Custom vegan, vegetarian, gluten-free, or halal preparations." }
        ]
      }
    ]
  }
];

export const CATERING_LABEL_MAP: Record<string, string> = {
  none: "🚫 No Partner Catering (Self-Managed)",
  no_catering: "🚫 No Partner Catering (Self-Managed)",
  jamaican_jerk_house: "🍗 Jamaican Jerk House (Caribbean)",
  east_coast_street_tacos: "🌮 East Coast Street Tacos (Mexican)",
  cooklyn_eats: "🍲 Cooklyn Eats (Soul Food)",
  cooklyneats: "🍲 Cooklyn Eats (Soul Food)",
  custom_catering: "✍️ Custom / Multi-Restaurant Mix",
  custom: "✍️ Custom Menu — Discuss With Us",
  // Legacy mappings for backwards compatibility
  seafood_buffet: "🍗 Jamaican Jerk House",
  tropica_signature: "🌮 East Coast Street Tacos",
  bbq_grill: "🍲 Cooklyn Eats (Soul Food)",
  cocktail_canapes: "🌮 East Coast Street Tacos",
  vegan_garden: "🍲 Cooklyn Eats (Garden)",
  kids_friendly: "🍗 Jamaican Jerk House"
};

export const getCateringRestaurant = (id?: string): CateringRestaurant => {
  if (!id) return CATERING_RESTAURANTS[0];
  const found = CATERING_RESTAURANTS.find(r => r.id === id);
  if (found) return found;

  // Check aliases
  if (id === "cooklyneats") return CATERING_RESTAURANTS[2];
  if (id === "seafood_buffet") return CATERING_RESTAURANTS[0];
  if (id === "tropica_signature" || id === "cocktail_canapes") return CATERING_RESTAURANTS[1];
  if (id === "bbq_grill" || id === "vegan_garden") return CATERING_RESTAURANTS[2];

  return CATERING_RESTAURANTS[0];
};

export interface CateringDishItem {
  name: string;
  quantity: number;
}

export function parseCateringDetails(booking: {
  cateringMenu?: string;
  notes?: string;
  dishQuantities?: Record<string, number> | Map<string, number>;
}) {
  const restaurantKey = booking?.cateringMenu || "none";
  const restaurantLabel = CATERING_LABEL_MAP[restaurantKey] || (restaurantKey === "none" ? "No Partner Catering" : restaurantKey);
  
  let dishes: string[] = [];
  let dishQuantities: Record<string, number> = {};
  let dietaryNotes = "";
  let baseNotes = booking?.notes || "";

  // Merge explicit dishQuantities if already present
  if (booking?.dishQuantities) {
    if (booking.dishQuantities instanceof Map) {
      dishQuantities = Object.fromEntries(booking.dishQuantities.entries());
    } else if (typeof booking.dishQuantities === "object") {
      dishQuantities = { ...booking.dishQuantities };
    }
  }

  if (booking?.notes) {
    const dishesMatch = booking.notes.match(/\[Dishes:\s*([^\]]+)\]/i);
    if (dishesMatch && dishesMatch[1]) {
      const rawDishes = dishesMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
      dishes = rawDishes.map((raw) => {
        // Match patterns: "Dish Name (x2 platters)", "Dish Name (x2)", "Dish Name x2", "Dish Name (2 platters)"
        const qtyMatch =
          raw.match(/^(.*?)\s*\(?(?:x|\bqty:?)\s*(\d+)(?:\s*(?:platters?|plates?))?\)?$/i) ||
          raw.match(/^(.*?)\s*\((\d+)\s*(?:platters?|plates?|x)?\)$/i);
        if (qtyMatch) {
          const cleanName = qtyMatch[1].trim();
          const parsedQty = parseInt(qtyMatch[2], 10) || 1;
          if (dishQuantities[cleanName] === undefined) {
            dishQuantities[cleanName] = parsedQty;
          }
          return cleanName;
        }
        if (dishQuantities[raw] === undefined) {
          dishQuantities[raw] = 1;
        }
        return raw;
      });
    }
    const dietaryMatch = booking.notes.match(/\[Dietary:\s*([^\]]+)\]/i);
    if (dietaryMatch && dietaryMatch[1]) {
      dietaryNotes = dietaryMatch[1].trim();
    }
    // Clean base notes of [Dishes: ...] and [Dietary: ...] tags
    baseNotes = booking.notes
      .replace(/\[Dishes:[^\]]*\]/gi, "")
      .replace(/\[Dietary:[^\]]*\]/gi, "")
      .replace(/\|\s*\|/g, "|")
      .trim();
    if (baseNotes.startsWith("|")) baseNotes = baseNotes.slice(1).trim();
    if (baseNotes.endsWith("|")) baseNotes = baseNotes.slice(0, -1).trim();
  }

  const dishItems: CateringDishItem[] = dishes.map((name) => ({
    name,
    quantity: dishQuantities[name] || 1
  }));

  return {
    restaurantKey,
    restaurantLabel,
    dishes,
    dishQuantities,
    dishItems,
    dietaryNotes,
    baseNotes
  };
}

export function formatCateringNotes(
  baseNotes: string,
  dishes: string[],
  dietaryNotes: string,
  dishQuantities?: Record<string, number>
): string {
  const parts: string[] = [];
  const cleanBase = (baseNotes || "")
    .replace(/\[Dishes:[^\]]*\]/gi, "")
    .replace(/\[Dietary:[^\]]*\]/gi, "")
    .replace(/\|\s*\|/g, "|")
    .trim();
  
  if (cleanBase) parts.push(cleanBase);
  if (dishes && dishes.length > 0) {
    const dishStrs = dishes.map((d) => {
      const qty = dishQuantities?.[d];
      if (qty && qty > 1) {
        return `${d} (x${qty} platters)`;
      }
      return `${d} (x1 platter)`;
    });
    parts.push(`[Dishes: ${dishStrs.join(", ")}]`);
  }
  if (dietaryNotes && dietaryNotes.trim()) parts.push(`[Dietary: ${dietaryNotes.trim()}]`);

  const result = parts.join(" | ");
  return result.length > 500 ? result.slice(0, 497) + "..." : result;
}

