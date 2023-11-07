import { trackEffect, triggerEffect } from './effect'

class RefImpl {
  private _value: any
  public deps: Set<any>
  constructor(value) {
    this._value = value
    this.deps = new Set()
  }
  get value() {
    trackEffect(this.deps)
    return this._value
  }

  set value(newValue) {
    if (Object.is(newValue, this.value)) return
    this._value = newValue
    triggerEffect(this.deps)
  }
}

export function ref(value) {
  return new RefImpl(value)
}
