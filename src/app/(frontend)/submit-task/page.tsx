"use client"

import { useState } from 'react'
import { Home, Users, Upload, FileText, Clock, CheckCircle, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { cn } from '@/lib/utils' // Assuming cn utility is available

const navigationItems = [
  {
    title: "Dashboard",
    url: "/worker-dashboard",
    icon: Home,
  },
  {
    title: "Assigned Clients",
    url: "/worker-clients",
    icon: Users,
  },
  {
    title: "Submit Task",
    url: "/submit-task",
    icon: Upload,
    isActive: true,
  },
]

// Mock tasks assigned to the worker
const mockAssignedTasks = [
  { id: "TSK001", clientName: "John Smith", courseName: "Calculus I", taskType: "Quiz", status: "In Progress" },
  { id: "TSK004", clientName: "Sarah Davis", courseName: "Algebra", taskType: "Assignment", status: "Pending" },
  { id: "TSK007", clientName: "Mike Johnson", courseName: "Statistics", taskType: "Quiz", status: "Pending" },
  { id: "TSK009", clientName: "Emma Brown", courseName: "Physics II", taskType: "Course", status: "In Progress" },
]

const workerData = {
  name: "Sarah Wilson",
  avatar: "/placeholder.svg?height=40&width=40",
  role: "Senior Academic Assistant",
}

const formSchema = z.object({
  taskId: z.string().min(1, { message: "Please select a task." }),
  status: z.enum(["In Progress", "Completed"], { message: "Please select a status." }),
  notes: z.string().optional(),
  score: z.union([
    z.literal(""), // Allow empty string for optional score
    z.string().regex(/^\d+$/, { message: "Score must be a number." }).transform(Number).refine(val => val >= 0 && val <= 100, { message: "Score must be between 0 and 100." })
  ]).optional(),
  file: z.any().optional(), // FileList or File object
}).superRefine((data, ctx) => {
  if (data.status === "Completed" && (data.score === undefined || data.score === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Score is required for completed tasks.",
      path: ['score'],
    });
  }
});

type SubmissionFormValues = z.infer<typeof formSchema>;

function WorkerSidebar() {
  return (
    <Sidebar className="border-r-0">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Sarh Task Hub</span>
            <span className="text-xs text-muted-foreground">Worker Portal</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <a href={item.url} className="rounded-lg">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

export default function SubmitTaskPage() {
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskId: "",
      status: "In Progress",
      notes: "",
      score: "",
      file: undefined,
    },
  });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = form;
  const selectedStatus = watch("status");

  const onSubmit = async (data: SubmissionFormValues) => {
    console.log("Form data submitted:", data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmissionSuccess(true);
    reset(); // Reset form after successful submission
    setTimeout(() => setSubmissionSuccess(false), 5000); // Hide success message after 5 seconds
  };

  return (
    <SidebarProvider>
      <WorkerSidebar />
      <SidebarInset className="bg-gradient-to-br from-slate-50 to-blue-50/30">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white/80 backdrop-blur-sm px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-semibold text-gray-800">Submit Task</h1>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={workerData.avatar || "/placeholder.svg"} alt={workerData.name} />
              <AvatarFallback>{workerData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium text-gray-800">{workerData.name}</div>
              <div className="text-gray-500 text-xs">{workerData.role}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-lg rounded-2xl shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-gray-800">Task Submission Form</CardTitle>
              <CardDescription className="text-gray-600">
                Update task status and submit your work.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissionSuccess && (
                <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-center text-sm">
                  Task submitted successfully!
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Task Selector */}
                <div className="grid gap-2">
                  <Label htmlFor="taskId">Select Task</Label>
                  <Select
                    onValueChange={(value) => form.setValue("taskId", value)}
                    value={form.watch("taskId")}
                  >
                    <SelectTrigger className={cn("rounded-xl border-gray-200", errors.taskId && "border-red-500")}>
                      <SelectValue placeholder="Choose a task to update" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockAssignedTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.id} - {task.clientName} ({task.courseName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.taskId && <p className="text-red-500 text-xs mt-1">{errors.taskId.message}</p>}
                </div>

                {/* Status Selector */}
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    onValueChange={(value: "In Progress" | "Completed") => form.setValue("status", value)}
                    value={form.watch("status")}
                  >
                    <SelectTrigger className={cn("rounded-xl border-gray-200", errors.status && "border-red-500")}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
                </div>

                {/* Notes Textarea */}
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any relevant notes or updates..."
                    className={cn("rounded-xl border-gray-200", errors.notes && "border-red-500")}
                    {...register("notes")}
                  />
                  {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
                </div>

                {/* Optional Score Input (conditional) */}
                {selectedStatus === "Completed" && (
                  <div className="grid gap-2">
                    <Label htmlFor="score">Score (0-100)</Label>
                    <Input
                      id="score"
                      type="number"
                      placeholder="Enter score"
                      className={cn("rounded-xl border-gray-200", errors.score && "border-red-500")}
                      {...register("score")}
                    />
                    {errors.score && <p className="text-red-500 text-xs mt-1">{errors.score.message}</p>}
                  </div>
                )}

                {/* File Upload */}
                <div className="grid gap-2">
                  <Label htmlFor="file">File Upload (Optional)</Label>
                  <Input
                    id="file"
                    type="file"
                    className={cn("rounded-xl border-gray-200 file:text-blue-600 file:font-medium", errors.file && "border-red-500")}
                    {...register("file")}
                  />
                  {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file.message}</p>}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Task'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
