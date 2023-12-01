import { effect } from '../../index'
import { ShapeFlags } from '../../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { Fragment, Text } from './vnode'
import { createAppAPI } from './createApp'
import { shouldUpdateComponent } from './componentUpdateUtils'
import { queueJobs } from './scheduler'

export function createRenderer(options: any) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options

  function render(vnode, container, parentComponent?) {
    // 调用 patch
    patch(null, vnode, container, parentComponent, null)
  }

  // patch 处理虚拟节点
  function patch(n1, n2, container, parentComponent, anchor = null) {
    const { type, shapeFlag } = n2
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件 component
          processComponent(n1, n2, container, parentComponent, anchor)
        } else if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理元素 element
          processElement(n1, n2, container, parentComponent, anchor)
        }
        break
    }
  }

  // 处理文本节点
  function processText(n1, n2, container) {
    const { children } = n2 // todo
    const textNode = (n2.el = document.createTextNode(children))
    container.appendChild(textNode)
  }

  /**
   * 处理 Fragment 节点
   * @param vnode
   * @param container
   * 对于 Fragment 节点，只需处理其 children 即可
   */
  function processFragment(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor)
  }

  // 处理 element 节点
  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor)
    } else {
      patchElement(n1, n2, parentComponent, anchor)
    }
  }

  // 更新 element 节点
  function patchElement(n1, n2, parentComponent, anchor) {
    const el = (n2.el = n1.el)
    // 更新 props
    patchProps(n1, n2, el)
    // 更新 children
    patchChildren(n1, n2, el, parentComponent, anchor)
  }

  // 更新 children
  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag
    const c1 = n1.children
    const c2 = n2.children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        console.log('数组 -> 文本')
        // text -> array
        // 清空之前的 children
        unmountChildren(c1)
        // 设置 text
        hostSetElementText(container, c2)
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountChildren(c2, container, parentComponent, anchor)
      } else {
        patchKeydChildren(c1, c2, container, parentComponent, anchor)
      }
    }
  }

  function patchKeydChildren(c1, c2, container, parentComponent, parentAnchor) {
    const l2 = c2.length
    let i = 0
    let e1 = c1.length - 1
    let e2 = l2 - 1

    function isSameType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key
    }

    // 左侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]

      if (isSameType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }
      i++
    }
    // 右侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]

      if (isSameType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }
      e1--
      e2--
    }
    // 新的比老的多
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : null
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // 老的比新的多
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    } else {
      // 中间乱序部分
      let s1 = i
      let s2 = i
      const toBePatched = e2 - s2 + 1
      let patched = 0
      const keyToNewIndexMap = new Map()
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0)
      let move = false
      let maxNewIndexSoFar = 0
      for (let i = s2; i <= e2; i++) {
        // 获取新节点的索引映射表
        const nextChild = c2[i]
        keyToNewIndexMap.set(nextChild.key, i)
      }

      for (let i = s1; i <= e1; i++) {
        // 旧节点在新节点中是否存在

        let newIndex
        const prevChild = c1[i]

        if (patched >= toBePatched) {
          // 剩余节点要被卸载
          hostRemove(prevChild.el)
          continue
        }

        if (prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSameType(prevChild, c2[j])) {
              newIndex = j
              break
            }
          }
        }

        if (newIndex === undefined) {
          hostRemove(prevChild.el)
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            move = true
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          patch(prevChild, c2[newIndex], container, parentComponent, null)
          patched++
        }
      }

      const increasingNewIndexSequence = move
        ? getSequence(newIndexToOldIndexMap)
        : [] // 最长递增子序列
      let j = 0
      for (let i = toBePatched; i >= 0; i--) {
        const nextIndex = i + s2
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null
        if(newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor)
        } else {

          if (move) {
            if (j < 0 || i !== increasingNewIndexSequence[j]) {
              hostInsert(nextChild.el, container, anchor)
            } else {
              j++
            }
          }
        }
      }
    }
  }

  // 卸载 children
  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      hostRemove(children[i])
    }
  }

  // 更新 props
  const EMPTY_OBJ = {}
  function patchProps(n1, n2, el) {
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prev = oldProps[key]
        const next = newProps[key]
        if (prev !== next) {
          hostPatchProp(el, key, next)
        }
      }

      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, null)
          }
        }
      }
    }
  }

  // 挂载 element 节点
  function mountElement(vnode, container, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type))
    const { children, shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor)
    }

    const { props } = vnode
    if (props) {
      for (const key in props) {
        const val = props[key]

        hostPatchProp(el, key, val)
      }
    }

    hostInsert(el, container, anchor)
  }

  // children 是数组时，递归处理
  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor)
    })
  }

  function processComponent(n1, n2, container, parentComponent, anchor) {
    if(!n1) {

      mountComponent(n2, container, parentComponent, anchor)
    } else {
      updateComponent(n1, n2)
    }
  }


  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component)
    if(shouldUpdateComponent(n1, n2)) {

      instance.next = n2
      instance.update()
    } else {
      n2.el = n1.el
      instance.vnode = n2
    }
  }

  function mountComponent(vnode, container, parentComponent, anchor) {
    const instance = (vnode.component = createComponentInstance(vnode, parentComponent))
    // 处理 setup 函数
    setupComponent(instance)
    // 渲染
    setupRenderEffect(instance, container, anchor)
  }

  function setupRenderEffect(instance, container, anchor) {
    instance.update = effect(() => {
      const { proxy } = instance
      if (!instance.isMounted) {
        const subTree = (instance.subTree = instance.render.call(proxy, proxy))
        patch(null, subTree, container, instance, anchor)
        instance.vnode.el = subTree.el
        instance.isMounted = true
      } else {
        const {next, vnode} = instance
        if(next) {
          next.el = vnode.el
          updateComponentPreRender(instance, next)
        }
        const subTree = instance.render.call(proxy, proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree
        patch(prevSubTree, subTree, container, instance, anchor)
      }
    }, {
      scheduler() {
        queueJobs(instance.update)
      }
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}


function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode
  instance.next = null
  instance.props = nextVNode.props
}


function getSequence(arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
