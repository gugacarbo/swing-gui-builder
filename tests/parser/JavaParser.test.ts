import { describe, expect, it } from "vitest";
import { parseJavaFile } from "../../src/parser/JavaParser";

describe("parseJavaFile", () => {
  it("parses GUI inheritance, symbol table, properties, and add() hierarchy", () => {
    const javaContent = `
      package com.example.ui;

      import javax.swing.*;
      import java.awt.*;

      public class MainWindow extends JFrame {
        private JButton saveButton;
        private JPanel rootPanel;
        private BorderLayout rootLayout;

        public MainWindow() {
          saveButton = new JButton("Save");
          JButton localButton = new JButton("Local");
          rootPanel = new JPanel();
          rootLayout = new BorderLayout();
          rootPanel.setLayout(rootLayout);
          saveButton.setBounds(10, 20, 120, 40);
          saveButton.setText("Store");
          rootPanel.add(saveButton);
          this.add(rootPanel);
          this.setLayout(null);
        }
      }
    `;

    const parsed = parseJavaFile(javaContent);

    expect(parsed.packageName).toBe("com.example.ui");
    expect(parsed.classInfo).toEqual({
      className: "MainWindow",
      extendsClass: "JFrame",
      isGuiClass: true,
    });

    expect(parsed.symbolTable).toEqual({
      localButton: "JButton",
      rootLayout: "BorderLayout",
      rootPanel: "JPanel",
      saveButton: "JButton",
    });

    const componentsByName = new Map(
      parsed.components.map((component) => [component.variableName, component]),
    );
    expect([...componentsByName.keys()]).toEqual(["localButton", "rootPanel", "saveButton"]);

    expect(componentsByName.get("rootPanel")).toMatchObject({
      type: "JPanel",
      properties: { layout: "BorderLayout" },
      childVariableNames: ["saveButton"],
    });
    expect(componentsByName.get("saveButton")).toMatchObject({
      type: "JButton",
      parentVariableName: "rootPanel",
      properties: {
        bounds: { x: 10, y: 20, width: 120, height: 40 },
        text: "Store",
      },
    });

    expect(parsed.parentChildRelationships).toEqual([
      { parentVariableName: "rootPanel", childVariableName: "saveButton" },
    ]);
    expect(parsed.rootLayout).toBe("null");
  });

  it("detects contentPane receiver and keeps root-level component parent undefined", () => {
    const javaContent = `
      import javax.swing.*;
      import java.awt.*;

      public class MainWindow extends JFrame {
        private JPanel panel;
        private JButton button;

        public MainWindow() {
          panel = new JPanel();
          button = new JButton("Click");
          panel.add(button);
          getContentPane().add(panel);
          getContentPane().setLayout(new FlowLayout());
        }
      }
    `;

    const parsed = parseJavaFile(javaContent);
    const componentsByName = new Map(
      parsed.components.map((component) => [component.variableName, component]),
    );

    expect(parsed.rootLayout).toBe("FlowLayout");
    expect(componentsByName.get("panel")?.parentVariableName).toBeUndefined();
    expect(componentsByName.get("panel")?.childVariableNames).toEqual(["button"]);
    expect(componentsByName.get("button")?.parentVariableName).toBe("panel");
    expect(parsed.parentChildRelationships).toEqual([
      { parentVariableName: "panel", childVariableName: "button" },
    ]);
  });

  it("marks class as GUI when extending JPanel and resolves this.member.add()", () => {
    const javaContent = `
      import javax.swing.*;
      import java.awt.*;

      public class EditorPanel extends JPanel {
        private JPanel container;
        private JButton actionButton;

        public EditorPanel() {
          container = new JPanel();
          actionButton = new JButton("Do");
          this.container.add(actionButton);
          this.setLayout(new BorderLayout());
        }
      }
    `;

    const parsed = parseJavaFile(javaContent);
    const componentsByName = new Map(
      parsed.components.map((component) => [component.variableName, component]),
    );

    expect(parsed.classInfo).toEqual({
      className: "EditorPanel",
      extendsClass: "JPanel",
      isGuiClass: true,
    });
    expect(parsed.rootLayout).toBe("BorderLayout");
    expect(componentsByName.get("actionButton")?.parentVariableName).toBe("container");
    expect(parsed.parentChildRelationships).toEqual([
      { parentVariableName: "container", childVariableName: "actionButton" },
    ]);
  });

  it("marks non-GUI inheritance as non-GUI while still extracting known Swing symbols", () => {
    const javaContent = `
      import javax.swing.*;

      public class Helper extends Object {
        private JButton helperButton;
      }
    `;

    const parsed = parseJavaFile(javaContent);

    expect(parsed.classInfo.isGuiClass).toBe(false);
    expect(parsed.classInfo.extendsClass).toBe("Object");
    expect(parsed.symbolTable).toEqual({ helperButton: "JButton" });
    expect(parsed.components).toHaveLength(1);
    expect(parsed.components[0]).toMatchObject({
      variableName: "helperButton",
      type: "JButton",
    });
  });
});
