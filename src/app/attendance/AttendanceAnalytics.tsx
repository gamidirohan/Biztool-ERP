"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OverviewMetrics } from "@/components/ui/overview-metrics";
import { Users, Clock, CheckCircle, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
  weeklyTrend: number;
}

interface EmployeeAttendance {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'late';
  checkInTime?: string;
  checkOutTime?: string;
}

export default function AttendanceAnalytics() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [employees, setEmployees] = useState<EmployeeAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Get current user profile for tenant context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) return;

      // Get all employees in the tenant
      const { data: employeesData } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("tenant_id", profile.tenant_id);

      if (!employeesData) return;

      const totalEmployees = employeesData.length;

      // Get today's attendance records
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data: todayRecords } = await supabase
        .from("attendance_records")
        .select("employee_id, action, created_at")
        .eq("tenant_id", profile.tenant_id)
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString())
        .order("created_at", { ascending: true });

      // Process attendance data
      const employeeMap = new Map<string, EmployeeAttendance>();
      const checkIns = new Map<string, string>();
      const checkOuts = new Map<string, string>();

      // Initialize all employees as absent
      employeesData.forEach(emp => {
        employeeMap.set(emp.id, {
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          status: 'absent'
        });
      });

      // Process today's records
      todayRecords?.forEach(record => {
        if (record.action === 'check_in') {
          checkIns.set(record.employee_id, record.created_at);
        } else if (record.action === 'check_out') {
          checkOuts.set(record.employee_id, record.created_at);
        }
      });

      // Determine status for each employee
      let presentCount = 0;
      let lateCount = 0;

      employeesData.forEach(emp => {
        const checkInTime = checkIns.get(emp.id);
        if (checkInTime) {
          // Check if late (after 9:00 AM)
          const checkInDate = new Date(checkInTime);
          const scheduledStart = new Date(checkInDate);
          scheduledStart.setHours(9, 0, 0, 0);

          const isLate = checkInDate > scheduledStart;
          const status = isLate ? 'late' : 'present';

          if (status === 'present') presentCount++;
          if (status === 'late') lateCount++;

          employeeMap.set(emp.id, {
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            status,
            checkInTime: new Date(checkInTime).toLocaleTimeString(),
            checkOutTime: checkOuts.get(emp.id) ? new Date(checkOuts.get(emp.id)!).toLocaleTimeString() : undefined
          });
        }
      });

      const absentCount = totalEmployees - presentCount - lateCount;
      const attendanceRate = totalEmployees > 0 ? Math.round(((presentCount + lateCount) / totalEmployees) * 100) : 0;

      // Calculate weekly trend (simplified - compare with yesterday)
      const yesterday = new Date(startOfDay);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const { data: yesterdayRecords } = await supabase
        .from("attendance_records")
        .select("employee_id, action")
        .eq("tenant_id", profile.tenant_id)
        .gte("created_at", yesterday.toISOString())
        .lte("created_at", yesterdayEnd.toISOString());

      const yesterdayPresent = new Set(yesterdayRecords?.filter(r => r.action === 'check_in').map(r => r.employee_id)).size;
      const yesterdayRate = totalEmployees > 0 ? (yesterdayPresent / totalEmployees) * 100 : 0;
      const weeklyTrend = attendanceRate - yesterdayRate;

      setStats({
        totalEmployees,
        presentToday: presentCount,
        absentToday: absentCount,
        lateToday: lateCount,
        attendanceRate,
        weeklyTrend
      });

      setEmployees(Array.from(employeeMap.values()));

    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: 'var(--primary)' }} />
          <p className="text-sm text-[color:var(--muted-foreground)]">Loading attendance analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4" style={{ color: 'var(--danger)' }} />
          <p className="text-sm text-[color:var(--muted-foreground)]">{error}</p>
        </div>
      </div>
    );
  }

  const metrics = stats ? [
    {
      label: "Present Today",
      value: stats.presentToday.toString(),
      change: stats.weeklyTrend > 0 ? `+${stats.weeklyTrend.toFixed(1)}%` : `${stats.weeklyTrend.toFixed(1)}%`,
      changeType: stats.weeklyTrend >= 0 ? "positive" : "negative" as "positive" | "negative"
    },
    {
      label: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      change: stats.weeklyTrend > 0 ? `+${stats.weeklyTrend.toFixed(1)}%` : `${stats.weeklyTrend.toFixed(1)}%`,
      changeType: stats.weeklyTrend >= 0 ? "positive" : "negative" as "positive" | "negative"
    }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6" style={{ color: 'var(--primary)' }} />
        <h1 className="text-2xl font-bold text-[color:var(--foreground)]">Attendance Analytics</h1>
      </div>

      {stats && <OverviewMetrics metrics={metrics} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[color:var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-[color:var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4" style={{ color: 'var(--success)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.presentToday || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-[color:var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Today</CardTitle>
            <Clock className="h-4 w-4" style={{ color: 'var(--warning)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.lateToday || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-[color:var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <AlertTriangle className="h-4 w-4" style={{ color: 'var(--danger)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.absentToday || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[color:var(--border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Today's Attendance Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search employees by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-md border border-[color:var(--card-border)] bg-[color:var(--background)]/60 dark:bg-[color:var(--background)]/80 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)]/35 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40 focus:border-[color:var(--primary)]"
            />
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--muted-foreground)]" />
          </div>

          {/* Employee List - Always Visible */}
          <div className="space-y-2 max-h-96 overflow-y-auto border border-[color:var(--card-border)] rounded-lg p-3 bg-[color:var(--background)]/30">
            {employees
              .filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-3 border border-[color:var(--border)] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    employee.status === 'present' ? 'bg-green-500' :
                    employee.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium">{employee.name}</span>
                </div>
                <div className="text-sm text-[color:var(--muted-foreground)]">
                  {employee.status === 'present' && employee.checkInTime && (
                    <span>On time • Check-in: {employee.checkInTime}</span>
                  )}
                  {employee.status === 'late' && employee.checkInTime && (
                    <span className="text-yellow-600 dark:text-yellow-400">Late • Check-in: {employee.checkInTime}</span>
                  )}
                  {employee.status === 'absent' && (
                    <span className="text-red-600 dark:text-red-400">Absent</span>
                  )}
                </div>
              </div>
            ))}
            {employees.filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <div className="text-center py-8 text-[color:var(--muted-foreground)]">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No employees found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}