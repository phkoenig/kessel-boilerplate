import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { ExpandableSearch } from "./expandable-search"

const meta = {
  title: "UI/ExpandableSearch",
  component: ExpandableSearch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
      description: "Die Größe des Search-Buttons",
    },
    placeholder: {
      control: "text",
      description: "Placeholder-Text im Eingabefeld",
    },
  },
} satisfies Meta<typeof ExpandableSearch>

export default meta
type Story = StoryObj<typeof meta>

// Wrapper für kontrollierte Komponente
function ExpandableSearchControlled(props: React.ComponentProps<typeof ExpandableSearch>) {
  const [value, setValue] = useState("")
  return (
    <ExpandableSearch
      {...props}
      value={value}
      onChange={setValue}
      onSearch={(v) => alert(`Suche: "${v}"`)}
    />
  )
}

export const Default: Story = {
  render: (args) => <ExpandableSearchControlled {...args} />,
  args: {
    placeholder: "Suchen...",
  },
}

export const Small: Story = {
  render: (args) => <ExpandableSearchControlled {...args} />,
  args: {
    size: "sm",
    placeholder: "Suchen...",
  },
}

export const Large: Story = {
  render: (args) => <ExpandableSearchControlled {...args} />,
  args: {
    size: "lg",
    placeholder: "Suchen...",
  },
}

export const CustomPlaceholder: Story = {
  render: (args) => <ExpandableSearchControlled {...args} />,
  args: {
    placeholder: "Projekt durchsuchen...",
  },
}

// Alle Größen nebeneinander
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ExpandableSearchControlled size="sm" placeholder="Klein" />
      <ExpandableSearchControlled size="default" placeholder="Standard" />
      <ExpandableSearchControlled size="lg" placeholder="Groß" />
    </div>
  ),
}
