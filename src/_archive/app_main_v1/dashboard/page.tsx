"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, ChevronDown, MoreVertical, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

/**
 * Dashboard Demo-Seite.
 * Zeigt KPIs, Charts und eine Document-Liste mit Sidebar-Navigation.
 */

// Chart-Konfiguration
// Verwende var() direkt, da --chart-1 und --chart-2 bereits vollständige oklch-Werte enthalten
const chartConfig = {
  visitors: {
    label: "Visitors",
    theme: {
      light: "var(--chart-1)",
      dark: "var(--chart-1)",
    },
  },
  returning: {
    label: "Returning",
    theme: {
      light: "var(--chart-2)",
      dark: "var(--chart-2)",
    },
  },
} satisfies Record<string, { label: string; theme: { light: string; dark: string } }>

// Fake-Daten generieren
function generateChartData(timeframe: string) {
  const now = new Date()
  let days: number
  let startDate: Date

  switch (timeframe) {
    case "last-7-days":
      days = 7
      startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
      break
    case "last-30-days":
      days = 30
      startDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
      break
    case "last-3-months":
    default:
      days = 90
      startDate = new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000)
      break
  }

  const data = []
  let baseVisitors = 1200
  let baseReturning = 800

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    // Zufällige Variationen für realistische Daten
    const variation = (Math.random() - 0.5) * 0.3 // ±15% Variation
    const trend = Math.sin((i / days) * Math.PI * 2) * 0.2 // Sinus-Trend
    const weeklyPattern = Math.sin((i / 7) * Math.PI * 2) * 0.1 // Wochentag-Muster

    const visitors = Math.round(baseVisitors * (1 + variation + trend + weeklyPattern))
    const returning = Math.round(
      baseReturning * (1 + variation * 0.8 + trend * 0.9 + weeklyPattern * 0.7)
    )

    // Langsamer Trend nach oben
    baseVisitors += 2
    baseReturning += 1.5

    data.push({
      date: date.toLocaleDateString("de-DE", {
        month: "short",
        day: "numeric",
      }),
      visitors,
      returning,
    })
  }

  return data
}

export default function DashboardPage(): React.ReactElement {
  const [selectedTimeframe, setSelectedTimeframe] = useState("last-30-days")
  const chartData = generateChartData(selectedTimeframe)

  const kpis = [
    {
      title: "Total Revenue",
      value: "$1,250.00",
      change: "+12.5%",
      trend: "up",
      subtitle: "Trending up this month",
      description: "Visitors for the last 6 months",
    },
    {
      title: "New Customers",
      value: "1,234",
      change: "-20%",
      trend: "down",
      subtitle: "Down 20% this period",
      description: "Acquisition needs attention",
    },
    {
      title: "Active Accounts",
      value: "45,678",
      change: "+12.5%",
      trend: "up",
      subtitle: "Strong user retention",
      description: "Engagement exceed targets",
    },
    {
      title: "Growth Rate",
      value: "4.5%",
      change: "+4.5%",
      trend: "up",
      subtitle: "Steady performance",
      description: "Meets growth projections",
    },
  ]

  const documents = [
    {
      header: "Cover page",
      sectionType: "Cover page",
      target: "18",
      limit: "5",
      reviewer: "Eddie Lake",
    },
    {
      header: "Table of contents",
      sectionType: "Table of contents",
      target: "29",
      limit: "24",
      reviewer: "Eddie Lake",
    },
    {
      header: "Executive summary",
      sectionType: "Narrative",
      target: "10",
      limit: "13",
      reviewer: "Eddie Lake",
    },
    {
      header: "Technical approach",
      sectionType: "Narrative",
      target: "27",
      limit: "23",
      reviewer: "Jamik Tashpulatoy",
    },
    {
      header: "Project timeline",
      sectionType: "Timeline",
      target: "15",
      limit: "12",
      reviewer: "Eddie Lake",
    },
    {
      header: "Budget overview",
      sectionType: "Financial",
      target: "22",
      limit: "18",
      reviewer: "Jamik Tashpulatoy",
    },
  ]

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-foreground text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, shadcn</p>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="mt-2 flex items-center gap-2">
                  {kpi.trend === "up" ? (
                    <ArrowUp className="text-chart-1 h-4 w-4" />
                  ) : (
                    <ArrowDown className="text-destructive h-4 w-4" />
                  )}
                  <span
                    className={`text-sm ${
                      kpi.trend === "up" ? "text-chart-1" : "text-destructive"
                    }`}
                  >
                    {kpi.change}
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">{kpi.subtitle}</p>
                <p className="text-muted-foreground text-xs">{kpi.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Total Visitors</CardTitle>
                <CardDescription>
                  {selectedTimeframe === "last-7-days"
                    ? "Total for the last 7 days"
                    : selectedTimeframe === "last-30-days"
                      ? "Total for the last 30 days"
                      : "Total for the last 3 months"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedTimeframe === "last-3-months" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("last-3-months")}
                >
                  Last 3 months
                </Button>
                <Button
                  variant={selectedTimeframe === "last-30-days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("last-30-days")}
                >
                  Last 30 days
                </Button>
                <Button
                  variant={selectedTimeframe === "last-7-days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("last-7-days")}
                >
                  Last 7 days
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart
                data={chartData}
                margin={{
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  width={60}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                {/* Returning zuerst (kleinere Werte), dann Visitors darüber */}
                <Area
                  dataKey="returning"
                  type="natural"
                  fill="var(--color-returning)"
                  fillOpacity={0.25}
                  stroke="var(--color-returning)"
                  strokeWidth={1.5}
                />
                <Area
                  dataKey="visitors"
                  type="natural"
                  fill="var(--color-visitors)"
                  fillOpacity={0.2}
                  stroke="var(--color-visitors)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Document List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Document Sections</CardTitle>
                <CardDescription>Manage your document structure</CardDescription>
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Customize Columns
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Column Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Show all columns</DropdownMenuItem>
                    <DropdownMenuItem>Hide Section Type</DropdownMenuItem>
                    <DropdownMenuItem>Hide Reviewer</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="outline" className="w-full">
              <TabsList>
                <TabsTrigger value="outline">Outline</TabsTrigger>
                <TabsTrigger value="past-performance">
                  Past Performance{" "}
                  <Badge variant="secondary" className="ml-2">
                    3
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="key-personnel">
                  Key Personnel{" "}
                  <Badge variant="secondary" className="ml-2">
                    2
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="outline" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>Header</TableHead>
                      <TableHead>Section Type</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Limit</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-medium">{doc.header}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{doc.sectionType}</Badge>
                        </TableCell>
                        <TableCell>{doc.target}</TableCell>
                        <TableCell>{doc.limit}</TableCell>
                        <TableCell>{doc.reviewer}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Duplicate</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
                  <span>0 of {documents.length} row(s) selected.</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      Previous
                    </Button>
                    <Button variant="ghost" size="sm">
                      Next
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="past-performance" className="mt-4">
                <p className="text-muted-foreground text-sm">
                  Past performance data would be displayed here.
                </p>
              </TabsContent>
              <TabsContent value="key-personnel" className="mt-4">
                <p className="text-muted-foreground text-sm">
                  Key personnel information would be displayed here.
                </p>
              </TabsContent>
              <TabsContent value="focus-documents" className="mt-4">
                <p className="text-muted-foreground text-sm">
                  Focus documents would be displayed here.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
