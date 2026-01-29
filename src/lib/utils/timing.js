export function leadingDebounce(fn, delay = 300) {
    let timer, last = 0;

    return (...args) => {
        const now = Date.now();
        clearTimeout(timer);

        if (now - last > delay) {
            last = now;
            fn(...args);
        } else {
            timer = setTimeout(() => {
                last = Date.now();
                fn(...args);
            }, delay);
        }
    };
}
