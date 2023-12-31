import { isString } from '../../shared/index'
import { NodeTypes } from './ast'
import {
  CREATE_ELEMENT_VNODE,
  TO_DISPLAY_STRING,
  helperNameMap,
} from './runtimeHelpers'

export function generate(ast) {
  const context: any = createCodegenContext()
  const { push } = context

  genFunctionPreamble(ast, context)
  push('return ')
  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')
  push(`function ${functionName}(${signature}) {`)
  push('return ')
  genNode(ast.codegenNode, context)
  push('}')
  return {
    code: context.code,
  }
}

function genFunctionPreamble(ast: any, context: any) {
  const VueBinging = 'Vue'
  const { push } = context
  const aliasHelper = (s) => `${helperNameMap[s]}: _${helperNameMap[s]}`
  if (ast.helpers.length) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`)
  }
  push('\n')
}

function genNode(node: any, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeTypes.ELEMENT:
      genElement(node, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    default:
      break
  }
}


function genCompoundExpression(node, context) {
  const { push } = context
  const children = node.children
  for(let i = 0; i < children.length; i++) {
    const child = children[i]
    if (typeof child === 'string') {
      push(child)
    } else {
      genNode(child, context)
    }
  }
}


function genText(node, context) {
  const { push } = context
  push(`'${node.content}'`)
}

function createCodegenContext() {
  const context = {
    code: '',
    push(source) {
      context.code += source
    },
    helper(key) {
      return `_${helperNameMap[key]}`
    },
  }
  return context
}
function genInterpolation(node: any, context: any) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(`)`)
}

function genExpression(node: any, context: any) {
  const { push } = context
  push(`${node.content}`)
}

function genElement(node: any, context: any) {
  const { push, helper } = context
  const { tag, children, props } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}(`)
  genNodeList(genNullable([tag, props, children]), context)
  // genNode(children, context)
  push(')')
}


function genNullable(args: any[]) {
  return args.map((arg) => (arg ? arg : 'null'))
}


function genNodeList(nodes, context) {
  const {push} = context
  for(let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    console.log(node)
    if(isString(node)) {
      push(node)
    } else {
      genNode(node, context)
    }
    if(i < nodes.length - 1) {
      push(', ')
    }
  }
}