export function createResendCooldown(linkEl) {
  const defaultText = linkEl.textContent;
  let timer = null;
  let cooling = false;

  function start(seconds = 30) {
    clearInterval(timer);
    cooling = true;
    let left = seconds;
    linkEl.classList.add('opacity-50', 'pointer-events-none');
    linkEl.textContent = `Resend code in ${left}s`;

    timer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(timer);
        cooling = false;
        linkEl.classList.remove('opacity-50', 'pointer-events-none');
        linkEl.textContent = defaultText;
      } else {
        linkEl.textContent = `Resend code in ${left}s`;
      }
    }, 1000);
  }

  return { start, isCooling: () => cooling };
}