import { NodeTypes } from './ast'

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParserContext(content)
  return createRoot(parseChildren(context))
}

// 解析子节点
function parseChildren(context, ancestors: any[] = []) {
  const nodes: any = []
  while (!isEnd(context, ancestors)) {
    let node
    let s = context.source
    if (s.startsWith('{{')) {
      node = parseInterpolation(context)
    } else if (s[0] === '<') {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    }

    if (!node) {
      // 默认为 text 类型
      node = parseText(context)
    }

    nodes.push(node)
  }
  return nodes
}

function isEnd(context, ancestors: any[]) {
  const s = context.source
  // 遇到结束标签
  // if (parentTag && s.startsWith(`</${parentTag}>`)) {
  //   return true
  // }
  if (s.startsWith('</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag
      if (startsWithEndTagOpen(s, tag)) {
        return true
      }
    }
  }
  // source 为空时，表示已经解析完成
  return !s
}

// 解析 text 文本
function parseText(context) {
  let endIndex = context.source.length
  let endTokens = ['<', '{{']
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content: content,
  }
}

function parseTextData(context, length) {
  // 获取文本内容
  const content = context.source.slice(0, length)
  // 推进上下文
  advanceBy(context, length)
  return content
}

// 解析 element
function parseElement(context, ancestors: any[]) {
  const element: any = parseTag(context, TagType.Start)
  ancestors?.push(element) // 收集开始标签
  element.children = parseChildren(context, ancestors)
  ancestors.pop() // 移除开始标签
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End)
  } else {
    throw new Error(`缺少结束标签：${element.tag}`)
  }
  return element
}

function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith('</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  )
}

// 解析 element 标签
function parseTag(context, type: TagType) {
  // 解析 tag
  const match: any = /^<\/?([a-z]*)/i.exec(context.source)
  const tag = match[1]
  // 删除处理完成的代码
  advanceBy(context, match[0].length)
  advanceBy(context, 1)
  if (type === TagType.Start) {
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
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length,
  )

  advanceBy(context, openDelimiter.length)
  const rawContextLength = closeIndex - openDelimiter.length

  let content = parseTextData(context, rawContextLength)
  content = content.trim()
  advanceBy(context, closeDelimiter.length)
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
    type: NodeTypes.ROOT,
  }
}
