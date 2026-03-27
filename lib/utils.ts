import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount)
}

export function generateCode(prefix: string): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${dateStr}${random}`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // 报销状态
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    // 经费状态
    ACTIVE: 'bg-green-100 text-green-700',
    WARNING: 'bg-yellow-100 text-yellow-700',
    CLOSED: 'bg-gray-100 text-gray-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待审批',
    APPROVED: '审批通过',
    PROCESSING: '处理中',
    ACCEPTED: '已受理',
    COMPLETED: '已完成',
    REJECTED: '已驳回',
    ACTIVE: '正常',
    WARNING: '预警',
    CLOSED: '已结题',
  }
  return texts[status] || status
}