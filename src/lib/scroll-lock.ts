let lockCount = 0;
let scrollY = 0;

export function lockBodyScroll() {
  if (lockCount === 0) {
    scrollY = window.scrollY;
    const body = document.body.style;
    body.position = "fixed";
    body.top = `-${scrollY}px`;
    body.left = "0";
    body.right = "0";
    body.overflowY = "scroll";
  }
  lockCount++;
  return () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      const body = document.body.style;
      body.position = "";
      body.top = "";
      body.left = "";
      body.right = "";
      body.overflowY = "";
      window.scrollTo(0, scrollY);
    }
  };
}
