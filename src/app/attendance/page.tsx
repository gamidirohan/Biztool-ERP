import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft } from "lucide-react";

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Module</span>
              </div>
            </div>
          </div>

          {/* Coming Soon Content */}
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <Clock className="h-24 w-24 text-purple-500 mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Attendance Module
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Employee time tracking, leave management, and attendance analytics.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  🚧 Coming Soon
                </h2>
                <p className="text-yellow-700 dark:text-yellow-300">
                  This module is currently under development. Check back soon for updates!
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <Link href="/">
                  <Button>Return to Home</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline">Login</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
