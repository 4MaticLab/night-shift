"use client";

import { useEffect, useRef, type RefObject } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(dialog: HTMLElement) {
  return [...dialog.querySelectorAll<HTMLElement>(focusableSelector)].filter((element) => {
    const style = window.getComputedStyle(element);
    return style.display !== "none"
      && style.visibility !== "hidden"
      && !element.closest("[inert]")
      && element.getClientRects().length > 0;
  });
}

export function useAccessibleDialog(
  dialogRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  { returnFocusSelector }: { returnFocusSelector?: string } = {},
) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const priorOverflow = document.body.style.overflow;
    const mutedElements: Array<{ element: HTMLElement; inert: string | null; ariaHidden: string | null }> = [];
    const layer = dialog.closest<HTMLElement>("[data-dialog-layer]") ?? dialog;
    let branch: HTMLElement = layer;

    while (branch.parentElement) {
      const parent = branch.parentElement;
      for (const sibling of parent.children) {
        if (!(sibling instanceof HTMLElement) || sibling === branch || sibling.matches("script, style")) continue;
        mutedElements.push({
          element: sibling,
          inert: sibling.getAttribute("inert"),
          ariaHidden: sibling.getAttribute("aria-hidden"),
        });
        sibling.setAttribute("inert", "");
        sibling.setAttribute("aria-hidden", "true");
      }
      branch = parent;
      if (parent === document.body) break;
    }

    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      const initialFocus = dialog.querySelector<HTMLElement>("[data-dialog-initial-focus]")
        ?? getFocusableElements(dialog)[0]
        ?? dialog;
      initialFocus.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(dialog);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1)!;
      const active = document.activeElement;
      if (!dialog.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = priorOverflow;
      for (const { element, inert, ariaHidden } of mutedElements) {
        if (inert === null) element.removeAttribute("inert");
        else element.setAttribute("inert", inert);
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
      const fallbackFocus = returnFocusSelector
        ? document.querySelector<HTMLElement>(returnFocusSelector)
        : null;
      (priorFocus?.isConnected && priorFocus !== document.body ? priorFocus : fallbackFocus)?.focus({ preventScroll: true });
    };
  }, [dialogRef, returnFocusSelector]);
}
