import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

export function transform(root, options = {}) {
  let context = createTransformContext(root, options)
  // 遍历 ast，找到所有的文本类型的节点
  // 修改文本节点的 content
  traverseNode(root, context)
  createRootCodegen(root)
  root.helpers = [...context.helpers.keys()]
}

// 遍历 ast
function traverseNode(node: any, context) {
  let nodeTransforms = context.nodeTransforms
  const exitFns: any = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    let onExit = transform(node, context)
    if(onExit) {
      exitFns.push(onExit)
    }
  }
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context)
      break
    default:
      break
  }
  let i = exitFns.length
  while(i--) {
    exitFns[i]()
  }
}

// 处理 children
function traverseChildren(node: any, context) {
  let children = node.children
  for (let i = 0; i < children.length; i++) {
    let child = children[i]
    traverseNode(child, context) // 深度优先遍历
  }
}

// 创建 transform 上下文
function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, true)
    },
  }
  return context
}
function createRootCodegen(root: any) {
  const child = root.children[0]
  if(child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode
  } else {
    root.codegenNode = child
  }
}
