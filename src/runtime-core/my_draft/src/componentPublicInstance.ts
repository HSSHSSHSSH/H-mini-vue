const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
}


export const PublicInstanceProxyHandlers = {
  get({_: instance}, key) {
    if (key in instance.setupState) {
      return instance.setupState[key]
    }
    const publicGetter = publicPropertiesMap[key]
    if(publicGetter) {
      return publicGetter(instance)
    }
  },
  // set(target, key, value) {},
}