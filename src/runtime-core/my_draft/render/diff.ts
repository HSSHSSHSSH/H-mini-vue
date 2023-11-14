import { patch } from './render'

// 简单 diff
export function easy_diff(n1, n2, el, options) {
  const { unmount } = options
  let oldChildren = n1.children
  let newChildren = n2.children
  let lastIndex = 0
  for (let i = 0; i < newChildren.length; i++) {
    const newNode = newChildren[i]
    let find = false // 是否找到对应的旧节点
    for (let j = 0; j < oldChildren.length; j++) {
      const oldNode = oldChildren[j]
      if (newNode.key === oldNode.key) {
        find = true
        patch(oldNode, newNode, el, options) // 更新节点
        if (j < lastIndex) {
          // 进行移动操作
          let preVNode = newChildren[i - 1]
          // 若 preVNode 不存在，则说明当前节点是第一个节点
          if (preVNode) {
            let anchor = preVNode.el.nextSibling // 获取当前节点的下一个节点
            // 当 newNode.el 已是 el 的子节点时，insertBefore 相当于会删除 newNode.el，再插入
            el.insertBefore(newNode.el, anchor) // 将当前节点移动到 anchor 节点的前面
          }
        } else {
          lastIndex = j
        }
        break
      }
    }
    if (!find) {
      // 未找到对应的旧节点，说明是新增的节点
      let preVNode = newChildren[i - 1]
      let anchor = preVNode ? preVNode.el.nextSibling : el.firstChild // 获取当前节点的下一个节点
      patch(null, newNode, el, options, anchor)
    }
  }
  // 删除已经不存在的节点
  // 再次遍历一遍旧的节点，若旧的节点不在新的节点中，则删除
  for (let i = 0; i < oldChildren.length; i++) {
    const oldNode = oldChildren[i]
    let has = newChildren.find((newNode) => newNode.key === oldNode.key)
    if (!has) {
      // 旧的节点不在新的节点中，则删除
      unmount(oldNode)
    }
  }
}

// 双端 diff
export function double_end_diff(n1, n2, el, options) {
  const { insert } = options
  let oldChildren = n1.children
  let newChildren = n2.children
  // 两端的索引
  let oldStartIndex = 0
  let oldEndIndex = oldChildren.length - 1
  let newStartIndex = 0
  let newEndIndex = newChildren.length - 1
  // 两端的节点
  let oldStartNode, oldEndNode, newStartNode, newEndNode
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    oldStartNode = oldChildren[oldStartIndex]
    oldEndNode = oldChildren[oldEndIndex]
    newStartNode = newChildren[newStartIndex]
    newEndNode = newChildren[newEndIndex]
    if (oldStartNode.key === newStartNode.key) {
      // 旧的开端与新的开端比较
      /**
       * 打补丁
       * 更新索引,更新端点
       */

      patch(oldStartNode, newStartNode, el, options)
      oldStartIndex++
      newStartIndex++
    } else if (oldStartNode.key === newEndNode.key) {
      // 旧的开端与新的末端比较
      /**
       * 打补丁
       * 移动节点
       * 更新索引,更新端点
       */

      patch(oldStartNode, newEndNode, el, options)
      insert(oldStartNode.el, el, oldEndNode.el.nextSibling) // 移动节点
      oldStartIndex++
      newEndIndex--
    } else if (oldEndNode.key === newStartNode.key) {
      // 旧的末端与新的开端比较
      /**
       * 打补丁
       * 移动节点
       * 更新索引,更新端点
       */

      patch(oldEndNode, newStartNode, el, options)
      insert(oldEndNode.el,el, oldStartNode.el) // 移动节点
      oldEndIndex--
      newStartIndex++
    } else if (oldEndNode.key === newEndNode.key) {
      // 旧的末端与新的末端比较
      /**
       * 打补丁
       * 更新索引,更新端点
       */

      patch(oldEndNode, newEndNode, el, options)
      oldEndIndex--
      newEndIndex--
    }
  }
}

// 快速 diff

export function fast_diff(n1, n2, el, options) {
  console.log('快速diff 算法')
}
