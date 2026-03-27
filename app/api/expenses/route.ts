import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// 获取报销列表
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getCurrentUser(token || null)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    // 学生只能看自己的报销
    if (user.role === 'STUDENT') {
      where.applicantId = user.id
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: { select: { name: true } },
        fund: { select: { name: true } },
        invoices: true,
      },
    })

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error('Get expenses error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// 创建报销
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getCurrentUser(token || null)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { title, type, amount, description, fundId } = await request.json()

    // 生成报销单号
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const code = `BX${dateStr}${random}`

    const expense = await prisma.expense.create({
      data: {
        code,
        title,
        type,
        amount: parseFloat(amount),
        description,
        fundId,
        applicantId: user.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, expense })
  } catch (error) {
    console.error('Create expense error:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}