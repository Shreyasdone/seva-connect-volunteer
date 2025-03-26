"use client"

import React, { useState, KeyboardEvent, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

export interface Tag {
  id: string;
  text: string;
}

interface TagsInputProps {
  placeholder?: string;
  tags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  className?: string;
  disabled?: boolean;
}

export const TagsInput = ({ 
  placeholder = "Add tag...", 
  tags, 
  onTagsChange, 
  className,
  disabled = false
}: TagsInputProps) => {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag()
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1].id)
    }
  }
  
  const addTag = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue && !tags.some(tag => tag.text.toLowerCase() === trimmedValue.toLowerCase())) {
      const newTag: Tag = {
        id: crypto.randomUUID(),
        text: trimmedValue
      }
      onTagsChange([...tags, newTag])
    }
    setInputValue("")
  }
  
  const removeTag = (id: string) => {
    if (disabled) return
    onTagsChange(tags.filter(tag => tag.id !== id))
  }
  
  return (
    <div 
      className={`flex flex-wrap gap-2 p-1 border rounded-md focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-red-500 ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map(tag => (
        <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
          {tag.text}
          {!disabled && (
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag.id)
              }}
            />
          )}
        </Badge>
      ))}
      <Input
        ref={inputRef}
        type="text"
        className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ""}
        disabled={disabled}
      />
    </div>
  )
}

// Export a simple Tag component as well
export const Tag = ({ text, onRemove }: { text: string; onRemove?: () => void }) => {
  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      {text}
      {onRemove && (
        <X 
          className="h-3 w-3 cursor-pointer" 
          onClick={onRemove}
        />
      )}
    </Badge>
  )
} 