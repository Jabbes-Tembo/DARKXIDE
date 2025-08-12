// This function is called by app.js when the page loads
function initializeCheckout() {
    const checkoutForm = document.getElementById('checkout-form');

    if (!checkoutForm) return;

    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('customer-name').value.trim();
        const email = document.getElementById('customer-email').value.trim();
        const cart = getCart(); // Uses the getCart() function from app.js
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (!name || !email || totalAmount <= 0) {
            alert('Please fill out your name and email, and ensure your cart is not empty.');
            return;
        }

        LencoPay.getPaid({
            // IMPORTANT: Replace with your actual Lenco Public Key for DarkXide
            key: 'pub-d2b32031aac01910d04cc4d50c7aa7354157181c0938577b',
            email: email,
            amount: totalAmount,
            currency: 'ZMW',
            reference: 'darkxide_' + Date.now(),
            label: `DarkXide Order - ${name}`,
            bearer: 'merchant',
            channels: ['card', 'mobile_money'],

            callback: function (response) {
                document.getElementById('cart-checkout-popup').style.display = 'none';
                alert('Payment successful! Verifying your order...');

                fetch('https://darkxide.netlify.app/.netlify/functions/verify-lenco-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reference: response.reference }),
                })
                .then(res => {
                    if (!res.ok) throw new Error('Verification failed on the server.');
                    return res.json();
                })
                .then(data => {
                    console.log('Verification successful:', data);
                    clearCart(); // Uses the clearCart() function from app.js
                    window.location.href = 'success.html';
                })
                .catch(error => {
                    console.error('Error during verification:', error);
                    alert('Your payment was successful, but we had trouble verifying it. Please contact support with reference: ' + response.reference);
                });
            },

            onClose: function () {
                alert('Payment process was canceled.');
            }
        });
    });
}