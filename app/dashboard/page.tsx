import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getDashboardData(userId: string, role: string) {
  const [
    funds,
    recentExpenses,
    expenseStats,
    fundStats,
  ] = await Promise.all([
    // 经费列表
    prisma.fund.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // 近期报销
    prisma.expense.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        applicant: { select: { name: true } },
        fund: { select: { name: true } },
      },
    }),
    // 报销统计
    prisma.expense.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true },
    }),
    // 经费统计
    prisma.fund.aggregate({
      _sum: { totalAmount: true, usedAmount: true },
      _count: true,
    }),
  ])

  // 计算本月支出
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const monthlyExpenses = await prisma.expense.aggregate({
    where: {
      createdAt: { gte: thisMonth },
      status: { not: 'REJECTED' },
    },
    _sum: { amount: true },
  })

  const pendingCount = expenseStats.find(e => e.status === 'PENDING')?._count || 0
  const processingCount = expenseStats.find(e => e.status === 'PROCESSING')?._count || 0
  const completedSum = expenseStats.find(e => e.status === 'COMPLETED')?._sum.amount || 0

  return {
    funds,
    recentExpenses,
    stats: {
      totalFunds: fundStats._sum.totalAmount || 0,
      usedFunds: fundStats._sum.usedAmount || 0,
      remainingFunds: (fundStats._sum.totalAmount || 0) - (fundStats._sum.usedAmount || 0),
      fundCount: fundStats._count,
      pendingCount,
      processingCount,
      monthlyExpenses: monthlyExpenses._sum.amount || 0,
    },
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount)
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }
  const texts: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待审批',
    APPROVED: '审批通过',
    PROCESSING: '处理中',
    COMPLETED: '已完成',
    REJECTED: '已驳回',
  }
  return { style: styles[status] || 'bg-gray-100 text-gray-700', text: texts[status] || status }
}

export default async function DashboardPage() {
  const token = cookies().get('token')?.value
  const user = await getCurrentUser(token || null)

  if (!user) {
    redirect('/login')
  }

  const data = await getDashboardData(user.id, user.role)

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">经费余额</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(data.stats.remainingFunds)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">本月支出</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(data.stats.monthlyExpenses)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待审批</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{data.stats.pendingCount} 笔</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">处理中</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{data.stats.processingCount} 笔</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 近期报销 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">近期报销</h3>
            <Link href="/dashboard/expenses" className="text-sm text-blue-600 hover:underline">查看全部</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentExpenses.map((expense) => {
              const badge = getStatusBadge(expense.status)
              return (
                <div key={expense.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{expense.title}</p>
                      <p className="text-sm text-gray-500">{expense.applicant.name} · {expense.fund.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{formatCurrency(expense.amount)}</p>
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${badge.style}`}>{badge.text}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {data.recentExpenses.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                暂无报销记录
              </div>
            )}
          </div>
        </div>

        {/* 经费项目 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">经费项目</h3>
            <Link href="/dashboard/funds" className="text-sm text-blue-600 hover:underline">管理</Link>
          </div>
          <div className="p-4 space-y-3">
            {data.funds.map((fund) => {
              const usedPercent = (fund.usedAmount / fund.totalAmount) * 100
              return (
                <div key={fund.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-gray-800 text-sm">{fund.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${usedPercent > 80 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {usedPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${usedPercent > 80 ? 'bg-red-500' : usedPercent > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(usedPercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>已用 {formatCurrency(fund.usedAmount)}</span>
                    <span>余额 {formatCurrency(fund.totalAmount - fund.usedAmount)}</span>
                  </div>
                </div>
              )
            })}
            {data.funds.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                暂无经费项目
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}