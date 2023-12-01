import { patch } from './render'

// 简单 diff
export function easy_diff(n1, n2, el, options) {
  const { unmount } = options
  let oldChildren = n1.children
  let newChildren = n2.children
  /**
   * lastIndex 是已处理过的新节点在旧节点数组中的最大索引值
   * 当此时活跃的旧节点索引小于 lastIndex 时，说明此节在当前活跃新节点之前，反之在后
   */
  let lastIndex = 0
  for (let i = 0; i < newChildren.length; i++) {
    const newNode = newChildren[i]
    let find = false // 是否找到对应的旧节点
    for (let j = 0; j < oldChildren.length; j++) {
      const oldNode = oldChildren[j]
      if (newNode.key === oldNode.key) {
        find = true
        patch(oldNode, newNode, el, options) // 更新节点
        /**
         * j 是当前活跃的新节点在旧节点数组中的索引
         */
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
    if (!oldStartNode) {
      // 处理 undefined 的情况
      // 旧的开端不存在
      oldStartIndex++
      oldStartIndex = oldChildren[oldStartIndex]
    }
    if (!oldEndNode) {
      // 处理 undefined 的情况
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
      insert(oldEndNode.el, el, oldStartNode.el) // 移动节点
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
      if (idxInOld > 0) {
        // 新的开端在旧节点中且非旧的开端
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
      if (idxInOld === -1) {
        // 新的开端不在旧节点中
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
  const { insert, unmount } = options
  let oldChildren = n1.children
  let newChildren = n2.children
  // 从前向后比较
  let j = 0
  let oldVNode = oldChildren[j]
  let newVNode = newChildren[j]
  while (oldVNode.key === newVNode.key) {
    //预处理
    /**
     * 打补丁
     * 更新索引，更新 oldVNode, newVNode
     */
    patch(oldVNode, newVNode, el, options)
    j++
    oldVNode = oldChildren[j] || {}
    newVNode = newChildren[j] || {}

  }
  // 从后向前比较
  let oldEnd = oldChildren.length - 1
  let newEnd = newChildren.length - 1
  oldVNode = oldChildren[oldEnd]
  newVNode = newChildren[newEnd]
  while (oldVNode.key === newVNode.key) {
    //预处理
    /**
     * 打补丁
     * 更新索引，更新 oldVNode, newVNode
     */
    patch(oldVNode, newVNode, el, options)
    oldEnd--
    newEnd--
    oldVNode = oldChildren[oldEnd] || {}
    newVNode = newChildren[newEnd] || {}
  }
  // 判断是否有需要新增与卸载的节点
  if (j <= newEnd && j > oldEnd) {
    // 仅有新增节点
    for (let i = j; i <= newEnd; i++) {
      // 新增节点
      let anchor = newChildren[newEnd + 1] ? newChildren[newEnd + 1].el : null
      patch(null, newChildren[i], el, options, anchor)
    }
  } else if (j > newEnd && j <= oldEnd) {
    // 仅有卸载节点
    for (let i = j; i <= oldEnd; i++) {
      // 卸载节点
      unmount(oldChildren[i])
    }
  } else {
    // 非理想情况
    let count = newEnd - j + 1 // 新节点数组中未处理的节点数量
    let source = new Array(count).fill(-1) // 用于存放新节点对应旧节点的索引
    let oldStart = j
    let newStart = j
    let keyIndex = {} // newNodeKey: newNodeIndex
    let move = false // 是否需要移动
    let lastIndex = 0 // 在遍历遍历旧节点时遇到的最大索引值
    let patched = 0 // 已处理的新节点的数量
    for (let i = newStart; i <= newEnd; i++) {
      keyIndex[newChildren[i].key] = i
    }
    // 更新 source 数组
    for (let i = oldStart; i <= oldEnd; i++) {
      let oldVNode = oldChildren[i]
      if (patched <= count) { // 当已处理的节点数量小于未处理的节点数量时，继续处理
        /**
         * idx是旧节点在未处理新节点数组中的索引
         */
        let idx = keyIndex[oldChildren[i].key]
        if (idx === undefined) {
          // 旧节点在新节点中不存在
          unmount(oldChildren[i])
        } else {
          // 旧节点在新节点中存在
          /**
           * 打补丁
           * 填充source
           */
          patch(oldVNode, newChildren[idx], el, options)
          patched++
          source[idx - newStart] = i
          // 判断节点是否需要移动
          if (idx < lastIndex) {
            move = true
          } else {
            lastIndex = idx
          }
        }
      } else {
        unmount(oldChildren[i])
      }
    }
    if (move || patched < newEnd - 1) { // 需要执行移动的操作
      /**
       * 1. 找到需要移动的元素
       * 2. 移动到正确的位置
       */
      let seq = lis(source)
      let s = seq.length - 1 // 最长递增子序列的最后一个索引
      let i = source.length - 1 // 未处理的新节点数组的最后一个索引
      for(i; i >= 0; i--) { // 遍历未处理的新节点数组
        if(source[i] === -1) { // 未处理的新节点数组中的节点在旧节点数组中不存在
          let pos = i + newStart // 新节点在新节点数组中的索引
          let nextPos = pos + 1 // 新节点在新节点数组中的下一个索引
          let anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null // 新节点在新节点数组中的下一个节点
          patch(null, newChildren[pos], el, options, anchor) // 新增节点
        }else if(i !== seq[s]) {
          // 需要移动
          let pos = i + newStart // 新节点在新节点数组中的索引
          let nextPos = pos + 1 // 新节点在新节点数组中的下一个索引
          let anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null // 新节点在新节点数组中的下一个节点
          insert(newChildren[pos].el, el, anchor) // 移动节点
        } else {
          // 不需要移动
          s--
        }
      }
    }
  }
}


// 计算最长递增子序列
function lis(arr) {
  let len = arr.length
  let result = [0]
  let p = arr.slice(0)
  let start
  let end
  let middle
  for (let i = 0; i < len; i++) {
    let arrI = arr[i]
    if (arrI !== 0) {
      let resultLastIndex = result[result.length - 1]
      if (arr[resultLastIndex] < arrI) {
        p[i] = resultLastIndex
        result.push(i)
        continue
      }
      start = 0
      end = result.length - 1
      while (start < end) {
        middle = ((start + end) / 2) | 0
        if (arr[result[middle]] < arrI) {
          start = middle + 1
        } else {
          end = middle
        }
      }
      if (arrI < arr[result[start]]) {
        if (start > 0) {
          p[i] = result[start - 1]
        }
        result[start] = i
      }
    }
  }
  start = result.length
  end = result[start - 1]
  while (start-- > 0) {
    result[start] = end
    end = p[end]
  }
  return result
}
