const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
}


export const PublicInstanceProxyHandlers = {
  get({_: instance}, key) {
    const {setupState, props} = instance
    if (hasOwn(setupState, key)) {
      return instance.setupState[key]
    } else if (hasOwn(props, key)) {
      return instance.props[key]
    }
    const publicGetter = publicPropertiesMap[key]
    if(publicGetter) {
      return publicGetter(instance)
    }
  },
  // set(target, key, value) {},
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}