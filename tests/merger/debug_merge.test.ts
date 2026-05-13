import { describe, expect, it } from "vitest";
import { HeuristicMergeStrategy } from "../../src/merger/HeuristicMergeStrategy";
import { MarkerMergeStrategy } from "../../src/merger/MarkerMergeStrategy";

// Sample content without markers
const contentWithoutMarkers = `public class LegacyFrame extends JFrame {
  private JButton saveButton;
  private JLabel titleLabel;

  public LegacyFrame() {
    setTitle("Legacy");
    saveButton = new JButton("Save");
    add(saveButton);
  }
}`;

// Sample content with markers
const contentWithMarkers = `public class MainFrame extends JFrame {
// @swingbuilder:generated:fields begin
  private JButton oldButton;
// @swingbuilder:generated:fields end

// @swingbuilder:generated:constructor begin
  public MainFrame() {
    setTitle("Old");
  }
// @swingbuilder:generated:constructor end
}`;

const generatedWithMarkers = `public class MainFrame extends JFrame {
// @swingbuilder:generated:fields begin
  private JButton newButton;
// @swingbuilder:generated:fields end

// @swingbuilder:generated:constructor begin
  public MainFrame() {
    setTitle("New");
  }
// @swingbuilder:generated:constructor end
}`;

describe("MarkerMergeStrategy", () => {
  it("has correct name", () => {
    const strategy = new MarkerMergeStrategy();
    expect(strategy.name).toBe("marker");
  });

  it("canMerge returns true for content with markers", () => {
    const strategy = new MarkerMergeStrategy();
    expect(strategy.canMerge?.(contentWithMarkers)).toBe(true);
  });

  it("canMerge returns false for content without markers", () => {
    const strategy = new MarkerMergeStrategy();
    expect(strategy.canMerge?.(contentWithoutMarkers)).toBe(false);
  });

  it("merge returns success when markers match", () => {
    const strategy = new MarkerMergeStrategy();
    const result = strategy.merge(contentWithMarkers, generatedWithMarkers);
    expect(result.success).toBe(true);
    expect(result.hadMarkers).toBe(true);
    expect(result.replacedSections).toContain("fields");
    expect(result.replacedSections).toContain("constructor");
  });

  it("merge returns failure when original has no markers", () => {
    const strategy = new MarkerMergeStrategy();
    const result = strategy.merge(contentWithoutMarkers, generatedWithMarkers);
    expect(result.success).toBe(false);
    expect(result.hadMarkers).toBe(false);
    expect(result.message).toContain("does not contain markers");
  });

  it("merge returns failure when generated has no markers", () => {
    const strategy = new MarkerMergeStrategy();
    const result = strategy.merge(contentWithMarkers, contentWithoutMarkers);
    expect(result.success).toBe(false);
    expect(result.hadMarkers).toBe(true);
    expect(result.message).toContain("does not contain matching markers");
  });
});

describe("HeuristicMergeStrategy", () => {
  it("has correct name", () => {
    const strategy = new HeuristicMergeStrategy();
    expect(strategy.name).toBe("heuristic");
  });

  it("canMerge returns true for any content", () => {
    const strategy = new HeuristicMergeStrategy();
    expect(strategy.canMerge?.(contentWithoutMarkers)).toBe(true);
    expect(strategy.canMerge?.(contentWithMarkers)).toBe(true);
    expect(strategy.canMerge?.("")).toBe(true);
  });

  it("merge detects GUI regions and replaces them", () => {
    const strategy = new HeuristicMergeStrategy();
    const original = `public class Frame extends JFrame {
  private JButton saveButton;
  saveButton = new JButton("Save");
  add(saveButton);
}`;
    const generated = `public class Frame extends JFrame {
  private JButton newButton;
  newButton = new JButton("New");
  add(newButton);
}`;
    const result = strategy.merge(original, generated);
    expect(result.success).toBe(true);
    expect(result.hadMarkers).toBe(false);
    expect(result.replacedSections.length).toBeGreaterThan(0);
  });

  it("merge returns failure when no GUI regions detected", () => {
    const strategy = new HeuristicMergeStrategy();
    const result = strategy.merge("no GUI code here", "no GUI code either");
    expect(result.success).toBe(false);
    expect(result.message).toContain("Unable to detect GUI regions");
  });

  it("merge detects multiple GUI regions", () => {
    const strategy = new HeuristicMergeStrategy();
    const original = `public class Frame extends JFrame {
  private JButton button1;
  private JLabel label1;
  button1 = new JButton("Button");
  label1 = new JLabel("Label");
  add(button1);
  add(label1);
}`;
    const generated = `public class Frame extends JFrame {
  private JButton button2;
  private JLabel label2;
  button2 = new JButton("Button2");
  label2 = new JLabel("Label2");
  add(button2);
  add(label2);
}`;
    const result = strategy.merge(original, generated);
    expect(result.success).toBe(true);
    expect(result.detectedGuiRegions.length).toBeGreaterThan(0);
  });
});
