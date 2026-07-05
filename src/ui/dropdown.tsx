"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ActionDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
}

export function ActionDropdown({ trigger, children }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const positionPopover = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = popoverRef.current?.offsetHeight || 200;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top, left = rect.left;

    if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
      top = rect.top - 4;
      left = rect.right;
      setPopoverStyle({
        top,
        left,
        transform: "translate(-100%, -100%)",
        minWidth: "160px",
      });
    } else {
      top = rect.bottom + 4;
      left = rect.right;
      setPopoverStyle({
        top,
        left,
        transform: "translateX(-100%)",
        minWidth: "160px",
      });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("scroll", positionPopover, true);
      window.addEventListener("resize", positionPopover);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", positionPopover, true);
      window.removeEventListener("resize", positionPopover);
    };
  }, [isOpen, positionPopover]);

  const handleTriggerClick = () => {
    if (!isOpen) {
      positionPopover();
    }
    setIsOpen(!isOpen);
  };

  const popoverContent = (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="fixed z-50 rounded-2xl border border-border bg-surface p-2 shadow-lg"
      role="menu"
      onClick={() => setIsOpen(false)}
    >
      <div className="grid grid-cols-1 gap-1">
        {children}
      </div>
    </div>
  );

  return (
    <>
      <div ref={triggerRef} onClick={handleTriggerClick} className="inline-block">
        {trigger}
      </div>
      {isOpen && createPortal(popoverContent, document.body)}
    </>
  );
}
