"use client"

import { useState } from "react"
import {
  Bell,
  Check,
  CreditCard,
  DollarSign,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  TrendingUp,
  User,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Umfangreiche Components Showcase Seite.
 * Zeigt alle wichtigen ShadCN-Komponenten mit den CSS-First Theme-Tokens.
 */
export default function ComponentsPage(): React.ReactElement {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [progress, setProgress] = useState(66)

  return (
    <TooltipProvider>
      <>
        <div className="mb-6">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Components Showcase</h1>
          <p className="text-muted-foreground text-sm">
            Alle wichtigen ShadCN-Komponenten mit CSS-First Theme-Tokens
          </p>
        </div>

        <div className="space-y-8">
          {/* Dashboard Cards */}
          <section>
            <h2 className="text-foreground mb-4 text-2xl font-bold">Dashboard Cards</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-muted-foreground text-xs">
                    <span className="text-chart-1">+20.1%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                  <Users className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+2,350</div>
                  <p className="text-muted-foreground text-xs">
                    <span className="text-chart-2">+180.1%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sales</CardTitle>
                  <CreditCard className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12,234</div>
                  <p className="text-muted-foreground text-xs">
                    <span className="text-chart-3">+19%</span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                  <TrendingUp className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+573</div>
                  <p className="text-muted-foreground text-xs">
                    <span className="text-chart-4">+201</span> since last hour
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Tabs Example */}
          <section>
            <h2 className="text-foreground mb-4 text-2xl font-bold">Tabs</h2>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="border-border mt-4 rounded-lg border p-6">
                <h3 className="text-lg font-semibold">Overview Content</h3>
                <p className="text-muted-foreground mt-2">
                  This is the overview tab content. All styles come from CSS tokens.
                </p>
              </TabsContent>
              <TabsContent value="analytics" className="border-border mt-4 rounded-lg border p-6">
                <h3 className="text-lg font-semibold">Analytics Content</h3>
                <p className="text-muted-foreground mt-2">
                  Analytics data would be displayed here.
                </p>
              </TabsContent>
              <TabsContent value="reports" className="border-border mt-4 rounded-lg border p-6">
                <h3 className="text-lg font-semibold">Reports Content</h3>
                <p className="text-muted-foreground mt-2">Reports and documents section.</p>
              </TabsContent>
              <TabsContent
                value="notifications"
                className="border-border mt-4 rounded-lg border p-6"
              >
                <h3 className="text-lg font-semibold">Notifications Content</h3>
                <p className="text-muted-foreground mt-2">Notification settings and history.</p>
              </TabsContent>
            </Tabs>
          </section>

          {/* Table */}
          <section>
            <h2 className="text-foreground mb-4 text-2xl font-bold">Data Table</h2>
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Manage your recent transactions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { status: "Success", email: "ken99@example.com", amount: "$316.00" },
                      { status: "Success", email: "abe45@example.com", amount: "$242.00" },
                      {
                        status: "Processing",
                        email: "monserrat44@example.com",
                        amount: "$837.00",
                      },
                      { status: "Failed", email: "carmella@example.com", amount: "$721.00" },
                    ].map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.status === "Success"
                                ? "default"
                                : row.status === "Processing"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell className="text-right font-medium">{row.amount}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>View details</DropdownMenuItem>
                              <DropdownMenuItem>Download receipt</DropdownMenuItem>
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
              </CardContent>
            </Card>
          </section>

          {/* Forms */}
          <section>
            <h2 className="text-foreground mb-4 text-2xl font-bold">Form Elements</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Login Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>Enter your email below to create your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline">
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                        />
                      </svg>
                      GitHub
                    </Button>
                    <Button variant="outline">
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card text-muted-foreground px-2">Or continue with</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Create account</Button>
                </CardFooter>
              </Card>

              {/* Settings Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Cookie Settings</CardTitle>
                  <CardDescription>Manage your cookie preferences here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Strictly Necessary</Label>
                      <p className="text-muted-foreground text-sm">
                        Essential for the website to function.
                      </p>
                    </div>
                    <Switch defaultChecked disabled />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Functional Cookies</Label>
                      <p className="text-muted-foreground text-sm">Enable personalized features.</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Performance Cookies</Label>
                      <p className="text-muted-foreground text-sm">Help us improve our website.</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Save preferences</Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          {/* More Form Elements */}
          <section>
            <h2 className="text-foreground mb-4 text-2xl font-bold">Input Variants</h2>
            <Card>
              <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Select</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter Plan</SelectItem>
                      <SelectItem value="pro">Pro Plan</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input className="pl-10" placeholder="Search..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Textarea</Label>
                  <Textarea placeholder="Enter your message..." />
                </div>

                <div className="space-y-4">
                  <Label>Radio Group</Label>
                  <RadioGroup defaultValue="option-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option-1" id="option-1" />
                      <Label htmlFor="option-1">Option One</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option-2" id="option-2" />
                      <Label htmlFor="option-2">Option Two</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option-3" id="option-3" />
                      <Label htmlFor="option-3">Option Three</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label>Slider: {progress}%</Label>
                  <Slider
                    value={[progress]}
                    onValueChange={(v) => setProgress(v[0])}
                    max={100}
                    step={1}
                  />
                  <Progress value={progress} />
                </div>

                <div className="space-y-4">
                  <Label>Checkboxes</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" />
                      <Label htmlFor="terms">Accept terms and conditions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="marketing" defaultChecked />
                      <Label htmlFor="marketing">Receive marketing emails</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Buttons */}
          <section>
            <h2 className="text-foreground mb-4 text-2xl font-bold">Buttons & Badges</h2>
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label className="mb-3 block">Button Variants</Label>
                  <div className="flex flex-wrap gap-3">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block">Button Sizes</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block">Badges</Label>
                  <div className="flex flex-wrap gap-3">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Calendar & Dialogs */}
          <section>
            <h2 className="text-foreground mb-4 text-2xl font-bold">Calendar & Dialog</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dialog & Tooltip</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">Open Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove your data from our servers.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive">Delete</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <div className="flex justify-center gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Bell className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notifications</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Settings</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <User className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Profile</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Alerts & Accordion */}
          <section>
            <h2 className="text-foreground mb-4 text-2xl font-bold">Alerts & Accordion</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>Your changes have been saved successfully.</AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>Something went wrong. Please try again later.</AlertDescription>
                </Alert>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is it accessible?</AccordionTrigger>
                  <AccordionContent>
                    Yes. It adheres to the WAI-ARIA design pattern.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Is it styled?</AccordionTrigger>
                  <AccordionContent>
                    Yes. It comes with default styles that match your theme.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Is it animated?</AccordionTrigger>
                  <AccordionContent>
                    Yes. It&apos;s animated by default with smooth transitions.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

          {/* Team Members */}
          <section>
            <h2 className="text-foreground mb-4 text-2xl font-bold">Team Members</h2>
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Invite your team members to collaborate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    name: "Sofia Davis",
                    email: "m@example.com",
                    role: "Owner",
                    initials: "SD",
                  },
                  {
                    name: "Jackson Lee",
                    email: "p@example.com",
                    role: "Developer",
                    initials: "JL",
                  },
                  {
                    name: "Isabella Nguyen",
                    email: "i@example.com",
                    role: "Billing",
                    initials: "IN",
                  },
                ].map((member, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-muted-foreground text-sm">{member.email}</p>
                      </div>
                    </div>
                    <Select defaultValue={member.role.toLowerCase()}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Footer */}
          <footer className="border-border border-t pt-8 text-center">
            <p className="text-muted-foreground text-sm">
              All components use CSS-First Theme Architecture with Tailwind CSS v4
            </p>
          </footer>
        </div>
      </>
    </TooltipProvider>
  )
}
