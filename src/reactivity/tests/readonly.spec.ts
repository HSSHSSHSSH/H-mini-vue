import { readonly } from '../reactive'

describe('readonly', () => {
  it('happy path', () => {
    const original = readonly({ foo: 1 })
    const wrapped = readonly(original)
    expect(wrapped).not.toBe(original)
    expect(wrapped.foo).toBe(1)
  })

  // it('warn when calling set', () => {
  //   const user = readonly({
  //     age: 10
  //   })
  //   user.age = 11
  //   // console.warn = jest.fn()
  //   expect(console.warn).toHaveBeenCalled()
  // })
})