import type { Meta, StoryObj } from "@storybook/react"
import { AddButton } from "./add-button"

const meta = {
  title: "UI/AddButton",
  component: AddButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
    text: {
      control: "text",
    },
    label: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof AddButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithText: Story = {
  args: {
    text: "Hinzufügen",
  },
}

export const Small: Story = {
  args: {
    size: "sm",
    text: "Neu",
  },
}

export const Large: Story = {
  args: {
    size: "lg",
    text: "Neues Element",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    text: "Hinzufügen",
  },
}
