import {NodeTypes} from './ast'

export function baseParse(content: string) {
  const context = createParserContext(content)
  return createRoot(parseChildren(context))
}

// 解析子节点
function parseChildren(context) {
  const nodes: any = []
  let node 
  if(context.source.startsWith('{{')) {
    node = parseInterpolation(context)
  }
  nodes.push(node)
  return nodes
}

// 解析插值表达式
function parseInterpolation(context) {
  const openDelimiter = '{{'
  const closeDelimiter = '}}'
  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length)
  
  advanceBy(context, openDelimiter.length)
  const rawContextLength = closeIndex - openDelimiter.length

  let content = context.source.slice(0, rawContextLength)
  content = content.trim()
  advanceBy(context, rawContextLength + closeDelimiter.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  }
}

// 从上下文中移除已解析的内容
function advanceBy(context, length) {
  context.source = context.source.slice(length)
}

// 创建解析上下文
function createParserContext(content: string) {
  return {
    source: content,
  }
}

// 创建根节点
function createRoot(children) {
  return {
    children,
  }
}
