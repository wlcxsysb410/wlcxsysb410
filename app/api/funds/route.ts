import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// 获取经费列表
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getCurrentUser(token || null)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const funds = await prisma.fund.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ funds })
  } catch (error) {
    console.error('Get funds error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// 创建经费项目
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getCurrentUser(token || null)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const { name, code, source, totalAmount, startDate, endDate } = await request.json()

    const fund = await prisma.fund.create({
      data: {
        name,
        code,
        source,
        totalAmount: parseFloat(totalAmount),
        usedAmount: 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    })

    return NextResponse.json({ success: true, fund })
  } catch (error) {
    console.error('Create fund error:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}