import { readonly, isReadonly, shallowReadonly } from '../reactive'

describe('readonly', () => {
  it('happy path', () => {
    const original = { foo: 1 }
    const wrapped = readonly(original)
    expect(wrapped).not.toBe(original)
    expect(wrapped.foo).toBe(1)
    expect(isReadonly(original)).toBe(false)
    expect(isReadonly(wrapped)).toBe(true)
  })

  // it('warn when calling set', () => {
  //   const user = readonly({
  //     age: 10
  //   })
  //   user.age = 11
  //   // console.warn = jest.fn()
  //   expect(console.warn).toHaveBeenCalled()
  // })

  it('nested readonly', () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{ bar: 2 }]
    }
    const wrapped = readonly(original)
    expect(isReadonly(wrapped.nested)).toBe(true)
    expect(isReadonly(wrapped.array)).toBe(true)
    expect(isReadonly(wrapped.array[0])).toBe(true)
  })

  it('shallow readonly', () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{ bar: 2 }]
    }
    const wrapped = shallowReadonly(original)
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(wrapped.nested)).toBe(false)
    expect(isReadonly(wrapped.array)).toBe(false)
    expect(isReadonly(wrapped.array[0])).toBe(false)
  })
})