// The 9 Regional States used by this app. Note this deliberately excludes
// the 2 federally-chartered city administrations (Addis Ababa, Dire Dawa)
// and a few smaller regions (Benishangul-Gumuz, Gambella, Harari) — this
// list matches the specific 9-region scope requested for the address
// cascade, not the full set of Ethiopia's administrative divisions.
export const regionsData = {
  oromia: {
    name: "Oromia",
    zones: {
      eastShewa: {
        name: "East Shewa",
        woredas: {
          adama: {
            name: "Adama",
            kebeles: [
              "01",
              "02",
              "03",
              "04",
              "05"
            ]
          },
          boset: {
            name: "Boset",
            kebeles: [
              "01",
              "02",
              "03"
            ]
          }
        }
      },
      westShewa: {
        name: "West Shewa",
        woredas: {
          ambo: {
            name: "Ambo",
            kebeles: [
              "01",
              "02",
              "03",
              "04"
            ]
          },
          jeldu: {
            name: "Jeldu",
            kebeles: [
              "01",
              "02"
            ]
          }
        }
      }
    }
  },

  amhara: {
    name: "Amhara",
    zones: {
      northShewa: {
        name: "North Shewa",
        woredas: {
          debreBirhan: {
            name: "Debre Birhan",
            kebeles: [
              "01",
              "02",
              "03"
            ]
          }
        }
      },

      southGondar: {
        name: "South Gondar",
        woredas: {
          debreTabor: {
            name: "Debre Tabor",
            kebeles: [
              "01",
              "02",
              "03"
            ]
          }
        }
      }
    }
  },

  sidama: {
    name: "Sidama",
    zones: {
      hawassaZone: {
        name: "Hawassa",
        woredas: {
          hawassa: {
            name: "Hawassa",
            kebeles: [
              "01",
              "02",
              "03"
            ]
          }
        }
      }
    }
  },

  southWestEthiopia: {
    name: "South West Ethiopia Peoples",
    zones: {
      keffa: {
        name: "Keffa",
        woredas: {
          bonga: {
            name: "Bonga",
            kebeles: [
              "01",
              "02",
              "03"
            ]
          }
        }
      },
      benchSheko: {
        name: "Bench Sheko",
        woredas: {
          mizanAman: {
            name: "Mizan Aman",
            kebeles: [
              "01",
              "02"
            ]
          }
        }
      }
    }
  },

  centralEthiopia: {
    name: "Central Ethiopia",
    zones: {
      gurage: {
        name: "Gurage",
        woredas: {
          wolkite: {
            name: "Wolkite",
            kebeles: [
              "01",
              "02",
              "03"
            ]
          }
        }
      },
      hadiya: {
        name: "Hadiya",
        woredas: {
          hosaena: {
            name: "Hosaena",
            kebeles: [
              "01",
              "02"
            ]
          }
        }
      }
    }
  },

  southEthiopia: {
    name: "South Ethiopia",
    zones: {
      wolayta: {
        name: "Wolayta",
        woredas: {
          sodo: {
            name: "Sodo",
            kebeles: [
              "01",
              "02",
              "03"
            ]
          }
        }
      },
      gofa: {
        name: "Gofa",
        woredas: {
          saula: {
            name: "Saula",
            kebeles: [
              "01",
              "02"
            ]
          }
        }
      }
    }
  },

  somali: {
    name: "Somali",
    zones: {
      jigjigaZone: {
        name: "Jigjiga",
        woredas: {
          jigjiga: {
            name: "Jigjiga",
            kebeles: [
              "01",
              "02",
              "03"
            ]
          }
        }
      }
    }
  },

  afar: {
    name: "Afar",
    zones: {
      zone1: {
        name: "Zone 1",
        woredas: {
          asayita: {
            name: "Asayita",
            kebeles: [
              "01",
              "02"
            ]
          }
        }
      }
    }
  },

  tigray: {
    name: "Tigray",
    zones: {
      central: {
        name: "Central",
        woredas: {
          mekelle: {
            name: "Mekelle",
            kebeles: [
              "01",
              "02",
              "03"
            ]
          }
        }
      }
    }
  }
};

export const cropTypes = [
  "Teff",
  "Maize",
  "Wheat",
  "Coffee",
  "Barley",
  "Beans",
  "Lentils",
  "Sorghum",
  "Sesame",
  "Potato",
  "Onion",
  "Tomato"
];

// Local variety / cultivar names, grouped by crop type. Shown as a dependent
// dropdown once a Crop Type is selected — the list changes based on that
// choice. These are commonly-known Ethiopian varieties for each crop, but
// deliberately not treated as exhaustive: the UI always includes an "Other"
// option that reveals a free-text field, since a farmer may grow a variety
// not on this list and shouldn't be blocked from listing it.
export const cropVarieties = {
  Teff: ["Quncho", "Dukem", "Boset", "Magna", "Gimbichu"],
  Maize: ["BH540", "BH546", "BH661", "Melkassa-1", "Melkassa-2", "Shone"],
  Wheat: ["Kubsa", "Digalu", "Danda'a", "Hidase", "Ogolcho"],
  Coffee: ["Yirgacheffe", "Sidamo", "Harar", "Limu", "Jimma"],
  Barley: ["HB-42", "Bahati", "Guta", "Basso"],
  Beans: ["Nasir", "Awash-1", "Ibbado", "Red Wolayta", "White Pea Bean"],
  Lentils: ["Alemaya", "Adaa", "Derash", "Chalew"],
  Sorghum: ["Gambella-1107", "Melkam", "ESH-1", "Meko"],
  Sesame: ["Setit-1", "Setit-2", "Humera-1", "Abasena"],
  Potato: ["Jalene", "Gudene", "Belete", "Guassa"],
  Onion: ["Bombay Red", "Adama Red", "Nasik Red"],
  Tomato: ["Marglobe", "Roma VF", "Cochoro"]
};

// Maps each crop type to the product Category it belongs under (Cereals,
// Pulses, Oilseeds, Cash Crops, Vegetables — see server/controllers/categoryController.js
// for the seeded default Category documents). Used by the Sell Crop form
// to auto-select the matching category when a farmer picks a crop type,
// so a crop type and its category can't end up mismatched (e.g. "Coffee"
// filed under "Vegetables"). Categories remain real, admin-editable
// database records — this mapping only pre-fills a sensible default by
// matching on name; it never blocks picking a different category by hand.
export const cropTypeToCategory = {
  Teff: "Cereals",
  Maize: "Cereals",
  Wheat: "Cereals",
  Barley: "Cereals",
  Sorghum: "Cereals",
  Beans: "Pulses",
  Lentils: "Pulses",
  Sesame: "Oilseeds",
  Coffee: "Cash Crops",
  Potato: "Vegetables",
  Onion: "Vegetables",
  Tomato: "Vegetables",
};

export const productGrades = ["Grade A", "Grade B", "Grade C"];

export const userRoles = [
  "farmer",
  "buyer",
  "extension",
  "admin"
];

// ---- Marketplace / Order / Support dropdown option sets ----

// Note: product categories (Cereals/Pulses/Vegetables/Fruits) are NOT
// hardcoded here — they're real, admin-managed documents in the Category
// collection (see server/models/Category.js and categoryService.js).
// A fresh database auto-seeds those same four names once, so the app isn't
// empty out of the box, but from that point on they're ordinary editable
// database records, not a fixed list baked into the frontend.

export const productUnits = ["Quintal", "Kg", "Liter"];

export const listingStatuses = ["Active", "Sold Out"];

export const paymentMethods = ["Chapa", "Telebirr", "Cash on Delivery"];

export const orderStatuses = ["Pending", "Confirmed", "Completed"];

export const supportCategories = ["Technical Issue", "Payment Issue", "General Inquiry"];

export const languageOptions = ["Amharic", "English"];