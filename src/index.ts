#!/usr/bin/env bun

import { Command } from "commander";
import { register } from "./app/commands";

const program = new Command();

program
  .name("gitu")
  .description("Cli tool to manage multiple git users")
  .version("1.0.0");

register(program);

program.parse();
