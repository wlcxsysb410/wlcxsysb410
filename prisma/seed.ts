import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 创建管理员账户
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: '管理员',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // 创建导师账户
  const supervisorPassword = await bcrypt.hash('teacher123', 10)
  const supervisor = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      name: '李教授',
      email: 'teacher@example.com',
      password: supervisorPassword,
      role: 'SUPERVISOR',
    },
  })

  // 创建学生账户
  const studentPassword = await bcrypt.hash('student123', 10)
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      name: '张三',
      email: 'student@example.com',
      password: studentPassword,
      role: 'STUDENT',
    },
  })

  // 创建经费项目
  const fund1 = await prisma.fund.upsert({
    where: { code: 'NSFC-2023-001' },
    update: {},
    create: {
      name: '国家自然科学基金',
      code: 'NSFC-2023-001',
      source: '纵向',
      totalAmount: 500000,
      usedAmount: 350000,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'ACTIVE',
    },
  })

  const fund2 = await prisma.fund.upsert({
    where: { code: 'HZ-2023-003' },
    update: {},
    create: {
      name: '企业横向项目A',
      code: 'HZ-2023-003',
      source: '横向',
      totalAmount: 200000,
      usedAmount: 180000,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2024-06-30'),
      status: 'WARNING',
    },
  })

  const fund3 = await prisma.fund.upsert({
    where: { code: 'PROV-2024-001' },
    update: {},
    create: {
      name: '省级重点研发',
      code: 'PROV-2024-001',
      source: '纵向',
      totalAmount: 300000,
      usedAmount: 45000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
    },
  })

  // 创建示例报销单
  await prisma.expense.createMany({
    data: [
      {
        code: 'BX2024032501',
        title: '北京出差报销',
        type: 'TRAVEL',
        amount: 1850,
        description: '参加学术会议差旅费',
        fundId: fund1.id,
        applicantId: student.id,
        status: 'PENDING',
      },
      {
        code: 'BX2024032401',
        title: '论文版面费',
        type: 'PUBLICATION',
        amount: 2000,
        description: 'SCI论文发表版面费',
        fundId: fund1.id,
        applicantId: student.id,
        status: 'PROCESSING',
      },
      {
        code: 'BX2024032201',
        title: '实验室耗材采购',
        type: 'PURCHASE',
        amount: 3670,
        description: '常规实验耗材',
        fundId: fund3.id,
        applicantId: student.id,
        status: 'COMPLETED',
      },
    ],
    skipDuplicates: true,
  })

  console.log('数据库初始化完成！')
  console.log('-----------------------------------')
  console.log('演示账户：')
  console.log('管理员：admin@example.com / admin123')
  console.log('导师：teacher@example.com / teacher123')
  console.log('学生：student@example.com / student123')
  console.log('-----------------------------------')
  console.log('注册邀请码：LAB2024')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })