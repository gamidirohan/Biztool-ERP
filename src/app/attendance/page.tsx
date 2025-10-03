"use client";

import FaceAttendance from "./FaceAttendance";

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-4">Attendance</h1>
        <p className="text-sm text-[color:var(--foreground)]/70 mb-6">Use your face to securely check in and out.</p>
        <FaceAttendance />
      </div>
    </div>
  );
}
