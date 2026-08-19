/**
 * 职位详情 —— 对齐 UI/UX §5 视图9 / PRD §6.4 / D2
 * 功能：职位描述、任职要求、投递方式（apply_info）；轻量「投递意向」表单（姓名/电话/意向职位）
 * 说明：投递意向提交入 Inquiry(type=job)，后台询盘中心统一查看（v1 不做简历上传，D2）
 */
import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchJob } from '../api/client'
import InquiryForm from '../components/InquiryForm'
import { Loading, ProseHtml } from '../components/common'

/** 职位详情主组件 */
export default function JobDetail() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const [job, setJob] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setJob(null)
    setNotFound(false)
    fetchJob(id).then(setJob).catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return <main className="max-w-4xl mx-auto px-6 py-24 text-center text-muted">职位不存在或已下架</main>
  }
  if (!job) return <Loading />

  const catLabel = job.category === 'social' ? '社会招聘' : '校园招聘'

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/jobs" className="text-sm text-muted hover:text-brass">← 返回招聘列表</Link>

      {/* 职位信息区 */}
      <div className="mt-6 bg-white rounded-xl border border-line p-8">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl text-ink">{job.title}</h1>
          <span className="text-xs text-brass border border-brass/40 rounded-full px-3 py-1">{catLabel}</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-muted">
          {job.department && <span>部门：{job.department}</span>}
          {job.city && <span>工作城市：{job.city}</span>}
          {job.publish_date && <span>发布日期：{job.publish_date}</span>}
        </div>

        {/* 职位描述 */}
        {job.description && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-ink mb-3">职位描述</h2>
            <ProseHtml html={job.description} />
          </div>
        )}

        {/* 任职要求 */}
        {job.requirements && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-ink mb-3">任职要求</h2>
            <ProseHtml html={job.requirements} />
          </div>
        )}

        {/* 投递方式展示（apply_info：邮箱/说明，PRD §6.4） */}
        {job.apply_info && (
          <div className="mt-8 rounded-lg bg-cream border border-line p-5 text-sm">
            <span className="text-muted">投递方式：</span>
            <span className="text-ink">{job.apply_info}</span>
          </div>
        )}
      </div>

      {/* 投递意向表单（轻量，D2：v1 不做简历上传） */}
      <div className="mt-10 bg-white rounded-xl border border-line p-8">
        <h2 className="font-serif text-2xl text-ink mb-6">在线投递意向</h2>
        <p className="text-sm text-muted mb-6">填写以下信息，我们会尽快与您联系（意向职位已自动填入）。</p>
        <InquiryForm kind="job" defaultSubject={job.title} />
      </div>
    </main>
  )
}
