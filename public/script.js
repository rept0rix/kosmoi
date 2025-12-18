document.addEventListener('DOMContentLoaded', () => {
    const buyButton = document.getElementById('buy-btn');
    const productPrice = 1.00;

    if (buyButton) {
        buyButton.addEventListener('click', () => {
            // In a real scenario, this connects to Stripe/PayPal
            // For MVP, we simulate the success state
            const confirmPurchase = confirm(`Purchase Samui Fair Price Index for $${productPrice}?`);
            
            if (confirmPurchase) {
                alert('Transaction Successful. Accessing Fair Price Database...');
                // Here we would redirect to the secure content or unlock the data
                document.querySelector('.hero').innerHTML = `
                    <h2>Thank you!</h2>
                    <p>Access granted. Download your guide below.</p>
                    <button class="btn-primary">Download PDF</button>
                `;
            }
        });
    }
});