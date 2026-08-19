/**
 * React 错误边界 —— 防止单个子组件渲染崩溃把整页搞白板
 * 用法：<ErrorBoundary><SomeChild /></ErrorBoundary>
 * 出现错误时只展示一个友好提示 + 重试按钮 + 完整堆栈（便于排查），不影响侧栏/顶栏
 */
import React from 'react'
import { Button, Result } from 'antd'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // 控制台输出完整堆栈供调试
    console.error('[ErrorBoundary] 子组件渲染崩溃:', error, info)
    this.setState({ info })
  }

  reset = () => {
    this.setState({ error: null, info: null })
  }

  render() {
    if (this.state.error) {
      const detail = this.state.error?.stack || this.state.error?.message || '未知错误'
      const componentStack = this.state.info?.componentStack || ''
      return (
        <Result
          status="warning"
          title="页面加载出错了"
          subTitle={this.state.error?.message || '组件渲染失败，请刷新或重试'}
          extra={
            <>
              <Button type="primary" onClick={this.reset}>重试</Button>
              {/* 完整堆栈（便于定位报错位置；折叠显示避免占大量空间） */}
              <details style={{ marginTop: 24, textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#4F46E5' }}>
                  查看完整堆栈（开发用）
                </summary>
                <pre style={{
                  marginTop: 12, padding: 12, background: '#F3F4F6', borderRadius: 4,
                  fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 360, overflow: 'auto',
                }}>
{`Error: ${detail}\n\n${componentStack}`}
                </pre>
              </details>
            </>
          }
        />
      )
    }
    return this.props.children
  }
}
