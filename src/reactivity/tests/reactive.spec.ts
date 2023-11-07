
import { reactive, isReactive, shallowReactive } from "../reactive"
describe("reactive", () => {
  it("happy path", () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(observed).not.toBe(original)
    expect(observed.foo).toBe(1)
    expect(isReactive(original)).toBe(false)
    expect(isReactive(observed)).toBe(true)
  })
  it("nested reactive", () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{ bar: 2 }]
    }
    const observed = reactive(original)
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })

  it('shallow reactive', () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{ bar: 2 }]
    }
    const wrapped = shallowReactive(original)
    expect(isReactive(wrapped)).toBe(true)
    expect(isReactive(wrapped.nested)).toBe(false)
    expect(isReactive(wrapped.array)).toBe(false)
    expect(isReactive(wrapped.array[0])).toBe(false)
  })
})