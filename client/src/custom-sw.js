self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Exclude font URLs from being handled by the service worker
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        event.respondWith(fetch(event.request)); // Fetch directly from the network
        return;
    }
});