import { computed } from '../computed'
import { reactive } from '../reactive'

describe('computed', () => {
  it('happy path', () => {
    const user = reactive({
      age: 1,
    })

    const age = computed(() => {
      return user.age
    })

    expect(age.value).toBe(1)
  })

  it('should compute lazily', () => {
    const value = reactive({
      foo: 1,
    })
    const getter = jest.fn(() => {
      return value.foo
    })

    const cValue = computed(getter)

    expect(getter).not.toHaveBeenCalled()

    expect(cValue.value).toBe(1) // 此时首次访问计算属性的 value
    expect(getter).toHaveBeenCalledTimes(1)

    // 再次访问 cValue.value 时，依赖变量未发生改变，不 compute

    cValue.value

    expect(getter).toHaveBeenCalledTimes(1)

    value.foo = 2
    // 依赖发生改变，为访问
    expect(getter).toHaveBeenCalledTimes(1)

    // 再次访问 cValue.value 且依赖发生改变， compute

    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  })
})
