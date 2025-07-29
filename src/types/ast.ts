import type { Node } from 'acorn';

export interface BaseNode extends Node {
  type: string;
}

export interface Identifier extends BaseNode {
  type: 'Identifier';
  name: string;
}

export interface VariableDeclaration extends BaseNode {
  type: 'VariableDeclaration';
  kind: 'const' | 'let' | 'var';
  declarations: VariableDeclarator[];
}

export interface VariableDeclarator extends BaseNode {
  type: 'VariableDeclarator';
  id: Identifier | Pattern;
  init: Expression | null;
}

export interface FunctionDeclaration extends BaseNode {
  type: 'FunctionDeclaration';
  id: Identifier;
  params: Pattern[];
  body: BlockStatement;
}

export interface FunctionExpression extends BaseNode {
  type: 'FunctionExpression';
  id: Identifier | null;
  params: Pattern[];
  body: BlockStatement;
}

export interface ArrowFunctionExpression extends BaseNode {
  type: 'ArrowFunctionExpression';
  params: Pattern[];
  body: BlockStatement | Expression;
}

export interface CallExpression extends BaseNode {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface MemberExpression extends BaseNode {
  type: 'MemberExpression';
  object: Expression;
  property: Expression | Identifier;
  computed: boolean;
}

export interface BlockStatement extends BaseNode {
  type: 'BlockStatement';
  body: Statement[];
}

export interface ExpressionStatement extends BaseNode {
  type: 'ExpressionStatement';
  expression: Expression;
}

export type Pattern = Identifier | ObjectPattern | ArrayPattern | RestElement | AssignmentPattern;

export interface ObjectPattern extends BaseNode {
  type: 'ObjectPattern';
  properties: (Property | RestElement)[];
}

export interface ArrayPattern extends BaseNode {
  type: 'ArrayPattern';
  elements: (Pattern | null)[];
}

export interface RestElement extends BaseNode {
  type: 'RestElement';
  argument: Pattern;
}

export interface AssignmentPattern extends BaseNode {
  type: 'AssignmentPattern';
  left: Pattern;
  right: Expression;
}

export interface Property extends BaseNode {
  type: 'Property';
  key: Expression;
  value: Pattern | Expression;
  kind: 'init' | 'get' | 'set';
  method: boolean;
  shorthand: boolean;
  computed: boolean;
}

export type Expression =
  | Identifier
  | Literal
  | ArrayExpression
  | ObjectExpression
  | FunctionExpression
  | ArrowFunctionExpression
  | UnaryExpression
  | UpdateExpression
  | BinaryExpression
  | AssignmentExpression
  | LogicalExpression
  | MemberExpression
  | ConditionalExpression
  | CallExpression
  | NewExpression
  | SequenceExpression
  | ThisExpression
  | TemplateLiteral
  | TaggedTemplateExpression
  | ClassExpression
  | MetaProperty
  | AwaitExpression
  | ImportExpression
  | ChainExpression
  | YieldExpression;

export interface Literal extends BaseNode {
  type: 'Literal';
  value: string | boolean | null | number | RegExp;
  raw: string;
}

export interface ArrayExpression extends BaseNode {
  type: 'ArrayExpression';
  elements: (Expression | SpreadElement | null)[];
}

export interface ObjectExpression extends BaseNode {
  type: 'ObjectExpression';
  properties: (Property | SpreadElement)[];
}

export interface SpreadElement extends BaseNode {
  type: 'SpreadElement';
  argument: Expression;
}

export interface UnaryExpression extends BaseNode {
  type: 'UnaryExpression';
  operator: string;
  prefix: boolean;
  argument: Expression;
}

export interface UpdateExpression extends BaseNode {
  type: 'UpdateExpression';
  operator: '++' | '--';
  prefix: boolean;
  argument: Expression;
}

export interface BinaryExpression extends BaseNode {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface AssignmentExpression extends BaseNode {
  type: 'AssignmentExpression';
  operator: string;
  left: Pattern | MemberExpression;
  right: Expression;
}

export interface LogicalExpression extends BaseNode {
  type: 'LogicalExpression';
  operator: '||' | '&&' | '??';
  left: Expression;
  right: Expression;
}

export interface ConditionalExpression extends BaseNode {
  type: 'ConditionalExpression';
  test: Expression;
  consequent: Expression;
  alternate: Expression;
}

export interface NewExpression extends BaseNode {
  type: 'NewExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface SequenceExpression extends BaseNode {
  type: 'SequenceExpression';
  expressions: Expression[];
}

export interface ThisExpression extends BaseNode {
  type: 'ThisExpression';
}

export interface TemplateLiteral extends BaseNode {
  type: 'TemplateLiteral';
  quasis: TemplateElement[];
  expressions: Expression[];
}

export interface TemplateElement extends BaseNode {
  type: 'TemplateElement';
  tail: boolean;
  value: {
    raw: string;
    cooked: string;
  };
}

export interface TaggedTemplateExpression extends BaseNode {
  type: 'TaggedTemplateExpression';
  tag: Expression;
  quasi: TemplateLiteral;
}

export interface ClassExpression extends BaseNode {
  type: 'ClassExpression';
  id: Identifier | null;
  superClass: Expression | null;
  body: ClassBody;
}

export interface ClassBody extends BaseNode {
  type: 'ClassBody';
  body: MethodDefinition[];
}

export interface MethodDefinition extends BaseNode {
  type: 'MethodDefinition';
  key: Expression;
  value: FunctionExpression;
  kind: 'constructor' | 'method' | 'get' | 'set';
  computed: boolean;
  static: boolean;
}

export interface MetaProperty extends BaseNode {
  type: 'MetaProperty';
  meta: Identifier;
  property: Identifier;
}

export interface AwaitExpression extends BaseNode {
  type: 'AwaitExpression';
  argument: Expression;
}

export interface ImportExpression extends BaseNode {
  type: 'ImportExpression';
  source: Expression;
}

export interface ChainExpression extends BaseNode {
  type: 'ChainExpression';
  expression: CallExpression | MemberExpression;
}

export interface YieldExpression extends BaseNode {
  type: 'YieldExpression';
  argument: Expression | null;
  delegate: boolean;
}

export type Statement =
  | ExpressionStatement
  | BlockStatement
  | EmptyStatement
  | DebuggerStatement
  | WithStatement
  | ReturnStatement
  | LabeledStatement
  | BreakStatement
  | ContinueStatement
  | IfStatement
  | SwitchStatement
  | ThrowStatement
  | TryStatement
  | WhileStatement
  | DoWhileStatement
  | ForStatement
  | ForInStatement
  | ForOfStatement
  | Declaration;

export interface EmptyStatement extends BaseNode {
  type: 'EmptyStatement';
}

export interface DebuggerStatement extends BaseNode {
  type: 'DebuggerStatement';
}

export interface WithStatement extends BaseNode {
  type: 'WithStatement';
  object: Expression;
  body: Statement;
}

export interface ReturnStatement extends BaseNode {
  type: 'ReturnStatement';
  argument: Expression | null;
}

export interface LabeledStatement extends BaseNode {
  type: 'LabeledStatement';
  label: Identifier;
  body: Statement;
}

export interface BreakStatement extends BaseNode {
  type: 'BreakStatement';
  label: Identifier | null;
}

export interface ContinueStatement extends BaseNode {
  type: 'ContinueStatement';
  label: Identifier | null;
}

export interface IfStatement extends BaseNode {
  type: 'IfStatement';
  test: Expression;
  consequent: Statement;
  alternate: Statement | null;
}

export interface SwitchStatement extends BaseNode {
  type: 'SwitchStatement';
  discriminant: Expression;
  cases: SwitchCase[];
}

export interface SwitchCase extends BaseNode {
  type: 'SwitchCase';
  test: Expression | null;
  consequent: Statement[];
}

export interface ThrowStatement extends BaseNode {
  type: 'ThrowStatement';
  argument: Expression;
}

export interface TryStatement extends BaseNode {
  type: 'TryStatement';
  block: BlockStatement;
  handler: CatchClause | null;
  finalizer: BlockStatement | null;
}

export interface CatchClause extends BaseNode {
  type: 'CatchClause';
  param: Pattern | null;
  body: BlockStatement;
}

export interface WhileStatement extends BaseNode {
  type: 'WhileStatement';
  test: Expression;
  body: Statement;
}

export interface DoWhileStatement extends BaseNode {
  type: 'DoWhileStatement';
  body: Statement;
  test: Expression;
}

export interface ForStatement extends BaseNode {
  type: 'ForStatement';
  init: VariableDeclaration | Expression | null;
  test: Expression | null;
  update: Expression | null;
  body: Statement;
}

export interface ForInStatement extends BaseNode {
  type: 'ForInStatement';
  left: VariableDeclaration | Pattern;
  right: Expression;
  body: Statement;
}

export interface ForOfStatement extends BaseNode {
  type: 'ForOfStatement';
  left: VariableDeclaration | Pattern;
  right: Expression;
  body: Statement;
  await: boolean;
}

export type Declaration = FunctionDeclaration | VariableDeclaration | ClassDeclaration;

export interface ClassDeclaration extends BaseNode {
  type: 'ClassDeclaration';
  id: Identifier;
  superClass: Expression | null;
  body: ClassBody;
}

export type ASTNode = Expression | Statement | Pattern | Declaration | BaseNode;
