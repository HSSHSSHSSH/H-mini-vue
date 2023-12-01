// 源码里面这些接口是由 runtime-dom 来实现
// 这里先简单实现

import { isOn } from '../shared'
import { createRenderer } from '../runtime-core'

// 后面也修改成和源码一样的实现
function createElement(type) {
  const element = document.createElement(type)
  return element
}

function createText(text) {
  return document.createTextNode(text)
}

function setText(node, text) {
  node.nodeValue = text
}

function setElementText(el, text) {
  el.textContent = text
}

// function patchProp(el, key, preValue, nextValue) {
//   // preValue 之前的值
//   // 为了之后 update 做准备的值
//   // nextValue 当前的值

//   if (isOn(key)) {
//     // 添加事件处理函数的时候需要注意一下
//     // 1. 添加的和删除的必须是一个函数，不然的话 删除不掉
//     //    那么就需要把之前 add 的函数给存起来，后面删除的时候需要用到
//     // 2. nextValue 有可能是匿名函数，当对比发现不一样的时候也可以通过缓存的机制来避免注册多次
//     // 存储所有的事件函数
//     const invokers = el._vei || (el._vei = {});
//     const existingInvoker = invokers[key];
//     if (nextValue && existingInvoker) {
//       // patch
//       // 直接修改函数的值即可
//       existingInvoker.value = nextValue;
//     } else {
//       const eventName = key.slice(2).toLowerCase();
//       if (nextValue) {
//         const invoker = (invokers[key] = nextValue);
//         el.addEventListener(eventName, invoker);
//       } else {
//         el.removeEventListener(eventName, existingInvoker);
//         invokers[key] = undefined;
//       }
//     }
//   } else {
//     if (nextValue === null || nextValue === "") {
//       el.removeAttribute(key);
//     } else {
//       el.setAttribute(key, nextValue);
//     }
//   }
// }

export function patchProp(el, key,  nextVal) {
  const isOn = (key) => /^on[A-Z]/.test(key)
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase()
    el.addEventListener(event, nextVal)
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, nextVal)
    }
  }
}

function insert(child, parent, anchor = null) {
  parent.insertBefore(child, anchor)
}

function remove(child) {
  const parent = child.parentNode
  if (parent) {
    parent.removeChild(child)
  }
}

let renderer

function ensureRenderer() {
  // 如果 renderer 有值的话，那么以后都不会初始化了
  return (
    renderer ||
    (renderer = createRenderer({
      createElement,
      createText,
      setText,
      setElementText,
      patchProp,
      insert,
      remove,
    }))
  )
}

export const createApp = (...args) => {
  return ensureRenderer().createApp(...args)
}

export * from '../runtime-core'
