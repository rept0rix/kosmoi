# ⚠️ DANGER ZONE: Expensive Scripts

The scripts in this directory are **DEPRECATED** and **QUARANTINED** because they incur significant costs on the Google Cloud Platform (specifically the Places API).

## Why are they here?

- `harvest_google_full.js`: Performs an "Omniscient" scan of the entire island across multiple categories. This can trigger thousands of API calls (Text Search + Photo Downloads) in a single run, costing ~$100+ per execution.
- `enrich_from_google.js`: Enriches existing data by searching Google Places. Also very expensive if run on a large dataset.
- `enrich_with_details.js`: Similar enrichment logic.

## How to use them (if you must)

Only run these scripts if you explicitly intend to perform a high-cost operation and have approved the budget.
To run them, you must move them back to the `scripts/` root or run them explicitly from this directory, understanding the consequences.

**RECOMMENDATION:** Use targeted enrichment or the `Context7` based approach instead of these brute-force scripts.
