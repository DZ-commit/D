/**
 * 后台登录页 —— 对齐 PRD §7.1 / UI/UX §6 视图
 * 功能：用户名+密码登录；失败提示（含限流 429）；登录后 must_change_password=1 → 强制跳转改密页
 */
import React, { useState } from 'react'
import { Button, Card, Form, Input, Typography, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../api/client'

/** 登录页组件 */
export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  /** 提交登录：成功存 token/user；需强制改密则跳改密页，否则进仪表盘 */
  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = await adminLogin(values)
      // 保存登录态（JWT + 用户信息，用于请求拦截器与菜单权限）
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_user', JSON.stringify({
        username: data.username, role: data.role, avatar_url: data.avatar_url,
      }))
      if (data.must_change_password) {
        // 首次登录强制改密（PRD §7.1）
        navigate('/password', { replace: true })
        message.info('首次登录，请先修改密码')
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (e) {
      // 错误信息已由拦截器提示（含限流 429）
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#F3F4F6' }}
    >
      <Card style={{ width: 400 }} styles={{ body: { padding: 40 } }}>
        {/* 品牌标识 */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 font-serif text-xl text-white"
            style={{ background: '#4F46E5' }}
          >
            D
          </div>
          <Typography.Title level={4} style={{ marginBottom: 4 }}>
            D全屋家居 · 后台管理
          </Typography.Title>
          <Typography.Text type="secondary">管理员 / 普通用户登录</Typography.Text>
        </div>

        <Form name="login" size="large" onFinish={onFinish}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44 }}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
