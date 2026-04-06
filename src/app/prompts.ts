import prompts, { type PromptObject } from "prompts";
import type { AddProfileOptions } from "./types";

export type CompleteProfile = Required<AddProfileOptions>;

const requireInput = (value: string) =>
  value.trim().length > 0 ? true : "This field is required.";

export const addProfilePrompts = async (
  initial: AddProfileOptions = {},
): Promise<CompleteProfile> => {
  const allQuestions: PromptObject[] = [
    {
      type: "text",
      name: "name",
      message: "Enter profile name",
      validate: requireInput,
    },
    {
      type: "text",
      name: "username",
      message: "Enter profile username",
      validate: requireInput,
    },
    {
      type: "text",
      name: "email",
      message: "Enter profile email",
      validate: (value) => {
        if (value.trim().length === 0) return "Email is required.";
        if (!value.includes("@")) return "Please enter a valid email address.";
        return true;
      },
    },
    {
      type: "text",
      name: "file",
      message: "Enter path to ssh private key",
      validate: requireInput,
    },
  ];

  const questionsToAsk = allQuestions.filter(
    (q) => !initial[q.name as keyof AddProfileOptions],
  );

  if (questionsToAsk.length === 0) {
    return initial as CompleteProfile;
  }

  const answers = await prompts(questionsToAsk, {
    onCancel: () => {
      console.log("\n❌ Setup canceled by user.");
      process.exit(1);
    },
  });

  return { ...initial, ...answers } as CompleteProfile;
};

export const confirmRemoveProfile = async (name: string): Promise<boolean> => {
  const { confirmed } = await prompts(
    {
      type: "confirm",
      name: "confirmed",
      message: `Are you sure you want to remove profile '${name}'?`,
      initial: false,
    },
    {
      onCancel: () => {
        process.exit(1);
      },
    },
  );
  return confirmed ?? false;
};
