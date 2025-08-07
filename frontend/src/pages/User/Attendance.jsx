import DashboardLayout from '../../components/layouts/DashboardLayout'
import React from 'react'

const Attendance = () => {
  return (
   <DashboardLayout activeMenu="Attendance">
      <div className="my-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg text-white md:text-xl font-medium">
              Attendance
            </h2>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Attendance