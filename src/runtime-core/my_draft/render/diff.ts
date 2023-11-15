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
  const { insert, unmount } = options
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
    if (!oldStartNode) { // 处理 undefined 的情况
      // 旧的开端不存在
      oldStartIndex++
      oldStartIndex = oldChildren[oldStartIndex]
    }
    if (!oldEndNode) { // 处理 undefined 的情况
      // 旧的末端不存在
      oldEndIndex--
      oldEndNode = oldChildren[oldEndIndex]

    }
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
    } else {
      // 非理想情况 四个端点均不可复用
      let idxInOld
      idxInOld = oldChildren.findIndex((node) => node.key === newStartNode.key)
      if (idxInOld > 0) { // 新的开端在旧节点中且非旧的开端
        let moveNode = oldChildren[idxInOld]
        /**
         * 打补丁
         * 移动节点，更新索引
         * 处理idxInOld位置的节点，设为undefined
         */
        patch(moveNode, newStartNode, el, options)
        insert(moveNode.el, el, oldStartNode.el) // 移动节点
        oldChildren[idxInOld] = undefined
      }
      if (idxInOld === -1) { // 新的开端不在旧节点中
        /**
         * 新增节点
         * 更新索引
         */
        patch(null, newStartNode, el, options, oldStartNode.el)
      }
      newStartIndex++
    }
  }
  // 处理剩余节点
  if (oldStartIndex > oldEndIndex && newStartIndex <= newEndIndex) {
    // 新节点还有剩余 需要新增
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      patch(null, newChildren[i], el, options, oldStartNode.el)
    }
  }
  if (newStartIndex > newEndIndex && oldStartIndex <= oldEndIndex) {
    // 旧节点还有剩余 需要删除
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      unmount(oldChildren[i])
    }
  }
}

// 快速 diff

export function fast_diff(n1, n2, el, options) {
  console.log('快速diff 算法')
}