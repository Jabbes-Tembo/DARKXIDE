// This function is called by app.js when the page loads
function initializeCheckout() {
    const checkoutForm = document.getElementById('checkout-form');
    // Ensure db is accessible from the global scope initialized in app.js
    const db = firebase.firestore();

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
            // **UPDATED**: Using the new public key from your lenco-payment.js file
            key: 'pub-fee8cd0fd73f0c17c91273a3840dc5b6571dd2db40164924',
            email: email,
            amount: totalAmount,
            currency: 'ZMW', // The currency is ZMW
            reference: 'darkxide_' + Date.now(),
            label: `DarkXide Order - ${name}`,
            bearer: 'merchant',
            channels: ['card', 'mobile_money'], // Channels include card and mobile money

            callback: function (response) {
                // Hide the checkout modal immediately
                const checkoutPopup = document.getElementById('cart-checkout-popup');
                if (checkoutPopup) checkoutPopup.style.display = 'none';

                alert('Payment successful! Verifying your order...');

                // Use the existing Netlify function endpoint for verification
                fetch('/.netlify/functions/verify-lenco-payment', {
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

                    // **NEW**: Save the verified order to Firestore
                    const orderData = {
                        customerName: name,
                        customerEmail: email,
                        items: cart,
                        totalAmount: totalAmount,
                        lencoReference: response.reference,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    return db.collection('orders').add(orderData);
                })
                .then(() => {
                    console.log('Order saved to Firestore successfully.');
                    clearCart(); // Uses the clearCart() function from app.js
                    window.location.href = 'success.html'; // Redirect to success page
                })
                .catch(error => {
                    console.error('Error during verification or order saving:', error);
                    alert('Your payment was successful, but we had trouble verifying and saving your order. Please contact support with reference: ' + response.reference);
                    window.location.href = 'failure.html';
                });
            },

            onClose: function () {
                alert('Payment process was canceled.');
            }
        });
    });
}