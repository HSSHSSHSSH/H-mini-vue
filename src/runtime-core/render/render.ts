import { NodeFlags } from './flags'
import { easy_diff, double_end_diff, fast_diff } from './diff'
import { mountComponent, patchComponent } from './component/handlers'

export function h_createRenderer(options) {
  const { unmount } = options
  function render(vnode, container) {
    if (vnode) {
      // 若 vnode 存在，则调用 patch
      
      patch(container._vnode, vnode, container, options)
    } else {
      if (container._vnode) {
        // 若旧的 vnode 存在，则卸载
        unmount(container._vnode)
      }
    }
    // 将本次 vnode 存储，作为下次的旧 vnode
    container._vnode = vnode
    
  }
  return render
}

export function patch(n1, n2, container, options, anchor = null) {
  const { createText, createComment, setNodeValue, insert } = options
  const { type } = n2
  console.log('tttype', type)
  if (typeof type === 'string') {
    if (!n1) {
      // 旧的 vnode 不存在，直接挂载
      mountElement(n2, container, options, anchor)
    } else {
      patchElement(n1, n2, options)
    }
  } else if (typeof type === 'object') {
    // 组件
    console.log('蛙叫你  组件')
    if(!n1) {
      mountComponent(n2, container, options, anchor)
    } else {
      patchComponent(n1, n2, options, anchor)
    }
  } else if (type === NodeFlags.Text) {
    // 文本节点
    if (!n1) {
      // 旧节点不存在 创建
      const el = (n2.el = createText(n2.children))
      insert(el, container)
    } else {
      // 旧节点存在 更新
      const el = (n2.el = n1.el)
      if (n2.children !== n1.children) {
        setNodeValue(el, n2.children)
      }
    }
  } else if (type === NodeFlags.Comment) {
    // 注释节点
    if (!n1) {
      // 旧节点不存在 创建
      const el = (n2.el = createComment(n2.children))
      insert(el, container)
    } else {
      // 旧节点存在 更新
      const el = (n2.el = n1.el)
      if (n2.children !== n1.children) {
        setNodeValue(el, n2.children)
      }
    }
  } else if (type === NodeFlags.Fragment) {
    // Fragment 节点
    // 对于 Fragment 节点，其实就是一个数组，只需处理其 children，所以直接遍历 children
    if (!n1) {
      n2.children.forEach((child) => {
        patch(null, child, container, options)
      })
    } else {
      patchChildren(n1, n2, container, options)
    }
  } else {
    // 其他
  }
}

// 挂载元素
function mountElement(vnode, container, options, anchor) {
  const { createElement, setElementText, insert, patchProps } = options
  // 创建 DOM 元素
  const el = (vnode.el = createElement(vnode.type)) // 将 el 挂载到 vnode 上
  // 若children 是字符串，则为文本类型
  if (typeof vnode.children === 'string') {
    setElementText(el, vnode.children)
  } else if (Array.isArray(vnode.children)) {
    vnode.children.forEach((child) => {
      patch(null, child, el, options)
    })
  }
  // 设置属性
  if (vnode.props) {
    for (let key in vnode.props) {
      /**
       * 在设置属性时，优先设置元素的 DOM properties
       */
      patchProps(el, key, null, vnode.props[key])
    }
  }
  // 将 DOM 元素挂载到容器上
  insert(el, container, anchor)
}

// 更新元素
function patchElement(n1, n2, options) {
  console.log('更新元素')
  let { patchProps } = options
  const el = (n2.el = n1.el)
  
  // 比较 props
  const oldProps = n1.props || {}
  const newProps = n2.props || {}

  for (let key in newProps) {
    if (newProps[key] !== oldProps[key]) {
      patchProps(el, key, oldProps[key], newProps[key])
    }
  }

  for (let key in oldProps) {
    if (!(key in newProps)) {
      patchProps(el, key, oldProps[key], null)
    }
  }

  // 比较 children
  patchChildren(n1, n2, el, options)
}

// 更新 children
function patchChildren(n1, n2, el, options) {
  const { setElementText, unmount } = options
  /**
   * 此时旧 vnode 的 children 可能是 文本，一组子节点, 没有子节点
   * 新的 vnode 的 children 可能是 文本，一组子节点, 没有子节点
   * 有 9 中情况
   * 1. 文本 -> 文本
   * 2. 文本 -> 一组子节点
   * 3. 文本 -> 没有子节点
   * 4. 一组子节点 -> 文本
   * 5. 一组子节点 -> 一组子节点
   * 6. 一组子节点 -> 没有子节点
   * 7. 没有子节点 -> 文本
   * 8. 没有子节点 -> 一组子节点
   * 9. 没有子节点 -> 没有子节点
   */
  if (typeof n2.children === 'string') {
    // 情况 1, 4, 7
    if (Array.isArray(n1.children)) {
      n1.children.forEach((child) => {
        unmount(child)
      })
    }

    setElementText(el, n2.children)
  } else if (Array.isArray(n2.children)) {
    // 情况 2, 5, 8
    if (Array.isArray(n1.children)) {
      // 情况5
      // 核心 diff 算法
      //  easy_diff(n1, n2, el, options)
      
      // double_end_diff(n1, n2, el, options)
      fast_diff(n1, n2, el, options)
    } else {
      // 情况 2, 5
      setElementText(el, '')
      n2.children.forEach((child) => {
        patch(null, child, el, options)
      })
    }
  } else {
    // 情况 3, 6, 9
    if (Array.isArray(n1.children)) {
      // 情况6
      n1.children.forEach((child) => {
        unmount(child)
      })
    } else if (typeof n1.children === 'string') {
      // 情况 3
      setElementText(el, '')
    }
    // 情况 9， 什么都不做
  }
}
