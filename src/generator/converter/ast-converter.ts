import * as t from '@babel/types';

/**
 * Converts Acorn AST to Babel AST
 */
export class ASTConverter {
  /**
   * Convert Acorn AST to Babel AST
   */
  convert(node: any): any {
    if (!node) return null;

    switch (node.type) {
      // Program
      case 'Program':
        return this.convertProgram(node);

      // Statements
      case 'VariableDeclaration':
        return this.convertVariableDeclaration(node);
      case 'FunctionDeclaration':
        return this.convertFunctionDeclaration(node);
      case 'ClassDeclaration':
        return this.convertClassDeclaration(node);
      case 'ExpressionStatement':
        return this.convertExpressionStatement(node);
      case 'ReturnStatement':
        return this.convertReturnStatement(node);
      case 'IfStatement':
        return this.convertIfStatement(node);
      case 'BlockStatement':
        return this.convertBlockStatement(node);
      case 'ForStatement':
        return this.convertForStatement(node);
      case 'ForInStatement':
        return this.convertForInStatement(node);
      case 'ForOfStatement':
        return this.convertForOfStatement(node);
      case 'WhileStatement':
        return this.convertWhileStatement(node);
      case 'DoWhileStatement':
        return this.convertDoWhileStatement(node);
      case 'SwitchStatement':
        return this.convertSwitchStatement(node);
      case 'ThrowStatement':
        return this.convertThrowStatement(node);
      case 'TryStatement':
        return this.convertTryStatement(node);
      case 'BreakStatement':
        return this.convertBreakStatement(node);
      case 'ContinueStatement':
        return this.convertContinueStatement(node);

      // Expressions
      case 'Identifier':
        return t.identifier(node.name);
      case 'PrivateIdentifier':
        return t.privateName(t.identifier(node.name));
      case 'Literal':
        return this.convertLiteral(node);
      case 'BinaryExpression':
      case 'LogicalExpression':
        return this.convertBinaryExpression(node);
      case 'UnaryExpression':
        return this.convertUnaryExpression(node);
      case 'UpdateExpression':
        return this.convertUpdateExpression(node);
      case 'AssignmentExpression':
        return this.convertAssignmentExpression(node);
      case 'MemberExpression':
        return this.convertMemberExpression(node);
      case 'CallExpression':
        return this.convertCallExpression(node);
      case 'NewExpression':
        return this.convertNewExpression(node);
      case 'ArrayExpression':
        return this.convertArrayExpression(node);
      case 'ObjectExpression':
        return this.convertObjectExpression(node);
      case 'FunctionExpression':
        return this.convertFunctionExpression(node);
      case 'ArrowFunctionExpression':
        return this.convertArrowFunction(node);
      case 'ConditionalExpression':
        return this.convertConditionalExpression(node);
      case 'ChainExpression':
        return this.convertChainExpression(node);
      case 'ThisExpression':
        return t.thisExpression();
      case 'TemplateLiteral':
        return this.convertTemplateLiteral(node);
      case 'TaggedTemplateExpression':
        return this.convertTaggedTemplateExpression(node);
      case 'SpreadElement':
        return t.spreadElement(this.convert(node.argument));
      case 'AwaitExpression':
        return t.awaitExpression(this.convert(node.argument));
      case 'YieldExpression':
        return t.yieldExpression(node.argument ? this.convert(node.argument) : null, node.delegate);
      case 'SequenceExpression':
        return this.convertSequenceExpression(node);
      case 'ImportExpression':
        return this.convertImportExpression(node);
      case 'Super':
        return t.super();
      case 'MetaProperty':
        return this.convertMetaProperty(node);
      case 'ClassExpression':
        return this.convertClassExpression(node);
      case 'EmptyStatement':
        return t.emptyStatement();

      default:
        console.warn(`Unsupported node type: ${node.type}`);
        return t.identifier('undefined');
    }
  }

  private convertProgram(node: any): t.Program {
    const body = node.body.map((stmt: any) => this.convert(stmt));
    return t.program(body, [], node.sourceType === 'module' ? 'module' : 'script');
  }

  private convertVariableDeclaration(node: any): t.VariableDeclaration {
    const declarations = node.declarations.map((decl: any) => this.convertVariableDeclarator(decl));
    return t.variableDeclaration(node.kind, declarations);
  }

  private convertVariableDeclarator(node: any): t.VariableDeclarator {
    const id = this.convertPattern(node.id);
    const init = node.init ? this.convert(node.init) : null;
    return t.variableDeclarator(id, init);
  }

  private convertFunctionDeclaration(node: any): t.FunctionDeclaration {
    const id = node.id ? t.identifier(node.id.name) : null;
    const params = node.params.map((param: any) => this.convertPattern(param));
    const body = this.convertBlockStatement(node.body);
    return t.functionDeclaration(id, params, body, node.generator, node.async);
  }

  private convertClassDeclaration(node: any): t.ClassDeclaration {
    const id = node.id ? t.identifier(node.id.name) : null;
    const superClass = node.superClass ? this.convert(node.superClass) : null;
    const body = this.convertClassBody(node.body);
    return t.classDeclaration(id, superClass, body);
  }

  private convertClassBody(node: any): t.ClassBody {
    const body = node.body
      .map((member: any) => {
        switch (member.type) {
          case 'MethodDefinition':
            return this.convertMethodDefinition(member);
          case 'PropertyDefinition':
            return this.convertPropertyDefinition(member);
          case 'StaticBlock':
            return this.convertStaticBlock(member);
          default:
            console.warn(`Unsupported class member type: ${member.type}`);
            return null;
        }
      })
      .filter(Boolean);

    return t.classBody(body);
  }

  private convertMethodDefinition(node: any): t.ClassMethod | t.ClassPrivateMethod {
    const isPrivate = node.key.type === 'PrivateIdentifier';
    const key = isPrivate ? t.privateName(t.identifier(node.key.name)) : this.convert(node.key);
    const params = node.value.params.map((param: any) => this.convertPattern(param));
    const body = this.convertBlockStatement(node.value.body);

    if (isPrivate) {
      return t.classPrivateMethod(node.kind, key, params, body, node.static);
    }

    return t.classMethod(
      node.kind,
      key,
      params,
      body,
      node.computed,
      node.static,
      node.value.generator,
      node.value.async,
    );
  }

  private convertPropertyDefinition(node: any): t.ClassProperty | t.ClassPrivateProperty {
    const isPrivate = node.key.type === 'PrivateIdentifier';
    const key = isPrivate ? t.privateName(t.identifier(node.key.name)) : this.convert(node.key);
    const value = node.value ? this.convert(node.value) : null;

    if (isPrivate) {
      return t.classPrivateProperty(key, value, null, node.static);
    }

    return t.classProperty(
      key,
      value,
      null, // typeAnnotation
      null, // decorators
      node.computed,
      node.static,
    );
  }

  private convertStaticBlock(node: any): t.StaticBlock {
    const body = node.body.map((stmt: any) => this.convert(stmt));
    return t.staticBlock(body);
  }

  private convertExpressionStatement(node: any): t.ExpressionStatement {
    return t.expressionStatement(this.convert(node.expression));
  }

  private convertReturnStatement(node: any): t.ReturnStatement {
    const argument = node.argument ? this.convert(node.argument) : null;
    return t.returnStatement(argument);
  }

  private convertIfStatement(node: any): t.IfStatement {
    const test = this.convert(node.test);
    const consequent = this.convert(node.consequent);
    const alternate = node.alternate ? this.convert(node.alternate) : null;
    return t.ifStatement(test, consequent, alternate);
  }

  private convertBlockStatement(node: any): t.BlockStatement {
    const body = node.body.map((stmt: any) => this.convert(stmt));
    return t.blockStatement(body);
  }

  private convertForStatement(node: any): t.ForStatement {
    const init = node.init ? this.convert(node.init) : null;
    const test = node.test ? this.convert(node.test) : null;
    const update = node.update ? this.convert(node.update) : null;
    const body = this.convert(node.body);
    return t.forStatement(init, test, update, body);
  }

  private convertForInStatement(node: any): t.ForInStatement {
    const left =
      node.left.type === 'VariableDeclaration'
        ? this.convert(node.left)
        : this.convertPattern(node.left);
    const right = this.convert(node.right);
    const body = this.convert(node.body);
    return t.forInStatement(left, right, body);
  }

  private convertForOfStatement(node: any): t.ForOfStatement {
    const left =
      node.left.type === 'VariableDeclaration'
        ? this.convert(node.left)
        : this.convertPattern(node.left);
    const right = this.convert(node.right);
    const body = this.convert(node.body);
    return t.forOfStatement(left, right, body, node.await || false);
  }

  private convertWhileStatement(node: any): t.WhileStatement {
    return t.whileStatement(this.convert(node.test), this.convert(node.body));
  }

  private convertDoWhileStatement(node: any): t.DoWhileStatement {
    return t.doWhileStatement(this.convert(node.body), this.convert(node.test));
  }

  private convertSwitchStatement(node: any): t.SwitchStatement {
    const discriminant = this.convert(node.discriminant);
    const cases = node.cases.map((c: any) => this.convertSwitchCase(c));
    return t.switchStatement(discriminant, cases);
  }

  private convertSwitchCase(node: any): t.SwitchCase {
    const test = node.test ? this.convert(node.test) : null;
    const consequent = node.consequent.map((stmt: any) => this.convert(stmt));
    return t.switchCase(test, consequent);
  }

  private convertThrowStatement(node: any): t.ThrowStatement {
    return t.throwStatement(this.convert(node.argument));
  }

  private convertTryStatement(node: any): t.TryStatement {
    const block = this.convertBlockStatement(node.block);
    const handler = node.handler ? this.convertCatchClause(node.handler) : null;
    const finalizer = node.finalizer ? this.convertBlockStatement(node.finalizer) : null;
    return t.tryStatement(block, handler, finalizer);
  }

  private convertCatchClause(node: any): t.CatchClause {
    const param = node.param ? this.convertPattern(node.param) : null;
    const body = this.convertBlockStatement(node.body);
    return t.catchClause(param, body);
  }

  private convertBreakStatement(node: any): t.BreakStatement {
    const label = node.label ? t.identifier(node.label.name) : null;
    return t.breakStatement(label);
  }

  private convertContinueStatement(node: any): t.ContinueStatement {
    const label = node.label ? t.identifier(node.label.name) : null;
    return t.continueStatement(label);
  }

  private convertBinaryExpression(node: any): t.BinaryExpression | t.LogicalExpression {
    const left = this.convert(node.left);
    const right = this.convert(node.right);

    if (node.type === 'LogicalExpression') {
      return t.logicalExpression(node.operator, left, right);
    }

    return t.binaryExpression(node.operator, left, right);
  }

  private convertUnaryExpression(node: any): t.UnaryExpression {
    return t.unaryExpression(node.operator, this.convert(node.argument), node.prefix);
  }

  private convertUpdateExpression(node: any): t.UpdateExpression {
    return t.updateExpression(node.operator, this.convert(node.argument), node.prefix);
  }

  private convertAssignmentExpression(node: any): t.AssignmentExpression {
    const left = this.convertPattern(node.left);
    const right = this.convert(node.right);
    return t.assignmentExpression(node.operator, left, right);
  }

  private convertMemberExpression(node: any): t.MemberExpression | t.OptionalMemberExpression {
    const property =
      node.property.type === 'PrivateIdentifier'
        ? t.privateName(t.identifier(node.property.name))
        : this.convert(node.property);

    if (node.optional) {
      return t.optionalMemberExpression(this.convert(node.object), property, node.computed, true);
    }

    return t.memberExpression(this.convert(node.object), property, node.computed);
  }

  private convertCallExpression(node: any): t.CallExpression | t.OptionalCallExpression {
    if (node.optional) {
      return t.optionalCallExpression(
        this.convert(node.callee),
        node.arguments.map((arg: any) => this.convert(arg)),
        true,
      );
    }

    return t.callExpression(
      this.convert(node.callee),
      node.arguments.map((arg: any) => this.convert(arg)),
    );
  }

  private convertNewExpression(node: any): t.NewExpression {
    return t.newExpression(
      this.convert(node.callee),
      node.arguments.map((arg: any) => this.convert(arg)),
    );
  }

  private convertArrayExpression(node: any): t.ArrayExpression {
    const elements = node.elements.map((el: any) => (el ? this.convert(el) : null));
    return t.arrayExpression(elements);
  }

  private convertObjectExpression(node: any): t.ObjectExpression {
    const properties = node.properties.map((prop: any) => this.convertProperty(prop));
    return t.objectExpression(properties);
  }

  private convertProperty(node: any): any {
    if (node.type === 'SpreadElement') {
      return t.spreadElement(this.convert(node.argument));
    }

    const key =
      node.computed || node.key.type === 'Literal'
        ? this.convert(node.key)
        : t.identifier(node.key.name);

    if (node.kind === 'init') {
      if (node.method) {
        const params = node.value.params.map((p: any) => this.convertPattern(p));
        const body = this.convertBlockStatement(node.value.body);
        return t.objectMethod('method', key, params, body, node.computed);
      }
      return t.objectProperty(key, this.convert(node.value), node.computed, node.shorthand);
    }

    const params = node.value.params.map((p: any) => this.convertPattern(p));
    const body = this.convertBlockStatement(node.value.body);
    return t.objectMethod(node.kind, key, params, body, node.computed);
  }

  private convertFunctionExpression(node: any): t.FunctionExpression {
    const id = node.id ? t.identifier(node.id.name) : null;
    const params = node.params.map((param: any) => this.convertPattern(param));
    const body = this.convertBlockStatement(node.body);
    return t.functionExpression(id, params, body, node.generator, node.async);
  }

  private convertArrowFunction(node: any): t.ArrowFunctionExpression {
    const params = node.params.map((param: any) => this.convertPattern(param));
    const body =
      node.body.type === 'BlockStatement'
        ? this.convertBlockStatement(node.body)
        : this.convert(node.body);
    return t.arrowFunctionExpression(params, body, node.async);
  }

  private convertConditionalExpression(node: any): t.ConditionalExpression {
    return t.conditionalExpression(
      this.convert(node.test),
      this.convert(node.consequent),
      this.convert(node.alternate),
    );
  }

  private convertChainExpression(node: any): t.Expression {
    return this.convertChainedExpression(node.expression);
  }

  private convertChainedExpression(node: any): t.Expression {
    if (node.type === 'MemberExpression') {
      // Check if the object is part of a chain
      let object: any;
      if (node.object.type === 'MemberExpression' || node.object.type === 'CallExpression') {
        object = this.convertChainedExpression(node.object);
      } else {
        object = this.convert(node.object);
      }

      if (node.optional) {
        return t.optionalMemberExpression(object, this.convert(node.property), node.computed, true);
      }

      return t.memberExpression(object, this.convert(node.property), node.computed);
    }

    if (node.type === 'CallExpression') {
      // Check if the callee is part of a chain
      let callee: any;
      if (node.callee.type === 'MemberExpression' || node.callee.type === 'CallExpression') {
        callee = this.convertChainedExpression(node.callee);
      } else {
        callee = this.convert(node.callee);
      }

      if (node.optional) {
        return t.optionalCallExpression(
          callee,
          node.arguments.map((arg: any) => this.convert(arg)),
          true,
        );
      }

      return t.callExpression(
        callee,
        node.arguments.map((arg: any) => this.convert(arg)),
      );
    }

    return this.convert(node);
  }

  private convertTemplateLiteral(node: any): t.TemplateLiteral {
    const quasis = node.quasis.map((q: any) =>
      t.templateElement({ raw: q.value.raw, cooked: q.value.cooked }, q.tail),
    );
    const expressions = node.expressions.map((e: any) => this.convert(e));
    return t.templateLiteral(quasis, expressions);
  }

  private convertTaggedTemplateExpression(node: any): t.TaggedTemplateExpression {
    return t.taggedTemplateExpression(
      this.convert(node.tag),
      this.convertTemplateLiteral(node.quasi),
    );
  }

  private convertLiteral(node: any): t.Expression {
    if (node.value === null) return t.nullLiteral();
    if (typeof node.value === 'string') return t.stringLiteral(node.value);
    if (typeof node.value === 'number') return t.numericLiteral(node.value);
    if (typeof node.value === 'boolean') return t.booleanLiteral(node.value);
    if (node.regex) {
      return t.regExpLiteral(node.regex.pattern, node.regex.flags);
    }
    if (node.bigint) {
      return t.bigIntLiteral(node.bigint);
    }
    return t.nullLiteral();
  }

  private convertPattern(node: any): any {
    if (!node) return null;

    switch (node.type) {
      case 'Identifier':
        return t.identifier(node.name);
      case 'ObjectPattern':
        return this.convertObjectPattern(node);
      case 'ArrayPattern':
        return this.convertArrayPattern(node);
      case 'RestElement':
        return t.restElement(this.convertPattern(node.argument));
      case 'AssignmentPattern':
        return t.assignmentPattern(this.convertPattern(node.left), this.convert(node.right));
      default:
        return this.convert(node);
    }
  }

  private convertObjectPattern(node: any): t.ObjectPattern {
    const properties = node.properties.map((prop: any) => {
      if (prop.type === 'RestElement') {
        return t.restElement(this.convertPattern(prop.argument));
      }

      const key =
        prop.computed || prop.key.type === 'Literal'
          ? this.convert(prop.key)
          : t.identifier(prop.key.name);

      const value = this.convertPattern(prop.value);

      return t.objectProperty(key, value, prop.computed, prop.shorthand);
    });

    return t.objectPattern(properties);
  }

  private convertArrayPattern(node: any): t.ArrayPattern {
    const elements = node.elements.map((el: any) => (el ? this.convertPattern(el) : null));
    return t.arrayPattern(elements);
  }

  private convertSequenceExpression(node: any): t.SequenceExpression {
    const expressions = node.expressions.map((expr: any) => this.convert(expr));
    return t.sequenceExpression(expressions);
  }

  private convertImportExpression(node: any): t.Import | t.CallExpression {
    // @babel/types doesn't have a direct import() expression, use callExpression with import
    return t.callExpression(t.import(), [this.convert(node.source)]);
  }

  private convertMetaProperty(node: any): t.MetaProperty {
    return t.metaProperty(t.identifier(node.meta.name), t.identifier(node.property.name));
  }

  private convertClassExpression(node: any): t.ClassExpression {
    const id = node.id ? t.identifier(node.id.name) : null;
    const superClass = node.superClass ? this.convert(node.superClass) : null;
    const body = this.convertClassBody(node.body);
    return t.classExpression(id, superClass, body);
  }
}
