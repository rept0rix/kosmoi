// Google Tag Manager Stub for Kosmoi PWA
(function (w, d, s, l, i) {
    w[l] = w[l] || []; w[l].push({
        'gtm.start':
            new Date().getTime(), event: 'gtm.js'
    }); var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
            'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-XXXXXX');

// Conversion Trigger Mock
window.dataLayer = window.dataLayer || [];
function trackConversion(event) {
    window.dataLayer.push({
        'event': 'conversion',
        'conversion_id': event
    });
    console.log(`[GTM] Conversion Tracked: ${event}`);
}
