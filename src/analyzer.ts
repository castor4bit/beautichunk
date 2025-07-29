import type { Node, Program } from 'acorn';

export interface Variable {
  name: string;
  type: 'const' | 'let' | 'var';
  scope: Scope;
}

export interface FunctionInfo {
  name: string;
  params: string[];
  scope: Scope;
}

export interface Scope {
  parent: Scope | null;
  variables: Variable[];
  functions: FunctionInfo[];
}

export interface AnalysisResult {
  variables: Variable[];
  functions: FunctionInfo[];
  dependencies: Record<string, string[]>;
  globalReferences: Record<string, string[]>;
  scopes: Scope[];
}

export class Analyzer {
  private result: AnalysisResult;
  private currentScope: Scope;
  private scopeStack: Scope[];
  private currentFunctionName: string | null = null;

  constructor() {
    this.result = {
      variables: [],
      functions: [],
      dependencies: {},
      globalReferences: {},
      scopes: [],
    };
    this.currentScope = this.createScope(null);
    this.scopeStack = [this.currentScope];
    this.result.scopes.push(this.currentScope);
  }

  analyze(ast: Program): AnalysisResult {
    this.traverseNode(ast);
    return this.result;
  }

  private createScope(parent: Scope | null): Scope {
    return {
      parent,
      variables: [],
      functions: [],
    };
  }

  private enterScope(): void {
    const newScope = this.createScope(this.currentScope);
    this.currentScope = newScope;
    this.scopeStack.push(newScope);
    this.result.scopes.push(newScope);
  }

  private exitScope(): void {
    this.scopeStack.pop();
    this.currentScope = this.scopeStack[this.scopeStack.length - 1];
  }

  private traverseNode(node: Node): void {
    if (!node) return;

    switch (node.type) {
      case 'Program':
        this.traverseProgram(node as Program);
        break;
      case 'VariableDeclaration':
        this.analyzeVariableDeclaration(node as any);
        break;
      case 'FunctionDeclaration':
        this.analyzeFunctionDeclaration(node as any);
        break;
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        this.analyzeFunctionExpression(node as any);
        break;
      case 'CallExpression':
        this.analyzeCallExpression(node as any);
        break;
      case 'Identifier':
        this.analyzeIdentifier(node as any);
        break;
      case 'MemberExpression':
        this.analyzeMemberExpression(node as any);
        break;
      case 'BlockStatement':
        this.traverseArray((node as any).body);
        break;
      default:
        this.traverseNodeProperties(node);
    }
  }

  private traverseProgram(program: Program): void {
    this.traverseArray(program.body);
  }

  private traverseArray(nodes: Node[]): void {
    for (const node of nodes) {
      this.traverseNode(node);
    }
  }

  private traverseNodeProperties(node: Node): void {
    for (const key in node) {
      const value = (node as any)[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          this.traverseArray(value);
        } else if (value.type) {
          this.traverseNode(value);
        }
      }
    }
  }

  private analyzeVariableDeclaration(node: any): void {
    const { kind, declarations } = node;
    for (const declarator of declarations) {
      if (declarator.id.type === 'Identifier') {
        const variable: Variable = {
          name: declarator.id.name,
          type: kind,
          scope: this.currentScope,
        };
        this.result.variables.push(variable);
        this.currentScope.variables.push(variable);
      }
      if (declarator.init) {
        this.traverseNode(declarator.init);
      }
    }
  }

  private analyzeFunctionDeclaration(node: any): void {
    const functionInfo: FunctionInfo = {
      name: node.id.name,
      params: node.params.map((param: any) => param.name),
      scope: this.currentScope,
    };
    this.result.functions.push(functionInfo);
    this.currentScope.functions.push(functionInfo);

    // Enter function scope
    this.enterScope();

    // Store current function name for dependency tracking
    this.currentFunctionName = node.id.name;

    // Add parameters as variables in the function scope
    for (const param of node.params) {
      if (param.type === 'Identifier') {
        const paramVar: Variable = {
          name: param.name,
          type: 'var',
          scope: this.currentScope,
        };
        this.currentScope.variables.push(paramVar);
      }
    }

    // Traverse function body
    this.traverseNode(node.body);

    // Clear current function name
    this.currentFunctionName = null;

    // Exit function scope
    this.exitScope();
  }

  private analyzeFunctionExpression(node: any): void {
    this.enterScope();

    // Add parameters as variables in the function scope
    for (const param of node.params) {
      if (param.type === 'Identifier') {
        const paramVar: Variable = {
          name: param.name,
          type: 'var',
          scope: this.currentScope,
        };
        this.currentScope.variables.push(paramVar);
      }
    }

    this.traverseNode(node.body);
    this.exitScope();
  }

  private analyzeCallExpression(node: any): void {
    if (node.callee.type === 'Identifier') {
      const calleeName = node.callee.name;

      if (this.currentFunctionName) {
        if (!this.result.dependencies[this.currentFunctionName]) {
          this.result.dependencies[this.currentFunctionName] = [];
        }
        if (!this.result.dependencies[this.currentFunctionName].includes(calleeName)) {
          this.result.dependencies[this.currentFunctionName].push(calleeName);
        }
      }
    }

    this.traverseNode(node.callee);
    this.traverseArray(node.arguments);
  }

  private analyzeIdentifier(node: any): void {
    const name = node.name;

    if (this.currentFunctionName && !this.isLocalVariable(name)) {
      if (!this.result.globalReferences[this.currentFunctionName]) {
        this.result.globalReferences[this.currentFunctionName] = [];
      }
      if (!this.result.globalReferences[this.currentFunctionName].includes(name)) {
        this.result.globalReferences[this.currentFunctionName].push(name);
      }
    }
  }

  private analyzeMemberExpression(node: any): void {
    // Handle object.property access
    if (node.object.type === 'Identifier') {
      const objectName = node.object.name;

      if (this.currentFunctionName && !this.isLocalVariable(objectName)) {
        if (!this.result.globalReferences[this.currentFunctionName]) {
          this.result.globalReferences[this.currentFunctionName] = [];
        }
        if (!this.result.globalReferences[this.currentFunctionName].includes(objectName)) {
          this.result.globalReferences[this.currentFunctionName].push(objectName);
        }
      }
    }

    this.traverseNode(node.object);
    if (node.computed) {
      this.traverseNode(node.property);
    }
  }

  private isLocalVariable(name: string): boolean {
    // A variable is local if it's defined in the current function scope or its parameters
    // Global scope variables are not considered local to functions
    let scope: Scope | null = this.currentScope;

    // Skip to the function scope if we're in one
    while (scope?.parent) {
      if (scope.variables.some((v) => v.name === name)) {
        return true;
      }
      // Don't check parent scopes beyond the function scope
      if (scope.functions.length > 0 || this.currentFunctionName) {
        // Check if this variable is a parameter
        const currentFunc = this.result.functions.find((f) => f.name === this.currentFunctionName);
        if (currentFunc?.params.includes(name)) {
          return true;
        }
        return false;
      }
      scope = scope.parent;
    }
    return false;
  }
}
