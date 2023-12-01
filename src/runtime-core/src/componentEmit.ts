import { camelize, toHandlerKey } from "../../shared/index"


export function emit(instance, eventName, ...payload) {
  let event = toHandlerKey(camelize(eventName)) 
  let handler = instance.vnode.props[event]
  if(handler) {
    handler(...payload)
  }
}


