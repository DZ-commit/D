/**
 * React 错误边界 —— 防止单个子组件渲染崩溃把整页搞白板
 * 用法：<ErrorBoundary><SomeChild /></ErrorBoundary>
 * 出现错误时只展示一个友好提示 + 重试按钮，不影响侧栏/顶栏
 */
import React from 'react'
import { Button, Result } from 'antd'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // 控制台输出完整堆栈供调试
    console.error('[ErrorBoundary] 子组件渲染崩溃:', error, info)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      // 默认回退 UI：只提示错误 + 重试按钮，不影响父布局
      return (
        <Result
          status="warning"
          title="页面加载出错了"
          subTitle={this.state.error?.message || '组件渲染失败，请刷新或重试'}
          extra={
            <Button type="primary" onClick={this.reset}>
              重试
            </Button>
          }
        />
      )
    }
    return this.props.children
  }
}
