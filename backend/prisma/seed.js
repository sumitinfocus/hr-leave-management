const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const prisma = new PrismaClient()

async function main(){
  await prisma.department.createMany({ data: [
    { name: 'HR' },
    { name: 'Engineering' },
    { name: 'Sales' }
  ]})

  const passwordHash = await bcrypt.hash('password', 10)

  const hr = await prisma.employee.create({
    data: {
      firstName: 'Alice', lastName: 'HR', email: 'alice@example.com', passwordHash, role: 'HR_ADMIN', departmentId: 1
    }
  })

  const manager = await prisma.employee.create({
    data: { firstName: 'Bob', lastName: 'Manager', email: 'bob@example.com', passwordHash, role: 'MANAGER', departmentId:2, managerId: hr.id }
  })

  await prisma.employee.create({
    data: { firstName: 'Carol', lastName: 'Dev', email: 'carol@example.com', passwordHash, role: 'EMPLOYEE', departmentId:2, managerId: manager.id }
  })

  await prisma.leaveEntitlement.createMany({ data: [
    { year: 2026, employeeId: hr.id, casual: 8, privilege: 15, sick: 10, maternity: 90, paternity: 14, officialTour: 20 },
  ]})
  // create entitlement for others
  const all = await prisma.employee.findMany()
  for(const e of all){
    await prisma.leaveEntitlement.upsert({
      where: { id: e.id },
      update: {},
      create: { year: 2026, employeeId: e.id, casual: 8, privilege: 12, sick: 10, maternity: 90, paternity: 14, officialTour: 10 }
    }).catch(()=>{})
  }
}

main().catch(e => { console.error(e); process.exit(1) }).finally(()=>prisma.$disconnect())