/**
 * 图片上传组件（后台）—— 对齐 PRD §12.1 / ADR-003
 * 功能：AntD Upload 封装；自定义请求上传到 POST /api/admin/upload；单选（封面/头像类）；
 *       多图（图集类）用 value 数组；展示/替换/删除；返回 /uploads/ 相对路径
 */
import React from 'react'
import { Button, Upload } from 'antd'
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { uploadImage } from '../api/client'

/** 单图上传：value 为图片 URL 字符串 */
export function ImageUpload({ value, onChange, label = '上传图片' }) {
  // 自定义上传：成功后回调 URL 给表单
  const customRequest = async ({ file, onSuccess, onError }) => {
    try {
      const { url } = await uploadImage(file)
      onChange?.(url)
      onSuccess?.({ url })
    } catch (e) {
      onError?.(e)
    }
  }

  return (
    <div className="flex items-start gap-4">
      <Upload
        showUploadList={false}
        customRequest={customRequest}
        accept="image/jpeg,image/png,image/webp"
      >
        <div className="w-28 h-28 rounded-lg border border-dashed flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#4F46E5] transition-colors" style={{ borderColor: '#d9d9d9' }}>
          {value ? (
            <img src={value} alt="预览" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-center text-xs px-2">
              <PlusOutlined className="text-lg mb-1 block" />
              {label}
            </span>
          )}
        </div>
      </Upload>
      {value && (
        <Button danger size="small" icon={<DeleteOutlined />} onClick={() => onChange?.('')}>
          移除
        </Button>
      )}
    </div>
  )
}

/** 多图上传：value 为 URL 数组（图集 gallery 用） */
export function GalleryUpload({ value = [], onChange, max = 9 }) {
  // 上传成功后追加到数组
  const customRequest = async ({ file, onSuccess, onError }) => {
    try {
      const { url } = await uploadImage(file)
      onChange?.([...(value || []), url])
      onSuccess?.({ url })
    } catch (e) {
      onError?.(e)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {value.map((url, i) => (
        <div key={url + i} className="relative w-24 h-24 rounded-lg overflow-hidden group">
          <img src={url} alt={`图${i + 1}`} className="w-full h-full object-cover" />
          {/* 删除按钮（hover 显示） */}
          <button
            type="button"
            onClick={() => onChange?.(value.filter((_, j) => j !== i))}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs hidden group-hover:flex items-center justify-center"
            aria-label="删除图片"
          >
            ✕
          </button>
        </div>
      ))}
      {value.length < max && (
        <Upload showUploadList={false} customRequest={customRequest} accept="image/jpeg,image/png,image/webp">
          <div className="w-24 h-24 rounded-lg border border-dashed flex items-center justify-center cursor-pointer hover:border-[#4F46E5] transition-colors" style={{ borderColor: '#d9d9d9' }}>
            <PlusOutlined style={{ color: '#999' }} />
          </div>
        </Upload>
      )}
    </div>
  )
}
