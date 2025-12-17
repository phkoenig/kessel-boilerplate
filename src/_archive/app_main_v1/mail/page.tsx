"use client"

import { useState } from "react"
import {
  Archive,
  ArrowRight,
  ChevronDown,
  Inbox,
  Mail,
  MoreVertical,
  Reply,
  ReplyAll,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

/**
 * E-Mail Client Demo-Seite.
 * Demonstriert ein vollständiges E-Mail-Interface mit Sidebar, Liste und Detailansicht.
 */
export default function MailPage(): React.ReactElement {
  const [selectedEmail, setSelectedEmail] = useState<number | null>(0)
  const [mutedThread, setMutedThread] = useState(false)

  const mailboxes = [
    { name: "Inbox", count: 128, icon: Inbox },
    { name: "Drafts", count: 9, icon: Mail },
    { name: "Sent", count: 0, icon: Send },
    { name: "Junk", count: 23, icon: X },
    { name: "Trash", count: 0, icon: Trash2 },
    { name: "Archive", count: 0, icon: Archive },
  ]

  const categories = [
    { name: "Social", count: 972 },
    { name: "Updates", count: 342 },
    { name: "Forums", count: 128 },
    { name: "Shopping", count: 8 },
    { name: "Promotions", count: 21 },
  ]

  const emails = [
    {
      id: 0,
      sender: "William Smith",
      initials: "WS",
      subject: "Meeting Tomorrow",
      preview:
        "Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's crucial that we align on our next steps...",
      time: "about 2 years ago",
      tags: ["meeting", "work", "important"],
      unread: false,
    },
    {
      id: 1,
      sender: "Alice Smith",
      initials: "AS",
      subject: "Re: Project Update",
      preview:
        "Thank you for the project update. It looks great! I've gone through the report, and the progress is impressive. The team has done a fantastic job, and I appreciate the hard...",
      time: "about 2 years ago",
      tags: ["work", "important"],
      unread: false,
    },
    {
      id: 2,
      sender: "Bob Johnson",
      initials: "BJ",
      subject: "Weekend Plans",
      preview:
        "Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It's been a while since we had some outdoor fun. If you're interested, let me know, and we...",
      time: "over 2 years ago",
      tags: ["personal"],
      unread: false,
    },
    {
      id: 3,
      sender: "Emily Davis",
      initials: "ED",
      subject: "Re: Question about Budget",
      preview:
        "I have a question about the budget for the upcoming project. It seems like there's a discrepancy in the allocation of resources. I've reviewed the budget report and identifi...",
      time: "over 2 years ago",
      tags: ["work", "budget"],
      unread: true,
    },
    {
      id: 4,
      sender: "Michael Wilson",
      initials: "MW",
      subject: "Important Announcement",
      preview:
        "I have an important announcement to make during our team meeting. It pertains to a strategic shift in our approach to the upcoming product launch. We've received valuabl...",
      time: "over 2 years ago",
      tags: [],
      unread: true,
    },
  ]

  const selectedEmailData = emails.find((e) => e.id === selectedEmail) || emails[0]

  return (
    <div className="flex h-full overflow-hidden rounded-lg border">
      {/* Left Sidebar */}
      <aside className="border-border flex w-64 flex-col border-r">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4">
          <h1 className="text-foreground text-lg font-semibold">Mail</h1>
        </div>

        {/* User Profile */}
        <div className="border-border flex items-center gap-3 border-b p-4">
          <Avatar>
            <AvatarFallback>MA</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">M Alicia Koch</p>
            <p className="text-muted-foreground text-xs">m@example.com</p>
          </div>
          <Button variant="ghost" size="icon">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Mailboxes */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {mailboxes.map((mailbox) => (
              <button
                key={mailbox.name}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors"
              >
                <div className="flex items-center gap-3">
                  <mailbox.icon className="h-4 w-4" />
                  <span>{mailbox.name}</span>
                </div>
                {mailbox.count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {mailbox.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          <Separator />

          {/* Categories */}
          <div className="p-2">
            {categories.map((category) => (
              <button
                key={category.name}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors"
              >
                <span>{category.name}</span>
                {category.count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Middle Column - Email List */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-border flex items-center gap-4 border-b p-4">
          <h2 className="text-foreground text-lg font-semibold">Inbox</h2>
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input className="pl-10" placeholder="Search" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              All mail
            </Button>
            <Button variant="outline" size="sm">
              Unread
            </Button>
          </div>
        </div>

        {/* Email List */}
        <ScrollArea className="flex-1">
          <div className="divide-border divide-y">
            {emails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelectedEmail(email.id)}
                className={`hover:bg-accent hover:text-accent-foreground flex w-full flex-col gap-2 p-4 text-left transition-colors ${
                  selectedEmail === email.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs">{email.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${email.unread ? "font-semibold" : ""}`}>
                        {email.sender}
                      </p>
                      <span className="text-muted-foreground text-xs">{email.time}</span>
                    </div>
                    <p className={`mt-1 text-sm ${email.unread ? "font-semibold" : ""}`}>
                      {email.subject}
                    </p>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {email.preview}
                    </p>
                    {email.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {email.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={tag === "important" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {email.unread && <div className="bg-primary h-2 w-2 rounded-full" />}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Column - Email Detail */}
      <div className="border-border flex w-[600px] flex-col border-l">
        {/* Email Header */}
        <div className="border-border flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Reply className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ReplyAll className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-muted-foreground text-xs">Oct 22, 2023, 9:00:00 AM</span>
        </div>

        {/* Email Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{selectedEmailData.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{selectedEmailData.sender}</p>
                    <p className="text-muted-foreground text-sm">
                      Reply-To: {selectedEmailData.sender.toLowerCase().replace(" ", "")}
                      @example.com
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">{selectedEmailData.subject}</p>
              </div>
            </div>

            <Separator />

            <div className="text-foreground space-y-4 whitespace-pre-wrap">
              <p>
                Hi, let&apos;s have a meeting tomorrow to discuss the project. I&apos;ve been
                reviewing the project details and have some ideas I&apos;d like to share. It&apos;s
                crucial that we align on our next steps to ensure the project&apos;s success.
              </p>
              <p>
                Please come prepared with any questions or insights you may have. Looking forward to
                our meeting!
              </p>
              <p>Best regards,</p>
              <p>William</p>
            </div>
          </div>
        </ScrollArea>

        {/* Reply Section */}
        <div className="border-border border-t p-4">
          <div className="space-y-4">
            <Input placeholder={`Reply ${selectedEmailData.sender}...`} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch id="mute-thread" checked={mutedThread} onCheckedChange={setMutedThread} />
                <Label htmlFor="mute-thread" className="text-sm">
                  Mute this thread
                </Label>
              </div>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
