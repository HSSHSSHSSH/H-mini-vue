import { reactive, readonly, shallowReactive, shallowReadonly, isProxy } from "../reactive"



describe('isProxy', () => {
  it('happy path', () => {
    const obj = { foo : 1, nested: { bar: 2 }, array: [{ baz: 3 }] }
    const reactive_obj = reactive(obj)
    const readonly_obj = readonly(obj)
    const shallow_reactive_obj = shallowReactive(obj)
    const shallow_readonly_obj = shallowReadonly(obj)
    expect(isProxy(obj)).toBe(false)
    expect(isProxy(reactive_obj)).toBe(true)
    expect(isProxy(readonly_obj)).toBe(true)
    expect(isProxy(shallow_reactive_obj)).toBe(true)
    expect(isProxy(shallow_readonly_obj)).toBe(true)
  })
})