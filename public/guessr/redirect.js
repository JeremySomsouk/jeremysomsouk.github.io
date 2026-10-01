// Keep old shared room links working; destination is always our own game route.
location.replace(`/guessr/${location.search}${location.hash}`);
