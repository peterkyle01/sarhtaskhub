"use client"

import { useState } from 'react'
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Mock client data
const mockClients = [
  {
    id: "CL001",
    name: "John Smith",
    platform: "Cengage",
    courseName: "Calculus I",
    deadline: "2024-02-15",
    progress: "In Progress",
    assignedWorker: "Sarah Wilson",
  },
  {
    id: "CL002",
    name: "Emily Johnson",
    platform: "ALEKS",
    courseName: "Statistics",
    deadline: "2024-02-10",
    progress: "Completed",
    assignedWorker: "Mike Chen",
  },
  {
    id: "CL003",
    name: "Michael Brown",
    platform: "Cengage",
    courseName: "Physics II",
    deadline: "2024-02-08",
    progress: "Overdue",
    assignedWorker: "Lisa Rodriguez",
  },
  {
    id: "CL004",
    name: "Sarah Davis",
    platform: "ALEKS",
    courseName: "Algebra",
    deadline: "2024-02-20",
    progress: "Not Started",
    assignedWorker: "John Doe",
  },
  {
    id: "CL005",
    name: "David Wilson",
    platform: "Cengage",
    courseName: "Chemistry",
    deadline: "2024-02-12",
    progress: "In Progress",
    assignedWorker: "Sarah Wilson",
  },
  {
    id: "CL006",
    name: "Jessica Miller",
    platform: "ALEKS",
    courseName: "Geometry",
    deadline: "2024-02-18",
    progress: "In Progress",
    assignedWorker: "Mike Chen",
  },
]

const workers = [
  "Sarah Wilson",
  "Mike Chen", 
  "Lisa Rodriguez",
  "John Doe",
  "Alex Thompson"
]

function getProgressBadge(status: string) {
  switch (status) {
    case "Completed":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
    case "In Progress":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>
    case "Not Started":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Not Started</Badge>
    case "Overdue":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getPlatformBadge(platform: string) {
  return platform === "Cengage" 
    ? <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Cengage</Badge>
    : <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">ALEKS</Badge>
}

function getDeadlineStatus(deadline: string) {
  const today = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return "overdue"
  if (diffDays <= 3) return "urgent"
  if (diffDays <= 7) return "upcoming"
  return "normal"
}

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [deadlineFilter, setDeadlineFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newClient, setNewClient] = useState({
    name: "",
    platform: "",
    courseName: "",
    deadline: "",
    assignedWorker: "",
    notes: ""
  })

  const itemsPerPage = 5

  // Filter clients based on search term and filters
  const filteredClients = mockClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPlatform = platformFilter === "all" || client.platform === platformFilter
    
    const deadlineStatus = getDeadlineStatus(client.deadline)
    const matchesDeadline = deadlineFilter === "all" || 
                           (deadlineFilter === "urgent" && (deadlineStatus === "urgent" || deadlineStatus === "overdue")) ||
                           (deadlineFilter === "upcoming" && deadlineStatus === "upcoming") ||
                           (deadlineFilter === "normal" && deadlineStatus === "normal")
    
    return matchesSearch && matchesPlatform && matchesDeadline
  })

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage)

  const handleAddClient = () => {
    // Here you would typically make an API call to add the client
    console.log("Adding client:", newClient)
    setIsAddModalOpen(false)
    setNewClient({
      name: "",
      platform: "",
      courseName: "",
      deadline: "",
      assignedWorker: "",
      notes: ""
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clients</CardTitle>
              <CardDescription>
                Manage and track all your clients and their progress
              </CardDescription>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Enter the client details below to add them to the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Client Name</Label>
                    <Input
                      id="name"
                      value={newClient.name}
                      onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={newClient.platform} onValueChange={(value) => setNewClient({...newClient, platform: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cengage">Cengage</SelectItem>
                        <SelectItem value="ALEKS">ALEKS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="course">Course Name</Label>
                    <Input
                      id="course"
                      value={newClient.courseName}
                      onChange={(e) => setNewClient({...newClient, courseName: e.target.value})}
                      placeholder="Enter course name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={newClient.deadline}
                      onChange={(e) => setNewClient({...newClient, deadline: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="worker">Assigned Worker</Label>
                    <Select value={newClient.assignedWorker} onValueChange={(value) => setNewClient({...newClient, assignedWorker: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select worker" />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.map((worker) => (
                          <SelectItem key={worker} value={worker}>{worker}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={newClient.notes}
                      onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddClient}>Add Client</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="Cengage">Cengage</SelectItem>
                <SelectItem value="ALEKS">ALEKS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Deadline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deadlines</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Progress Status</TableHead>
                  <TableHead>Assigned Worker</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.id}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{getPlatformBadge(client.platform)}</TableCell>
                    <TableCell>{client.courseName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{new Date(client.deadline).toLocaleDateString()}</span>
                        <span className={`text-xs ${
                          getDeadlineStatus(client.deadline) === 'overdue' ? 'text-red-600' :
                          getDeadlineStatus(client.deadline) === 'urgent' ? 'text-orange-600' :
                          getDeadlineStatus(client.deadline) === 'upcoming' ? 'text-yellow-600' :
                          'text-muted-foreground'
                        }`}>
                          {getDeadlineStatus(client.deadline) === 'overdue' ? 'Overdue' :
                           getDeadlineStatus(client.deadline) === 'urgent' ? 'Due soon' :
                           getDeadlineStatus(client.deadline) === 'upcoming' ? 'This week' :
                           'On track'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getProgressBadge(client.progress)}</TableCell>
                    <TableCell>{client.assignedWorker}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredClients.length)} of {filteredClients.length} clients
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
