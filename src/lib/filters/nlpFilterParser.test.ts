import assert from "node:assert/strict";
import {
  parseCompendiumQuery,
  parseItemQuery,
  parseSpellQuery,
  buildItemFilterPatch,
  buildSpellFilterPatch,
} from "./nlpFilterParser";

export function runNlpFilterParserTests() {
  console.log("  Testing nlpFilterParser...");

  // 1. "Show me rare weapons that require attunement"
  {
    const res = parseCompendiumQuery(
      "Show me rare weapons that require attunement",
      "items",
    );
    assert.equal(res.hasIntents, true, "Should detect intents");
    assert.equal(res.targetTab, "items", "Should target items tab");
    assert.equal(res.residualQuery, "", "Residual query should be empty");
    assert.deepEqual(res.itemPatch.rarities, ["Rare"]);
    assert.deepEqual(res.itemPatch.categories, ["Weapon"]);
    assert.equal(res.itemPatch.attunement, "requires");
  }

  // 2. "Concentration evocation spells for level 3 wizards"
  {
    const res = parseCompendiumQuery(
      "Concentration evocation spells for level 3 wizards",
      "items", // Even if current tab is items, it detects spells tab!
    );
    assert.equal(res.hasIntents, true);
    assert.equal(res.targetTab, "spells");
    assert.equal(res.residualQuery, "");
    assert.equal(res.spellPatch.concentrationOnly, true);
    assert.deepEqual(res.spellPatch.schools, ["Evocation"]);
    assert.deepEqual(res.spellPatch.levels, [3]);
    assert.deepEqual(res.spellPatch.classes, ["Wizard"]);
  }

  // 3. "Uncommon wondrous items not requiring attunement"
  {
    const res = parseItemQuery(
      "Uncommon wondrous items not requiring attunement",
    );
    assert.equal(res.hasIntents, true);
    assert.equal(res.residualQuery, "");
    assert.deepEqual(res.itemPatch.rarities, ["Uncommon"]);
    assert.deepEqual(res.itemPatch.categories, ["Wondrous Item"]);
    assert.equal(res.itemPatch.attunement, "none");
  }

  // 4. "Bonus action healing spells under 4th level"
  {
    const res = parseSpellQuery("Bonus action healing spells under 4th level");
    assert.equal(res.hasIntents, true);
    assert.equal(res.targetTab, "spells");
    assert.equal(res.residualQuery, "healing");
    assert.deepEqual(res.spellPatch.castingTimes, ["Bonus Action"]);
    assert.deepEqual(res.spellPatch.levels, [0, 1, 2, 3]);
  }

  // 5. "legendary flame weapon"
  {
    const res = parseItemQuery("legendary flame weapon");
    assert.equal(res.hasIntents, true);
    assert.equal(res.targetTab, "items");
    assert.equal(res.residualQuery, "flame");
    assert.deepEqual(res.itemPatch.rarities, ["Legendary"]);
    assert.deepEqual(res.itemPatch.categories, ["Weapon"]);
  }

  // 6. "ritual divination spells for cleric or bard"
  {
    const res = parseSpellQuery("ritual divination spells for cleric or bard");
    assert.equal(res.hasIntents, true);
    assert.equal(res.residualQuery, "");
    assert.equal(res.spellPatch.ritualOnly, true);
    assert.deepEqual(res.spellPatch.schools, ["Divination"]);
    assert.ok(res.spellPatch.classes?.includes("Cleric"));
    assert.ok(res.spellPatch.classes?.includes("Bard"));
  }

  // 7. "paladin level 5 or higher"
  {
    const res = parseSpellQuery("paladin level 5 or higher");
    assert.equal(res.hasIntents, true);
    assert.deepEqual(res.spellPatch.classes, ["Paladin"]);
    assert.deepEqual(res.spellPatch.levels, [5, 6, 7, 8, 9]);
    assert.equal(res.residualQuery, "");
  }

  // 8. "unattuned very rare rings"
  {
    const res = parseItemQuery("unattuned very rare rings");
    assert.equal(res.hasIntents, true);
    assert.equal(res.itemPatch.attunement, "none");
    assert.deepEqual(res.itemPatch.rarities, ["Very Rare"]);
    assert.deepEqual(res.itemPatch.categories, ["Ring"]);
    assert.equal(res.residualQuery, "");
  }

  // 9. Plain query with no intents ("fireball", "vorpal sword")
  {
    const res = parseCompendiumQuery("fireball", "spells");
    assert.equal(res.hasIntents, false);
    assert.equal(res.chips.length, 0);
    assert.equal(res.residualQuery, "fireball");
  }

  // 10. Price range extraction: "items under 500 gp" & "between 100 and 500 gp"
  {
    const res1 = parseItemQuery("items under 500 gp");
    assert.equal(res1.hasIntents, true);
    assert.equal(res1.itemPatch.maxPrice, 500);

    const res2 = parseItemQuery("between 100 and 500 gp");
    assert.equal(res2.hasIntents, true);
    assert.equal(res2.itemPatch.minPrice, 100);
    assert.equal(res2.itemPatch.maxPrice, 500);
  }

  // 11. Reaction spell
  {
    const res = parseSpellQuery("reaction spells");
    assert.equal(res.hasIntents, true);
    assert.deepEqual(res.spellPatch.castingTimes, ["Reaction"]);
    assert.equal(res.residualQuery, "");
  }

  // 12. Individual chip dismissal patch generation
  {
    const res = parseItemQuery("legendary flame weapon");
    // Suppose user dismisses 'weapon' category chip
    const filteredChips = res.chips.filter((c) => c.facet !== "category");
    const patch = buildItemFilterPatch(filteredChips);
    assert.deepEqual(patch.rarities, ["Legendary"]);
    assert.equal(patch.categories, undefined);
  }

  // 13. "frost armor without attunement" -> residual: "frost"
  {
    const res = parseItemQuery("frost armor without attunement");
    assert.equal(res.hasIntents, true);
    assert.equal(res.residualQuery, "frost");
    assert.deepEqual(res.itemPatch.categories, ["Armor"]);
    assert.equal(res.itemPatch.attunement, "none");
  }

  // 14. Ordinal spell level: "3rd level transmutation spells"
  {
    const res = parseSpellQuery("3rd level transmutation spells");
    assert.equal(res.hasIntents, true);
    assert.deepEqual(res.spellPatch.levels, [3]);
    assert.deepEqual(res.spellPatch.schools, ["Transmutation"]);
    assert.equal(res.residualQuery, "");
  }

  // 15. Empty & whitespace strings
  {
    const emptyRes = parseCompendiumQuery("", "items");
    assert.equal(emptyRes.hasIntents, false);
    assert.equal(emptyRes.residualQuery, "");
    assert.equal(emptyRes.chips.length, 0);

    const spaceRes = parseCompendiumQuery("   ", "spells");
    assert.equal(spaceRes.hasIntents, false);
    assert.equal(spaceRes.residualQuery, "");
  }

  // 16. buildSpellFilterPatch test
  {
    const res = parseSpellQuery("Concentration evocation spells for level 3 wizards");
    const patch = buildSpellFilterPatch(res.chips);
    assert.equal(patch.concentrationOnly, true);
    assert.deepEqual(patch.schools, ["Evocation"]);
    assert.deepEqual(patch.levels, [3]);
    assert.deepEqual(patch.classes, ["Wizard"]);
  }

  // 17. Sub-millisecond execution benchmark
  {
    const t0 = performance.now();
    for (let i = 0; i < 200; i++) {
      parseCompendiumQuery(
        "Bonus action healing spells under 4th level for cleric",
        "spells",
      );
    }
    const duration = performance.now() - t0;
    const avgMs = duration / 200;
    assert.ok(avgMs < 1.0, `Average parse time should be sub-millisecond, got ${avgMs}ms`);
  }
}
