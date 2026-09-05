import { extractIdentifiersFromFormula } from "./formulaEvaluator.js";

export interface RuleDependencyNode {
  code: string;
  computationMethod: string;
  basedOnCode?: string | null;
  formula?: string | null;
}

export const detectCircularDependencies = (rules: RuleDependencyNode[]): void => {
  const graph: Map<string, string[]> = new Map();

  for (const rule of rules) {
    const dependencies: string[] = [];

    if (rule.computationMethod === "percentage" && rule.basedOnCode) {
      dependencies.push(rule.basedOnCode);
    } else if (rule.computationMethod === "formula" && rule.formula) {
      const extracted = extractIdentifiersFromFormula(rule.formula);
      dependencies.push(...extracted);
    }

    graph.set(rule.code, dependencies);
  }

  const visited: Map<string, "UNVISITED" | "VISITING" | "VISITED"> = new Map();
  for (const ruleCode of graph.keys()) {
    visited.set(ruleCode, "UNVISITED");
  }

  const path: string[] = [];

  const dfs = (node: string): void => {
    const status = visited.get(node);

    if (status === "VISITING") {
      const cycleIndex = path.indexOf(node);
      const cyclePath = path.slice(cycleIndex).concat(node).join(" -> ");
      throw new Error(`Circular dependency detected in salary rules: ${cyclePath}`);
    }

    if (status === "VISITED") {
      return;
    }

    visited.set(node, "VISITING");
    path.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (graph.has(neighbor)) {
        dfs(neighbor);
      }
    }

    path.pop();
    visited.set(node, "VISITED");
  };

  for (const ruleCode of graph.keys()) {
    if (visited.get(ruleCode) === "UNVISITED") {
      dfs(ruleCode);
    }
  }
};
