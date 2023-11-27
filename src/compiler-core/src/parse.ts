import {NodeTypes} from './ast'

const enum TagType {
  Start,
  End
}

export function baseParse(content: string) {
  const context = createParserContext(content)
  return createRoot(parseChildren(context))
}

// 解析子节点
function parseChildren(context) {
  const nodes: any = []
  let node 
  let s = context.source
  if(s.startsWith('{{')) {
    node = parseInterpolation(context)
  } else if(s[0] === '<') {
    if(/[a-z]/i.test(s[1])) {
      node = parseElement(context)
    }
  }
  nodes.push(node)
  return nodes
}


function parseElement(context) {
  const element = parseTag(context, TagType.Start)
  parseTag(context, TagType.End)
  console.log('----', context)
  return element
}



// 解析 element 标签
function parseTag(context, type: TagType) {
  // 解析 tag
  const match: any = /^<\/?([a-z]*)/i.exec(context.source)
  const tag = match[1]
  // 删除处理完成的代码
  advanceBy(context, match[0].length)
  advanceBy(context, 1)
  if(type === TagType.Start) {
    return {
      type: NodeTypes.ELEMENT,
      tag: tag,
    }
  }
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
