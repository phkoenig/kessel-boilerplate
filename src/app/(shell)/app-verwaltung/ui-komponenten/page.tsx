"use client"

import * as React from "react"
import { PageContent, PageHeader } from "@/components/shell"
import { useCurrentNavItem } from "@/lib/navigation/use-current-nav-item"
import { useAuth } from "@/components/auth"
import {
  Loader2,
  Mail,
  BellRing,
  Check,
  Info,
  AlertTriangle,
  AlertCircle,
  Terminal,
} from "lucide-react"

// UI Components Imports
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Kbd } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { InlineEditInput } from "@/components/ui/inline-edit-input"

// Helper für Sektionen
function ComponentSection({
  title,
  id,
  children,
}: {
  title: string
  id?: string
  children: React.ReactNode
}) {
  return (
    <div id={id} className="scroll-mt-24 space-y-8">
      <div className="border-b pb-2">
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="space-y-12">{children}</div>
    </div>
  )
}

function DemoContainer({
  title,
  id,
  children,
  className,
}: {
  title: string
  id?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div id={id} className="scroll-mt-24 space-y-4">
      <h4 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
        {title}
      </h4>
      <div className={className}>{children}</div>
    </div>
  )
}

export default function ComponentsPage(): React.ReactElement {
  const { role, isLoading: authLoading } = useAuth()
  const currentNavItem = useCurrentNavItem()
  const pageTitle = currentNavItem?.label ?? "UI-Komponenten"

  // State für InlineEditInput Demo
  const [demoValue, setDemoValue] = React.useState("Beispieltext")

  // Scroll nach oben beim Erstaufruf
  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (authLoading) {
    return (
      <PageContent title={pageTitle} description="Lade...">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      </PageContent>
    )
  }

  if (role !== "admin" && role !== "super-user") {
    return (
      <PageContent title={pageTitle} description="Diese Seite ist nur für Administratoren.">
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Du hast keine Berechtigung für diese Seite.</p>
        </div>
      </PageContent>
    )
  }

  return (
    <PageContent>
      <PageHeader
        title={pageTitle}
        description="Kitchen Sink: Übersicht und Live-Demo der wichtigsten UI-Komponenten."
      />

      <div className="space-y-24 pb-24">
        {/* BUTTONS & ACTIONS */}
        <ComponentSection title="Buttons & Actions" id="buttons">
          <DemoContainer title="Varianten" id="button-variants">
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </DemoContainer>

          <DemoContainer title="Größen & Icons" id="button-sizes">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="lg">Large</Button>
              <Button size="default">Default</Button>
              <Button size="sm">Small</Button>
              <Button size="icon" variant="outline">
                <Mail className="size-4" />
              </Button>
              <Button>
                <Mail className="mr-2 size-4" /> Mit Icon
              </Button>
              <Button disabled>Disabled</Button>
              <Button variant="outline" className="gap-2">
                Loading <Loader2 className="size-4 animate-spin" />
              </Button>
            </div>
          </DemoContainer>

          <DemoContainer title="Toggles" id="toggles">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Toggle aria-label="Toggle italic">
                  <span className="font-bold">B</span>
                </Toggle>
                <Toggle variant="outline" aria-label="Toggle italic">
                  <span className="italic">I</span>
                </Toggle>
              </div>
              <ToggleGroup type="single" variant="outline">
                <ToggleGroupItem value="left">Left</ToggleGroupItem>
                <ToggleGroupItem value="center">Center</ToggleGroupItem>
                <ToggleGroupItem value="right">Right</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </DemoContainer>

          <DemoContainer title="Badges" id="badges">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge className="gap-1">
                New <span className="flex size-1.5 rounded-full bg-white" />
              </Badge>
            </div>
          </DemoContainer>
        </ComponentSection>

        {/* FORMULARE */}
        <ComponentSection title="Formulare & Inputs" id="inputs">
          <DemoContainer title="Text Inputs" id="text-inputs">
            <div className="grid w-full items-center gap-4" style={{ maxWidth: "24rem" }}>
              <div className="grid w-full items-center gap-1.5" style={{ maxWidth: "24rem" }}>
                <Label htmlFor="email">Email</Label>
                <Input type="email" id="email" placeholder="Email eingeben..." />
              </div>
              <div className="grid w-full items-center gap-1.5" style={{ maxWidth: "24rem" }}>
                <Label htmlFor="disabled">Disabled</Label>
                <Input disabled id="disabled" placeholder="Nicht verfügbar" />
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="message">Nachricht</Label>
                <Textarea placeholder="Schreib uns etwas..." id="message" />
              </div>
            </div>
          </DemoContainer>

          <DemoContainer title="Inline Edit Input" id="inline-edit">
            <div className="space-y-4" style={{ maxWidth: "24rem" }}>
              <p className="text-muted-foreground text-sm">
                Klicken zum Bearbeiten. Mit ✓ speichern oder ✗ abbrechen.
              </p>
              <InlineEditInput
                label="Editierbarer Wert"
                value={demoValue}
                onSave={(value) => {
                  setDemoValue(value)
                  toast.success(`Gespeichert: "${value}"`)
                }}
                placeholder="Klicken zum Bearbeiten..."
              />
              <InlineEditInput
                label="Deaktiviert"
                value="Nicht bearbeitbar"
                onSave={() => {}}
                disabled
              />
            </div>
          </DemoContainer>

          <DemoContainer title="Auswahl & Schalter" id="selection">
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch id="airplane-mode" />
                <Label htmlFor="airplane-mode">Flugmodus</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms">AGB akzeptieren</Label>
              </div>

              <RadioGroup defaultValue="comfortable">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" id="r1" />
                  <Label htmlFor="r1">Standard</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comfortable" id="r2" />
                  <Label htmlFor="r2">Komfortabel</Label>
                </div>
              </RadioGroup>

              <Select>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Thema wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DemoContainer>

          <DemoContainer title="Slider (Bereiche)" id="slider">
            <div className="space-y-8 py-4">
              <div className="space-y-2">
                <Label>Standard Slider (50%)</Label>
                <Slider defaultValue={[50]} max={100} step={1} />
              </div>
              <div className="space-y-2">
                <Label>Range Slider ([25, 75])</Label>
                <Slider defaultValue={[25, 75]} max={100} step={1} />
              </div>
            </div>
          </DemoContainer>

          <DemoContainer title="Date & Calendar" id="calendar">
            <div className="flex flex-col gap-4">
              <div className="w-fit rounded-md border">
                <Calendar mode="single" selected={new Date()} className="rounded-md border" />
              </div>
            </div>
          </DemoContainer>
        </ComponentSection>

        {/* FEEDBACK & DISPLAY */}
        <ComponentSection title="Feedback & Display" id="alerts">
          <DemoContainer title="Alerts" id="alerts-demo">
            <div className="space-y-4">
              <Alert>
                <Terminal className="size-4" />
                <AlertTitle>Hinweis</AlertTitle>
                <AlertDescription>Dies ist ein Standard-Alert für Informationen.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Fehler</AlertTitle>
                <AlertDescription>
                  Kritischer Fehler ist aufgetreten. Bitte prüfen.
                </AlertDescription>
              </Alert>
            </div>
          </DemoContainer>

          <DemoContainer title="Progress & Loading" id="progress">
            <div className="space-y-8">
              <div className="space-y-2">
                <Label>Fortschritt (60%)</Label>
                <Progress value={60} />
              </div>
              <div className="flex items-center gap-4">
                <Spinner className="size-4" />
                <Spinner />
                <Spinner className="size-6" />
                <span className="text-muted-foreground text-sm">Loading Spinners</span>
              </div>
              <div className="space-y-2">
                <Label>Skeleton Loading</Label>
                <div className="flex items-center space-x-4">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </div>
            </div>
          </DemoContainer>

          <DemoContainer title="Avatare" id="avatars">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src="https://avatar.vercel.sh/nextjs" alt="@nextjs" />
                <AvatarFallback>NX</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>PK</AvatarFallback>
              </Avatar>
            </div>
          </DemoContainer>

          <DemoContainer title="Keyboard Shortcuts" id="kbd">
            <div className="flex flex-wrap gap-2">
              <Kbd>⌘ K</Kbd>
              <Kbd>Ctrl + C</Kbd>
              <Kbd className="border">Shift + Alt</Kbd>
            </div>
          </DemoContainer>

          <DemoContainer title="Toasts (Sonner)" id="toasts">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  toast("Event has been created", {
                    description: "Sunday, December 03, 2023 at 9:00 AM",
                    action: {
                      label: "Undo",
                      onClick: () => console.log("Undo"),
                    },
                  })
                }
              >
                Show Toast
              </Button>
              <Button variant="outline" onClick={() => toast.success("Erfolgreich gespeichert!")}>
                Success Toast
              </Button>
              <Button variant="outline" onClick={() => toast.error("Fehler aufgetreten!")}>
                Error Toast
              </Button>
            </div>
          </DemoContainer>
        </ComponentSection>

        {/* OVERLAYS */}
        <ComponentSection title="Overlays" id="dialogs">
          <DemoContainer title="Dialogs" id="dialogs-demo">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you&apos;re done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input id="username" defaultValue="@peduarte" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DemoContainer>

          <DemoContainer title="Alert Dialog" id="alert-dialog">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and
                    remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DemoContainer>

          <DemoContainer title="Sheets" id="sheets">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Edit profile</SheetTitle>
                  <SheetDescription>
                    Make changes to your profile here. Click save when you&apos;re done.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input id="name" value="Pedro Duarte" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input id="username" value="@peduarte" className="col-span-3" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button type="submit">Save changes</Button>
                </div>
              </SheetContent>
            </Sheet>
          </DemoContainer>

          <DemoContainer title="Popovers & Tooltips" id="popovers">
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Open Popover</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="leading-none font-medium">Dimensions</h4>
                      <p className="text-muted-foreground text-sm">
                        Set the dimensions for the layer.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="width">Width</Label>
                        <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="maxWidth">Max. width</Label>
                        <Input id="maxWidth" defaultValue="300px" className="col-span-2 h-8" />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add to library</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </DemoContainer>

          <DemoContainer title="Dropdowns & Context" id="dropdowns">
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Open Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuItem>Team</DropdownMenuItem>
                  <DropdownMenuItem>Subscription</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ContextMenu>
                <ContextMenuTrigger className="flex h-40 w-80 items-center justify-center rounded-md border border-dashed text-sm">
                  Right click here
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                  <ContextMenuItem inset>
                    Back
                    <Kbd className="ml-auto">⌘[</Kbd>
                  </ContextMenuItem>
                  <ContextMenuItem inset disabled>
                    Forward
                    <Kbd className="ml-auto">⌘]</Kbd>
                  </ContextMenuItem>
                  <ContextMenuItem inset>
                    Reload
                    <Kbd className="ml-auto">⌘R</Kbd>
                  </ContextMenuItem>
                  <ContextMenuItem inset>Show Full URLs</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </div>
          </DemoContainer>
        </ComponentSection>

        {/* DATEN & TABELLEN */}
        <ComponentSection title="Data Display" id="cards">
          <DemoContainer title="Cards" id="data-cards" className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableCaption>Liste der letzten Transaktionen.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Rechnung</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Methode</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">INV001</TableCell>
                    <TableCell>Bezahlt</TableCell>
                    <TableCell>Kreditkarte</TableCell>
                    <TableCell className="text-right">250.00 €</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">INV002</TableCell>
                    <TableCell>Offen</TableCell>
                    <TableCell>PayPal</TableCell>
                    <TableCell className="text-right">150.00 €</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">INV003</TableCell>
                    <TableCell>Bezahlt</TableCell>
                    <TableCell>Überweisung</TableCell>
                    <TableCell className="text-right">350.00 €</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </DemoContainer>
        </ComponentSection>

        {/* CARDS & LAYOUT */}
        <ComponentSection title="Layout & Cards">
          <DemoContainer title="Card Example" id="card-example" className="p-0">
            <div className="p-6">
              <Card className="mx-auto w-full shadow-sm" style={{ maxWidth: "24rem" }}>
                <CardHeader>
                  <CardTitle>Benachrichtigungen</CardTitle>
                  <CardDescription>
                    Wähle aus, worüber du informiert werden möchtest.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex items-center space-x-4 rounded-md border p-4">
                    <BellRing className="size-5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-none font-medium">Push-Nachrichten</p>
                      <p className="text-muted-foreground text-sm">
                        Sende Benachrichtigungen an das Gerät.
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Check className="mr-2 size-4" /> Änderungen speichern
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </DemoContainer>

          <DemoContainer title="Tabs & Accordion" id="tabs-accordion">
            <div className="space-y-8">
              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="password">Passwort</TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                  <div className="bg-muted/20 rounded-md p-4 text-sm">
                    Account Einstellungen hier...
                  </div>
                </TabsContent>
                <TabsContent value="password">
                  <div className="bg-muted/20 rounded-md p-4 text-sm">Passwort ändern hier...</div>
                </TabsContent>
              </Tabs>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Ist das barrierefrei?</AccordionTrigger>
                  <AccordionContent>Ja. Es folgt dem WAI-ARIA Design Pattern.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Ist es styled?</AccordionTrigger>
                  <AccordionContent>
                    Ja. Es kommt mit Standard-Styles, die zum Theme passen.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </DemoContainer>

          <DemoContainer title="Carousel" id="carousel">
            <Carousel className="mx-auto w-full" style={{ maxWidth: "20rem" }}>
              <CarouselContent>
                {Array.from({ length: 5 }).map((_, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex aspect-square items-center justify-center p-6">
                          <span className="text-4xl font-semibold">{index + 1}</span>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </DemoContainer>
        </ComponentSection>

        {/* NAVIGATION */}
        <ComponentSection title="Navigation" id="breadcrumb">
          <DemoContainer title="Breadcrumb" id="breadcrumb-demo">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/components">Components</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </DemoContainer>

          <DemoContainer title="Pagination" id="pagination">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </DemoContainer>

          <DemoContainer title="Command" id="command">
            <Command className="rounded-lg border shadow-md">
              <CommandInput placeholder="Type a command or search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem>Calendar</CommandItem>
                  <CommandItem>Search Emoji</CommandItem>
                  <CommandItem>Calculator</CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Settings">
                  <CommandItem>Profile</CommandItem>
                  <CommandItem>Billing</CommandItem>
                  <CommandItem>Settings</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </DemoContainer>
        </ComponentSection>
      </div>
      <Toaster />
    </PageContent>
  )
}
