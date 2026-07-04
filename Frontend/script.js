const imgSlider = document.querySelector('.img-slider');
const items = document.querySelectorAll('.item');
const imgItems = document.querySelectorAll('.img-item');
const infoItems = document.querySelectorAll('.info-item');
const nextBtn = document.querySelector('.next-btn');
const prevBtn = document.querySelector('.prev-btn');

let colors = ['#3674be', '#d26181', '#ceb13d', '#c6414c', '#171f2b', '#50aa61'];
let indexSlider = 0;
let index = 0;

const BACKEND_URL = "/api";

function toggleAuthForms(event, formType) {
    event.preventDefault();
    if (formType === 'register') {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('register-section').style.display = 'block';
    } else {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('register-section').style.display = 'none';
    }
}

function handleRegister(event) {
    event.preventDefault();
    const regUser = document.getElementById('reg-username').value.trim();
    const regEmail = document.getElementById('reg-email').value.trim();
    const regPhone = document.getElementById('reg-phone').value.trim();
    const regAddress = document.getElementById('reg-address').value.trim();

    if (regUser === 'admin' || regUser === 'boss') {
        alert('This username is reserved! Please choose another.');
        return;
    }
    if (regPhone.length !== 10 || isNaN(regPhone)) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
    }
    if (regAddress.length < 10) {
        alert('Please enter a full detailed courier address.');
        return;
    }

    const userData = { username: regUser, email: regEmail, phone: regPhone, address: regAddress };
    localStorage.setItem('registeredUserData', JSON.stringify(userData));

    alert('Registration Successful! Please login via OTP verification.');
    document.getElementById('registerForm').reset();
    toggleAuthForms(event, 'login');
}

async function sendEmailOTP(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const localAccount = JSON.parse(localStorage.getItem('registeredUserData'));

    if (!localAccount || localAccount.email !== email) {
        alert("Email not found! Please register first.");
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/send-email-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('otpModal').style.display = 'flex';
            sessionStorage.setItem('tempEmail', email);
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Cannot connect to backend server.");
    }
}

async function verifyEmailOTP() {
    const code = document.getElementById('otp-code').value.trim();
    const email = sessionStorage.getItem('tempEmail');
    const localAccount = JSON.parse(localStorage.getItem('registeredUserData'));

    try {
        const response = await fetch(`${BACKEND_URL}/verify-email-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, otp: code })
        });
        const data = await response.json();
        
        if (data.success) {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('currentUser', JSON.stringify(localAccount));
            document.getElementById('otpModal').style.display = 'none';
            sessionStorage.removeItem('tempEmail');
            showMainContent();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("OTP validation failed.");
    }
}

function showMainContent() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.body.style.background = colors[index];
}

function handleLogout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('currentUser');
    window.location.reload();
}

window.onload = function() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        showMainContent();
    } else {
        document.body.style.background = '#1a1a2e';
    }
}

const slider = () => {
    imgSlider.style.transform = `rotate(${indexSlider * 60}deg)`;
    items.forEach(item => { item.style.transform = `rotate(${indexSlider * -60}deg)`; });
    document.querySelector('.img-item.active').classList.remove('active');
    imgItems[index].classList.add('active');
    document.querySelector('.info-item.active').classList.remove('active');
    infoItems[index].classList.add('active');
    document.body.style.background = colors[index];
}

nextBtn.addEventListener('click', () => { indexSlider++; index++; if (index > imgItems.length - 1) { index = 0; } slider(); });
prevBtn.addEventListener('click', () => { indexSlider--; index--; if (index < 0) { index = imgItems.length - 1; } slider(); });

const modal = document.getElementById('paymentModal');
const modalTitle = modal.querySelector('h3');

function openPayment() {
    const activeProduct = document.querySelector('.info-item.active h2').innerText;
    const activePrice = document.querySelector('.info-item.active h2:nth-child(2)').innerText;
    modalTitle.innerHTML = `Pay ${activePrice} <br><span style="font-size: 14px; color: #666; font-weight: normal;">for ${activeProduct}</span>`;
    modal.classList.add('open');
}

function closePayment() { modal.classList.remove('open'); setTimeout(hideCardForm, 300); }
modal.addEventListener('click', (e) => { if (e.target === modal) { closePayment(); } });

function showCardForm() {
    document.getElementById('payment-options').style.display = 'none';
    document.getElementById('card-form').style.display = 'block';
}

function hideCardForm() {
    document.getElementById('payment-options').style.display = 'block';
    document.getElementById('card-form').style.display = 'none';
    document.getElementById('card-number').value = '';
    document.getElementById('card-expiry').value = '';
    document.getElementById('card-cvv').value = '';
}

function saveOrderToStorage(product, price, method, status) {
    let orders = JSON.parse(localStorage.getItem('storeOrders')) || [];
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const orderId = method === "COD" ? `#COD-${randomId}` : `#RZP-${randomId}`;
    const user = JSON.parse(sessionStorage.getItem('currentUser')) || { username: 'Gamer', phone: 'N/A', email: 'N/A', address: 'N/A' };
    
    const newOrder = {
        id: orderId,
        product: product,
        price: price,
        method: method,
        status: status,
        custName: user.username,
        custPhone: user.phone,
        custEmail: user.email,
        custAddress: user.address
    };
    
    orders.push(newOrder);
    localStorage.setItem('storeOrders', JSON.stringify(orders));
}

function startRealPayment(paymentMethodLabel) {
    const activeProduct = document.querySelector('.info-item.active h2').innerText;
    const activePrice = parseFloat(document.querySelector('.info-item.active h2:nth-child(2)').innerText.replace('$', ''));
    const user = JSON.parse(sessionStorage.getItem('currentUser')) || { username: 'Gamer', email: 'gamer@example.com', phone: '9876543210' };

    var options = {
        "key": "YOUR_KEY_ID", 
        "amount": activePrice * 100 * 85,
        "currency": "INR",
        "name": "Zenith Gaming Store",
        "description": `Payment for ${activeProduct}`,
        "handler": function (response){
            alert("Payment Successful! ID: " + response.razorpay_payment_id);
            saveOrderToStorage(activeProduct, `$${activePrice}`, paymentMethodLabel, "Completed");
            closePayment();
        },
        "prefill": { "name": user.username, "email": user.email, "contact": user.phone },
        "theme": { "color": "#3674be" }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}

function processCardPayment() {
    const num = document.getElementById('card-number').value.trim();
    const exp = document.getElementById('card-expiry').value.trim();
    const cvv = document.getElementById('card-cvv').value.trim();
    if (num.length !== 16 || isNaN(num)) { alert('Please enter a valid 16-digit card number.'); return; }
    if (!exp.includes('/') || exp.length !== 5) { alert('Please enter expiry date in MM/YY format.'); return; }
    if (cvv.length !== 3 || isNaN(cvv)) { alert('Please enter a valid 3-digit CVV number.'); return; }
    startRealPayment("Card");
}

function processGPay() { startRealPayment("GPay"); }

function processCOD() { 
    const activeProduct = document.querySelector('.info-item.active h2').innerText;
    const activePrice = document.querySelector('.info-item.active h2:nth-child(2)').innerText;
    alert('Congratulations! Your Cash on Delivery (COD) order has been successfully confirmed.'); 
    saveOrderToStorage(activeProduct, activePrice, "COD", "Pending");
    closePayment(); 
}