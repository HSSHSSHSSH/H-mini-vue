export const MyComponent = {
  name:'MyComponent',
  data() {
    return {
      foo: 1
    }
  },
  // beforeCreate() {
  //   console.log('beforeCreate')
  // },
  // created() {
  //   console.log('created')
  // },
  // beforeMount() {
  //   console.log('beforeMount')
  // },
  // mounted() {
  //   console.log('mounted')
  // },
  // beforeUpdate() {
  //   console.log('beforeUpdate')
  // },
  // updated() {
  //   console.log('updated')
  // },
  props: {
    title: String,
  },
  render() {
    return {
      type: 'div',
      children: `${this.title} ${this.foo}` 
    }
  }
}


/**
 * setup 函数有两种情况的返回值
 * 一种是返回一个函数作为渲染函数
 * 一种是返回一个对象，对象中的属性和方法会被合并到组件实例中
 * setup 函数接受两个参数 props , setupContext
 * setupContext 中包含了 attrs, slots, emit, expose
 */

export const MySetupComponent1 = {
  setup(props, setupContext) {
    return () => {
      return {
        type: 'div',
        children: '一个返回render函数的setup组件'
      }
    }
  }
}

export const MySetupComponent2 = {
  setup(props, setupContext) {
    const count = 0
    const str = '乌迪尔'
    return {
      count,
      str
    }
  },
  render() {
    return {
      type: 'div',
      children: `${this.str} ${this.count}`
    }
  }
}