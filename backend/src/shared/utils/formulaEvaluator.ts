/**
 * Sandboxed Expression Evaluator for Salary Calculation Formulas
 * Evaluates math expressions containing numbers, operators (+, -, *, /, %), parentheses,
 * and rule code identifiers without using dangerous raw eval() or Function().
 */

export interface EvaluationContext {
  [ruleCode: string]: number;
}

export const extractIdentifiersFromFormula = (formula: string): string[] => {
  const tokens = formula.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
  return Array.from(new Set(tokens));
};

export const evaluateFormula = (formula: string, context: EvaluationContext): number => {
  if (!formula || formula.trim() === "") {
    return 0;
  }

  // Tokenize
  const tokenRegex = /\s*([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[\+\-\*\/\(\)\%])\s*/g;
  const tokens: string[] = [];
  let match: RegExpExecArray | null;

  let lastIndex = 0;
  while ((match = tokenRegex.exec(formula)) !== null) {
    if (match.index !== lastIndex) {
      throw new Error(`Invalid token in formula "${formula}" near index ${lastIndex}`);
    }
    tokens.push(match[1]);
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex !== formula.length) {
    throw new Error(`Unexpected character in formula "${formula}" near index ${lastIndex}`);
  }

  // Shunting-yard algorithm to convert infix to RPN (Reverse Polish Notation)
  const precedence: Record<string, number> = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    "%": 2,
  };

  const outputQueue: (number | string)[] = [];
  const operatorStack: string[] = [];

  for (const token of tokens) {
    if (!isNaN(Number(token))) {
      outputQueue.push(Number(token));
    } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) {
      if (token in context) {
        outputQueue.push(context[token]);
      } else {
        throw new Error(`Configuration Error: Rule code "${token}" referenced in formula before being computed`);
      }
    } else if (token in precedence) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== "(" &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
    } else if (token === "(") {
      operatorStack.push(token);
    } else if (token === ")") {
      let foundMatchingParen = false;
      while (operatorStack.length > 0) {
        const top = operatorStack.pop()!;
        if (top === "(") {
          foundMatchingParen = true;
          break;
        }
        outputQueue.push(top);
      }
      if (!foundMatchingParen) {
        throw new Error(`Mismatched parentheses in formula "${formula}"`);
      }
    }
  }

  while (operatorStack.length > 0) {
    const top = operatorStack.pop()!;
    if (top === "(" || top === ")") {
      throw new Error(`Mismatched parentheses in formula "${formula}"`);
    }
    outputQueue.push(top);
  }

  // Evaluate RPN
  const evalStack: number[] = [];

  for (const item of outputQueue) {
    if (typeof item === "number") {
      evalStack.push(item);
    } else {
      if (evalStack.length < 2) {
        throw new Error(`Invalid expression in formula "${formula}"`);
      }
      const b = evalStack.pop()!;
      const a = evalStack.pop()!;

      switch (item) {
        case "+":
          evalStack.push(a + b);
          break;
        case "-":
          evalStack.push(a - b);
          break;
        case "*":
          evalStack.push(a * b);
          break;
        case "/":
          if (b === 0) {
            throw new Error(`Division by zero in formula "${formula}"`);
          }
          evalStack.push(a / b);
          break;
        case "%":
          evalStack.push(a % b);
          break;
        default:
          throw new Error(`Unknown operator "${item}"`);
      }
    }
  }

  if (evalStack.length !== 1) {
    throw new Error(`Invalid expression result for formula "${formula}"`);
  }

  return evalStack[0];
};
