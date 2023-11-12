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
          if(Array.isArray(invoker.value)) {
            invoker.value.forEach(fn => fn(e))
          } else {
            invoker.value(e)
          }
        }
        invoker.value = value
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
  const parent = vnode.el.parentNode
  parent.removeChild(vnode.el)
}

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

export { createElement, setElementText, insert, patchProps, unmount }
