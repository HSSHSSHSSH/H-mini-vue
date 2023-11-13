import { NodeFlags } from "../../../../lib/guide-mini-vue.esm.js"

// 用于创建元素
function createElement(tag) {
  return document.createElement(tag)
}
// 用于设置文本节点
function setElementText(el, text) {
  el.innerHTML = text
}
// 用于在给定 parent 上挂在 vnode
function insert(el, parent, anchor = null) {
  parent.insertBefore(el, anchor)
}
// 用于设置元素属性
function patchProps(el, key, preValue, value) {
  if (/^on/.test(key)) {
    // 处理事件
    const eventName = key.slice(2).toLowerCase()
    let invokers = el._vei || (el._vei = {})
    let invoker = invokers[eventName]
    if (value) {
      if (!invoker) {
        invoker = el._vei[eventName] = (e) => {
          // 若函数的发生时间早于事件的绑定时间则不做处理
          // if(e.timeStamp < invoker.attached) return
          if(Array.isArray(invoker.value)) {
            invoker.value.forEach(fn => fn(e))
          } else {
            invoker.value(e)
          }
        }
        invoker.value = value
        // invoker.attached = performance.now()
        el.addEventListener(eventName, invoker)
      } else {
        invoker.value = value
      }
    } else if (invoker) {
      el.removeEventListener(eventName, invoker)
      el._vei = null
    }
  } else if (key === 'class') {
    // 处理 class
    el.className = normalizeClass(value)
  } else if (shouldSetAsProps(el, key, preValue, value)) {
    // 判断是否是 DOM properties
    let type = typeof el[key]
    if (type === 'boolean' && value === '') {
      // 若是布尔类型且value是字符串，则设置为 true
      el[key] = true
    } else {
      el[key] = value
    }
  } else {
    // 若不是 DOM properties，则设置为 attribute
    el.setAttribute(key, value)
  }
}

// 用于卸载元素
function unmount(vnode) {
  console.log('卸载', vnode);
  // 对于 Fragment 标签需操作其 children
  if (vnode.type === NodeFlags.Fragment) {
    vnode.children.forEach(unmount)
    return
  }
  const parent = vnode.el.parentNode
  parent.removeChild(vnode.el)
}

// 用于创建文本节点
function createText(text) {
  return document.createTextNode(text)
}
// 用于创建注释节点
function createComment(text) {
  return document.createComment(text)
}
// 用于更改节点文本内容
function setNodeText(el, text) {
  el.nodeValue = text
}

// 有一些属性是只读的，因此只能使用 setAttribute 来设置
function shouldSetAsProps(el, key, value) {
  if (key === 'form' && el.tagName === 'INPUT') return false
  return key in el
}

// 将 class 转换为 className
function normalizeClass(value) {
  let res = ''
  if (typeof value === 'string') {
    res = value
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      res += normalizeClass(value[i]) + ' '
    }
  } else if (typeof value === 'object') {
    for (const name in value) {
      if (value[name]) {
        res += name + ' '
      }
    }
  }
  return res.trim() // 去掉首尾空格
}

export { 
  createElement, 
  setElementText, 
  insert, 
  patchProps, 
  unmount,
  createText,
  createComment,
  setNodeText,
 }
