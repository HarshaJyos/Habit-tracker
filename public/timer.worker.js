
let timerId = null;

self.onmessage = (e) => {
  if (e.data === 'start') {
    if (!timerId) {
      // Run the timer every second
      timerId = setInterval(() => {
        postMessage('tick');
      }, 1000);
    }
  } else if (e.data === 'stop') {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }
};
