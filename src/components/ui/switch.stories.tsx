import type { Meta, StoryObj } from "@storybook/react"
import { Switch } from "./switch"

const meta = {
  title: "UI/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    checked: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    checked: false,
  },
}

export const Checked: Story = {
  args: {
    checked: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    checked: false,
  },
}

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
}
