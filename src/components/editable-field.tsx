"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export type EditableFieldOption = {
  value: string;
  label: string;
};

type BaseProps = {
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  suffix?: string;
};

type TextFieldProps = BaseProps & {
  type: "text";
  value: string;
};

type NumberFieldProps = BaseProps & {
  type: "number";
  value: number;
  step?: number;
};

type SelectFieldProps = BaseProps & {
  type: "select";
  value: string;
  options: EditableFieldOption[];
};

type TextareaFieldProps = BaseProps & {
  type: "textarea";
  value: string;
};

export type EditableFieldProps = TextFieldProps | NumberFieldProps | SelectFieldProps | TextareaFieldProps;

export function EditableField(props: EditableFieldProps) {
  const { type, onSave, placeholder, className, displayClassName, suffix } = props;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(props.value));
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(String(props.value));
  }, [props.value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  function commit(val?: string) {
    const v = val ?? draft;
    if (v !== String(props.value)) {
      onSave(v);
    }
    setEditing(false);
  }

  function cancel() {
    setDraft(String(props.value));
    setEditing(false);
  }

  // Select type uses shadcn Select component (no manual editing state needed)
  if (type === "select") {
    const { value, options } = props as SelectFieldProps;
    const selectedLabel = options.find((o) => o.value === value)?.label ?? value ?? placeholder ?? "—";

    return (
      <Select
        value={value}
        onValueChange={(v: string | null) => {
          if (v) onSave(v);
        }}
      >
        <SelectTrigger
          className={cn(
            "h-auto border-transparent bg-transparent px-1.5 py-0.5 text-sm font-medium hover:border-border hover:bg-muted/50 transition-colors cursor-pointer",
            className
          )}
        >
          <SelectValue placeholder={placeholder}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Display mode for text, number, textarea
  if (!editing) {
    const displayValue =
      type === "number"
        ? (props as NumberFieldProps).value === 0
          ? placeholder ?? "0"
          : `${(props as NumberFieldProps).value}${suffix ?? ""}`
        : String(props.value) || placeholder || "—";

    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "group inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-sm font-medium hover:bg-muted/50 transition-colors cursor-pointer text-left",
          displayClassName,
          className
        )}
      >
        <span>{displayValue}</span>
        <Pencil className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors flex-shrink-0" />
      </button>
    );
  }

  // Edit mode for textarea
  if (type === "textarea") {
    return (
      <Textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit()}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          }
        }}
        className={cn("text-sm min-h-[60px]", className)}
        placeholder={placeholder}
      />
    );
  }

  // Edit mode for text and number
  return (
    <Input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={type === "number" ? "number" : "text"}
      step={type === "number" ? (props as NumberFieldProps).step ?? 0.25 : undefined}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => commit()}
      onKeyDown={(e) => {
        if (e.key === "Escape") cancel();
        if (e.key === "Enter") commit();
      }}
      className={cn("h-7 text-sm px-1.5", className)}
      placeholder={placeholder}
    />
  );
}
