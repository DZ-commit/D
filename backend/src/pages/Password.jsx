/**
 * 密码修改页 —— 对齐 PRD §7.1 / UI/UX §6 视图11
 * 功能：管理员修改自身密码；首次登录强制改密时隐藏旧密码字段（仅 new_password）
 * 说明：仅管理员可见（普通用户无系统入口，ADR-010）；密码强度校验（≥8位含字母数字，后端校验）
 */
import React, { useEffect, useState } from 'react'
import { Button, Card, Form, Input, message } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { changePassword, fetchMe } from '../api/client'

/** 密码修改页组件 */
export default function Password() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [firstTime, setFirstTime] = useState(false) // 首次强制改密标记
  const navigate = useNavigate()

  // 判断是否首次强制改密（must_change_password=1）
  useEffect(() => {
    fetchMe().then((me) => setFirstTime(me.must_change_password === 1)).catch(() => {})
  }, [])

  /** 提交：调用改密接口 → 成功提示 → 回仪表盘 */
  const onFinish = async (values) => {
    setLoading(true)
    try {
      const payload = firstTime
        ? { new_password: values.new_password } // 首次：无需旧密码（后端逻辑）
        : { old_password: values.old_password, new_password: values.new_password }
      await changePassword(payload)
      message.success('密码修改成功')
      navigate('/dashboard', { replace: true })
    } catch (e) { /* 错误已提示 */ } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={firstTime ? '首次登录，请设置新密码' : '修改密码'} style={{ maxWidth: 480, margin: '0 auto' }}>
      {firstTime && (
        <p className="text-sm text-orange-500 mb-4">
          出于安全考虑，首次登录后必须修改初始密码（需至少 8 位且包含字母与数字）。
        </p>
      )}
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* 常规修改才需要旧密码 */}
        {!firstTime && (
          <Form.Item name="old_password" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="当前密码" autoComplete="current-password" />
          </Form.Item>
        )}
        <Form.Item
          name="new_password"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '至少 8 位' },
            { pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/, message: '需同时包含字母与数字' },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="至少 8 位，包含字母与数字" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="确认新密码"
          dependencies={['new_password']}
          rules={[
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) return Promise.resolve()
                return Promise.reject(new Error('两次输入的密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="再次输入新密码" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44 }}>
          确认修改
        </Button>
      </Form>
    </Card>
  )
}
