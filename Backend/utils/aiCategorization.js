const categories = {
    food: ["restaurant", "dinner", "lunch", "breakfast", "snacks", "coffee", "tea", "meal"],
    transport: ["uber", "bus", "train", "taxi", "fuel", "gas", "petrol", "diesel", "metro"],
    entertainment: ["movie", "netflix", "concert", "games", "show", "music", "cinema"],
    shopping: ["clothes", "electronics", "fashion", "grocery", "mall", "shoes"],
    rent: ["apartment", "house", "rent", "lease"],
    bills: ["electricity", "water", "wifi", "phone", "gas bill", "internet"],
    health: ["hospital", "medicine", "doctor", "treatment", "pharmacy"],
    education: ["tuition", "books", "school", "college", "university", "course", "exam"],
    other: [],
  };
  
  /**
   * Categorizes an expense based on keywords in the description.
   * @param {string} description - The transaction description.
   * @returns {string} - The predicted category.
   */
  function categorizeExpense(description) {
    const lowerDesc = description.toLowerCase();
  
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((word) => lowerDesc.includes(word))) {
        return category;
      }
    }
  
    return "other"; // Default category if no match is found
  }
  
  module.exports = categorizeExpense;
  