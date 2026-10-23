import * as React from "react";

/**
 * Keeps a cmdk list inside a `PopoverContent` from scrolling the page to the top.
 *
 * cmdk scrolls its first item into view as soon as it mounts. The popup is not positioned yet at
 * that point (it sits at the top of the page), so on a long page the whole page jumps to the top.
 * Mount the list only once `listReady` is true, i.e. after the popup has been placed, and focus the
 * search box through `initialFocus` without scrolling.
 */
export function useComboboxPopup(open: boolean) {
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [listReady, setListReady] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setListReady(false);
      return;
    }
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setListReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [open]);

  const initialFocus = React.useCallback(() => {
    searchRef.current?.focus({ preventScroll: true });
    return false;
  }, []);

  return { searchRef, listReady, initialFocus };
}
