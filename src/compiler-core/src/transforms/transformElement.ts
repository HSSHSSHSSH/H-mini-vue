import { NodeTypes, createVNodeCall } from '../ast'
import { CREATE_ELEMENT_VNODE } from '../runtimeHelpers'

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      
      // tag
      const vnodeTag = `"${node.tag}"`
      // props
      let vnodeProps
      //children
      let children = node.children
      let vnodeChildren = children[0]
      const child = children[0]

      node.codegenNode = createVNodeCall(context,vnodeTag, vnodeProps, vnodeChildren)
    }
  }
}
