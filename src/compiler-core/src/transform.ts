


export function transform(root, options = {}) {
  let context = createTransformContext(root, options)
  // 遍历 ast，找到所有的文本类型的节点
  // 修改文本节点的 content
  traverseNode(root, context)
  createRootCodegen(root)
}


// 遍历 ast
function traverseNode(node: any, context) {
  let nodeTransforms = context.nodeTransforms
  for(let i = 0; i < nodeTransforms.length; i++) {
    nodeTransforms[i](node, context)
  }
  traverseChildren(node, context)
}


// 处理 children
function traverseChildren(node: any, context) {
  let children = node.children
  if(children) {
    for(let i = 0; i < children.length; i++) {
      let child = children[i]
      traverseNode(child, context) // 深度优先遍历
    }
  }
}


// 创建 transform 上下文
function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
  }
  return context
}
function createRootCodegen(root: any) {
  root.codegenNode = root.children[0]
}

