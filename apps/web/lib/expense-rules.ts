// TypeScript port of local_heuristic_classify() in mcp/ai-server/app.py.
// Used only in demo mode, where there is no AI server to call.
// Order matters: essential categories are checked first.

type Rule = { pattern: RegExp; category: string; essential: boolean };

const rules: Rule[] = [
  {
    pattern:
      /\b(?:medical|hospital|clinic|health|doctor|dentist|pharmacy|er|care|emergency room|patient|prescription|treatment|diagnosis|surgery|nursing|physiotherapy|ward|outpatient|inpatient|laboratory|lab report|blood test|x-?ray|mri|consultation|specialist|pediatric|gynecology|orthopedic|cardiology)\b/,
    category: "Medical",
    essential: true,
  },
  {
    pattern:
      /\b(?:school|college|university|tuition|textbook|course|admission|enrollment|semester|academic|lecture|faculty|daycare|day care|nursery|kindergarten|preschool|high school|primary school|secondary school|boarding school|tuition fee|admission fee|exam fee|school fee|sports fee|transport fee|library fee|registration fee|lab fee|laboratory fee|student|fees|term fee|annual fee|educational|institution)\b/,
    category: "Education",
    essential: true,
  },
  {
    pattern:
      /\b(?:electric|electricity|power|con edison|pge|energy bill|kwh|kilowatt|meter reading|power bill|light bill|energy charge)\b/,
    category: "Electricity",
    essential: true,
  },
  {
    pattern: /\b(?:water bill|sewer|utility water|water supply|water charge|water meter|water authority)\b/,
    category: "Water",
    essential: true,
  },
  {
    pattern: /\b(?:gas bill|heating|utility gas|natural gas|lpg|pipeline gas|gas meter|gas supply|gas charge)\b/,
    category: "Gas",
    essential: true,
  },
  {
    pattern:
      /\b(?:internet|wifi|comcast|xfinity|broadband|verizon|charter|att|at&t|spectrum|telecoms?|phone bill|mobile bill|data plan|monthly subscription internet)\b/,
    category: "Internet",
    essential: true,
  },
  {
    pattern:
      /\b(?:rent|lease|landlord|real estate|apartment|housing|tenancy|monthly rent|rental payment|property|accommodation)\b/,
    category: "Rent",
    essential: true,
  },
  {
    pattern:
      /\b(?:insurance|geico|allstate|progressive|state farm|health insurance|premium|policy|coverage|indemnity|life insurance|motor insurance|insurance payment|insurance receipt)\b/,
    category: "Insurance",
    essential: true,
  },
  {
    pattern:
      /\b(?:dmv|tax|irs|fine|license|government|fee|passport|visa|court|legal|municipality|civic|revenue|council tax|income tax)\b/,
    category: "Government Fee",
    essential: true,
  },
  {
    pattern:
      /\b(?:uber|lyft|transit|metro|subway|bus|train|ticket|airline|flight|taxi|cab|commute|toll|transport|fuel bill|petrol bill)\b/,
    category: "Transportation",
    essential: true,
  },
  {
    pattern:
      /\b(?:grocery|groceries|safeway|kroger|supermarket|trader joe|whole foods|aldi|lidl|publix|food essentials|fresh market|produce|provisions)\b/,
    category: "Food Essentials",
    essential: true,
  },
  {
    pattern:
      /\b(?:repair|mechanic|plumber|plumbing|locksmith|handyman|maintenance|home repair|car repair|hvac|electrician|emergency service|service call|fix)\b/,
    category: "Emergency Repairs",
    essential: true,
  },
  {
    pattern:
      /\b(?:starbucks|coffee|restaurant|cafe|dining|mcdonald|burger|pizza|deli|sushi|donut|dessert|bakery|fast food|takeout|takeaway|food court)\b/,
    category: "Restaurant",
    essential: false,
  },
  {
    pattern: /\b(?:gaming|steam|playstation|xbox|nintendo|epic games|riot|game pass|game console|video game|esports)\b/,
    category: "Gaming",
    essential: false,
  },
  {
    pattern:
      /\b(?:netflix|spotify|hulu|disney|hbo|youtube premium|prime video|apple tv|streaming|subscription service)\b/,
    category: "Subscription Services",
    essential: false,
  },
  {
    pattern:
      /\b(?:movie|cinema|theater|theatre|concert|ticketmaster|theme park|amusement|entertainment venue|nightclub|bar)\b/,
    category: "Entertainment",
    essential: false,
  },
  {
    pattern:
      /\b(?:hotel|resort|vacation|cruise|booking|airbnb|trip|holiday|travel agency|leisure travel|tourist)\b/,
    category: "Vacation",
    essential: false,
  },
  {
    pattern:
      /\b(?:gucci|fendi|luxury|louis vuitton|prada|rolex|versace|burberry|high-end|designer|premium brand)\b/,
    category: "Luxury",
    essential: false,
  },
  {
    pattern:
      /\b(?:apple store|best buy|gadget|console|iphone|ipad|macbook|samsung|laptop purchase|new phone|electronics store)\b/,
    category: "Electronics",
    essential: false,
  },
  {
    pattern:
      /\b(?:zara|h&m|fashion|clothing store|shoes|apparel|mall|department store|footwear|accessories)\b/,
    category: "Fashion",
    essential: false,
  },
  {
    pattern:
      /\b(?:target|walmart|costco|amazon|ebay|shopping|retail|merchandise|wholesale|outlet|general store)\b/,
    category: "Shopping",
    essential: false,
  },
];

export interface ExpenseDecision {
  approved: boolean;
  essential: boolean;
  category: string;
  confidence: number;
  reason: string;
  model: string;
}

export function classifyExpense(text: string): ExpenseDecision {
  const corpus = text.toLowerCase();
  for (const rule of rules) {
    if (rule.pattern.test(corpus)) {
      return {
        approved: rule.essential,
        essential: rule.essential,
        category: rule.category,
        confidence: 0.95,
        reason: `The document matches the "${rule.category}" category, which counts as ${
          rule.essential ? "an essential" : "a non-essential"
        } expense.`,
        model: "keyword-rules (demo)",
      };
    }
  }
  return {
    approved: false,
    essential: false,
    category: "Shopping",
    confidence: 0.9,
    reason: "The document did not match any essential category, so it is treated as non-essential shopping.",
    model: "keyword-rules (demo)",
  };
}

// Pulls a merchant line and a total out of plain receipt text, like the OCR server does.
export function extractReceiptFields(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const amountMatch =
    text.match(/\b(?:total due|total|amount due|grand total)[:\s]*\$?\s*(\d+(?:\.\d{2})?)/i) ||
    text.match(/\b(?:subtotal|amount)[:\s]*\$?\s*(\d+(?:\.\d{2})?)/i);
  const dateMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/);
  return {
    merchant: (lines[0] || "Unknown merchant").slice(0, 40),
    amount: amountMatch ? Number(amountMatch[1]).toFixed(2) : "0.00",
    date: dateMatch ? dateMatch[0] : new Date().toISOString().slice(0, 10),
  };
}
