import type React from "react";
import {
  Terminal,
  FileEdit,
  Search,
  Eye,
  FilePlus,
  FolderOpen,
  ArrowRight,
  Wrench,
} from "lucide-react";

type IconComponent = React.ComponentType<{
  className?: string;
  size?: number;
}>;

const toolIconMap: Record<string, IconComponent> = {
  shell: Terminal,
  bash: Terminal,
  command: Terminal,
  terminal: Terminal,
  execute_command: Terminal,
  text_editor: FileEdit,
  editor: FileEdit,
  create_file: FileEdit,
  edit_file: FileEdit,
  write_file: FileEdit,
  update_file: FileEdit,
  replace_in_file: FileEdit,
  search: Search,
  grep: Search,
  find: Search,
  glob: Search,
  read: Eye,
  view: Eye,
  cat: Eye,
  write: FilePlus,
  list: FolderOpen,
  ls: FolderOpen,
  directory: FolderOpen,
  delegate: ArrowRight,
  task: ArrowRight,
};

export function getToolIcon(toolName: string): IconComponent {
  return toolIconMap[toolName] ?? Wrench;
}

function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

export function getToolDescription(
  toolName: string,
  args: Record<string, unknown>,
): string {
  const name = toolName.toLowerCase();

  if (
    name === "shell" ||
    name === "bash" ||
    name === "command" ||
    name === "terminal" ||
    name === "execute_command"
  ) {
    const cmd = String(args.command ?? args.cmd ?? "");
    return cmd ? `running ${truncate(cmd, 80)}` : name;
  }

  if (
    name === "text_editor" ||
    name === "editor" ||
    name === "create_file" ||
    name === "edit_file" ||
    name === "write_file" ||
    name === "update_file" ||
    name === "replace_in_file"
  ) {
    const path = String(args.path ?? args.file_path ?? args.file ?? "");
    const command = String(args.command ?? "").toLowerCase();
    if (command === "view") return path ? `reading ${path}` : name;
    if (name === "create_file" || name === "write_file") {
      return path ? `writing ${path}` : name;
    }
    return path ? `editing ${path}` : name;
  }

  if (
    name === "search" ||
    name === "grep" ||
    name === "find" ||
    name === "glob"
  ) {
    const pattern = String(args.pattern ?? args.query ?? "");
    return pattern ? `searching for '${pattern}'` : name;
  }

  if (name === "read" || name === "view" || name === "cat") {
    const path = String(args.path ?? args.file_path ?? args.file ?? "");
    return path ? `reading ${path}` : name;
  }

  if (name === "write") {
    const path = String(args.path ?? args.file_path ?? args.file ?? "");
    return path ? `writing ${path}` : name;
  }

  if (name === "list" || name === "ls" || name === "directory") {
    const path = String(args.path ?? args.dir ?? args.directory ?? "");
    return path ? `listing ${path}` : name;
  }

  if (name === "delegate" || name === "task") {
    const prompt = String(args.prompt ?? args.description ?? "");
    return prompt ? `delegating: ${truncate(prompt, 60)}` : name;
  }

  return toolName;
}
