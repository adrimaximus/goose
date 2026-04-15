import { describe, it, expect } from "vitest";
import { useTestDriver } from "./lib/setup";
import { navigateTo, waitForAbsent } from "./lib/fixtures";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const SKILL_NAME = "e2e-test-skill-crud";
const SKILL_DESCRIPTION = "A skill created by e2e tests";
const SKILL_INSTRUCTIONS = "Use this skill for testing purposes only.";
const SKILL_UPDATED_DESCRIPTION = "An updated description for e2e tests";

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

const SEL = {
  // Nav
  navSkills: 'data-testid="nav-skills"',

  // Skills page
  newButton: '[data-testid="skills-new-button"]',
  searchInput: 'input[type="search"]',
  anyCard: '[data-testid^="skill-card-"]',

  // Per-skill selectors (parameterised)
  card: (name: string) => `[data-testid="skill-card-${name}"]`,
  optionsMenu: (name: string) => `[data-testid="skill-options-${name}"]`,

  // Skill form
  formName: '[data-testid="skill-form-name"]',
  formDescription: '[data-testid="skill-form-description"]',
  formInstructions: '[data-testid="skill-form-instructions"]',
  formSubmit: '[data-testid="skill-form-submit"]',
  formSubmitEnabled: '[data-testid="skill-form-submit"]:not([disabled])',

  // Options menu items
  menuEdit: '[data-testid="skill-menu-edit"]',
  menuDelete: '[data-testid="skill-menu-delete"]',

  // Delete confirmation dialog
  deleteConfirm: '[data-testid="skill-delete-confirm"]',
  deleteCancel: '[data-testid="skill-delete-cancel"]',
} as const;

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

describe("Skills", () => {
  const testDriver = useTestDriver();

  async function goToSkills() {
    await navigateTo(testDriver, "nav-skills", "Skills");
  }

  /**
   * Open the per-skill options dropdown.
   * Radix UI closes the menu on a synthetic pointer-click, so we focus the
   * trigger with click() then open it with keypress Enter.
   */
  async function openOptionsMenu(skillName: string) {
    const trigger = SEL.optionsMenu(skillName);
    await testDriver.click(trigger);
    await testDriver.keypress(trigger, "Enter");
  }

  /**
   * Ensure the test skill exists before tests that depend on it.
   * Creates it from scratch if it was deleted by a prior test run.
   */
  async function ensureSkillExists() {
    if ((await testDriver.count(SEL.card(SKILL_NAME))) > 0) return;

    await testDriver.click(SEL.newButton);
    await testDriver.fill(SEL.formName, SKILL_NAME);
    await testDriver.fill(SEL.formDescription, SKILL_DESCRIPTION);
    await testDriver.fill(SEL.formInstructions, SKILL_INSTRUCTIONS);
    await testDriver.click(SEL.formSubmit);
    await testDriver.waitForText(SKILL_NAME, { selector: SEL.card(SKILL_NAME) });
  }

  // -------------------------------------------------------------------------

  it("creates a new skill", async () => {
    await goToSkills();

    await testDriver.click(SEL.newButton);
    await testDriver.fill(SEL.formName, SKILL_NAME);
    await testDriver.fill(SEL.formDescription, SKILL_DESCRIPTION);
    await testDriver.fill(SEL.formInstructions, SKILL_INSTRUCTIONS);

    expect(await testDriver.count(SEL.formSubmitEnabled)).toBe(1);

    await testDriver.click(SEL.formSubmit);
    await testDriver.waitForText(SKILL_NAME, { selector: SEL.card(SKILL_NAME) });

    expect(await testDriver.count(SEL.card(SKILL_NAME))).toBe(1);

    const cardText = await testDriver.getText(SEL.card(SKILL_NAME));
    expect(cardText).toContain(SKILL_NAME);
    expect(cardText).toContain(SKILL_DESCRIPTION);
  });

  it("edits an existing skill", async () => {
    await goToSkills();
    await ensureSkillExists();

    await openOptionsMenu(SKILL_NAME);
    await testDriver.click(SEL.menuEdit);

    // Inputs return no innerText — assert the pre-filled value via attribute selector
    expect(
      await testDriver.count(`${SEL.formName}[value="${SKILL_NAME}"]`),
    ).toBe(1);

    await testDriver.fill(SEL.formDescription, SKILL_UPDATED_DESCRIPTION);
    await testDriver.click(SEL.formSubmit);

    await testDriver.waitForText(SKILL_UPDATED_DESCRIPTION, {
      selector: SEL.card(SKILL_NAME),
    });

    const cardText = await testDriver.getText(SEL.card(SKILL_NAME));
    expect(cardText).toContain(SKILL_UPDATED_DESCRIPTION);
  });

  it("searches for a skill by name", async () => {
    await goToSkills();
    await ensureSkillExists();

    const totalBefore = await testDriver.count(SEL.anyCard);
    expect(totalBefore).toBeGreaterThan(1);

    await testDriver.fill(SEL.searchInput, SKILL_NAME);
    await testDriver.waitForText(SKILL_NAME, { selector: SEL.card(SKILL_NAME) });

    expect(await testDriver.count(SEL.anyCard)).toBe(1);
    expect(await testDriver.count(SEL.card(SKILL_NAME))).toBe(1);

    await testDriver.fill(SEL.searchInput, "");

    expect(await testDriver.count(SEL.anyCard)).toBe(totalBefore);
  });

  it("deletes a skill", async () => {
    await goToSkills();
    await ensureSkillExists();

    const countBefore = await testDriver.count(SEL.anyCard);

    await openOptionsMenu(SKILL_NAME);
    await testDriver.click(SEL.menuDelete);

    expect(await testDriver.count(SEL.deleteConfirm)).toBe(1);
    expect(await testDriver.count(SEL.deleteCancel)).toBe(1);

    await testDriver.click(SEL.deleteConfirm);

    await waitForAbsent(testDriver, SEL.card(SKILL_NAME));

    expect(await testDriver.count(SEL.card(SKILL_NAME))).toBe(0);
    expect(await testDriver.count(SEL.anyCard)).toBe(countBefore - 1);
  });
});
